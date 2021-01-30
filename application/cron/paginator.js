const client = require('../connection/elastic-connect').client
const common = require('../common')
const {laws, variables, lawsPaging, func} = common
const {CronJob} = require('cron')
let isDoingPagingCron = false
const get10000ThLawsDocument = async () => {
  try {
    let {body} = await client.search({
      index : laws.lawsIndex,
      from: 9999,
      size: 1,
      body: {
        "query": {
          "match_all": {}
        },
        "sort": [
          {
            "issuedDate": {
              "order": "desc"
            },
            "tie_breaker_id": {
              "order" : "desc"
            }
          }
        ]
      }
    })
    let lastDocumentOnCurrentPage = body.hits.hits[0]
    return Promise.resolve({lastLawsDocumentIdForSearchAfter: lastDocumentOnCurrentPage.sort[1], lastLawsDocumentTimeForSearchAfter: lastDocumentOnCurrentPage.sort[0]})
  } catch(error) {
    return Promise.reject(`Get 10000th laws document error: ` + error.message)
  }
}

const index = async (index, source) => {
  try {
    let {body} = await client.index({
      index: index,
      body : source,
      refresh: true
    })
  }
  catch(error) {
    console.log(`indexing ${index} error: ${error}`)
  }
}
const checkPagingChanged = async (currentDocumentID, onPage) => {
  try {
    if (!func.checkIndicesExists(lawsPaging.lawsPagingIndex))
      return true
    let countPagingIndexResult = await func.countTotalIndexDocument(lawsPaging.lawsPagingIndex)
    if(onPage < laws.firstPageOverTenThousandDocument + countPagingIndexResult || onPage === laws.firstPageOverTenThousandDocument) {
      let {body} = await client.search({
        index: lawsPaging.lawsPagingIndex,
        body: {
          "query": {
            "match": {
              "page" : onPage
            }
          }
        }
      })
      if(body.hits.hits.length === 0) {
        console.log('Empty: ', onPage, currentDocumentID, body.hits.hits)
        return true
      } 
      let lastLawsDocumentTimeForSearchAfter = body.hits.hits[0]._source.sortIssueDate
      let lastLawsDocumentIdForSearchAfter = body.hits.hits[0]._source.lastLawsDocument
      if(currentDocumentID !== lastLawsDocumentIdForSearchAfter){
        console.log('Diff Id', onPage, lastLawsDocumentIdForSearchAfter, currentDocumentID)
        return true
      }
      let result = await client.search({
        index : laws.lawsIndex,
        size: laws.lawsSearchSize,
        body: {
          "query": {
            "match_all": {}
          },
          "search_after": [lastLawsDocumentTimeForSearchAfter, lastLawsDocumentIdForSearchAfter],
          "sort": [
            {
              "issuedDate": {
                "order": "desc"
              },
              "tie_breaker_id": {
                "order" : "desc"
              }
            }
          ],
          "_source" : [
            "tie_breaker_id"
          ]
        }
      })  
      currentDocumentID = result.body.hits.hits[result.body.hits.hits.length -1]._source.tie_breaker_id
      // console.log('Checking page: ', onPage)
      return checkPagingChanged(currentDocumentID, onPage + 1)
    }
    return false
  }catch(error) {
    return `Check paging change error: ${error}`
  }
}
const indexPageForPagination = async () => {
  try {
    let totalLawsDocument =  await func.countTotalIndexDocument(laws.lawsIndex)
    let lastPageOverTenThousandDocument = Math.ceil(totalLawsDocument / laws.lawsSearchSize + 1)
    let {lastLawsDocumentIdForSearchAfter, lastLawsDocumentTimeForSearchAfter} = await get10000ThLawsDocument()
    let is10000thDocumentChanging = (await checkPagingChanged(lastLawsDocumentIdForSearchAfter, laws.firstPageOverTenThousandDocument))
    if(is10000thDocumentChanging) {
      console.log('Paging changed')
      console.time('Index page')
      let isExistLawsPagingIndex = await func.checkIndicesExists(lawsPaging.lawsPagingIndex)
      if(isExistLawsPagingIndex) {
        await func.deleteIndex(lawsPaging.lawsPagingIndex).then(rs => console.log(`Delete ${lawsPaging.lawsPagingIndex} successful: ${rs}`))
      }
      await func.createIndex(lawsPaging.lawsPagingIndex).then(rs => console.log(`Create ${lawsPaging.lawsPagingIndex} successful: ${rs}`))
      await indexPaging(lastPageOverTenThousandDocument,lastLawsDocumentTimeForSearchAfter, lastLawsDocumentIdForSearchAfter)
      console.timeEnd('Index page')
      isDoingPagingCron = !isDoingPagingCron
    } else {
      isDoingPagingCron = !isDoingPagingCron
      console.log('Paging not changed')
    }
  } catch (error) {
    console.log(error)
  }
}

const indexPaging = async (lastPageOverTenThousandDocument,lastLawsDocumentTimeForSearchAfter, lastLawsDocumentIdForSearchAfter) => {
  for(let page = laws.firstPageOverTenThousandDocument; page < lastPageOverTenThousandDocument; page++) {
    let countPagingIndexResult = await func.countTotalIndexDocument(lawsPaging.lawsPagingIndex)
    if(page > countPagingIndexResult + laws.firstPageOverTenThousandDocument) {
      return indexPageForPagination()
    }
    let {body} = await client.search({
      index : laws.lawsIndex,
      size: laws.lawsSearchSize,
      body: {
        "query": {
          "match_all": {},
        },
        "_source": false,
        "search_after": [lastLawsDocumentTimeForSearchAfter, lastLawsDocumentIdForSearchAfter],
        "sort": [
          {
            "issuedDate": {
              "order": "desc"
            },
            "tie_breaker_id": {
              "order" : "desc"
            }
          }
        ]
      }
    })
    await index(lawsPaging.lawsPagingIndex, {lastLawsDocument: lastLawsDocumentIdForSearchAfter, page:  page, sortIssueDate : lastLawsDocumentTimeForSearchAfter})
    let lastDocumentOnCurrentPage = body.hits.hits[body.hits.hits.length - 1]
    lastLawsDocumentTimeForSearchAfter = lastDocumentOnCurrentPage.sort[0]
    lastLawsDocumentIdForSearchAfter = lastDocumentOnCurrentPage.sort[1]
  }
}

const get10000ThLawsDocument1 = async () => {
  try {
    let {body} = await client.search({
      index : laws.lawsIndex,
      size: 20,
      scroll: "30s",
      body: {
        "query": {
          "match_all": {}
        },
        "sort": [
          {
            "issuedDate": {
              "order": "desc"
            },
            "tie_breaker_id": {
              "order" : "desc"
            }
          }
        ]
      }
    })
    let scrollID = body._scroll_id
    return Promise.resolve({scrollID: scrollID})
  } catch(error) {
    return Promise.reject(`Get 10000th laws document error: ` + error.message)
  }
}
const getTime = (time) => {
  let splitTime = time.split('/')
  let timestamp = new Date(splitTime[2], splitTime[1] - 1, splitTime[0]).getTime()
  return timestamp
}
const indexPageForPagination1 = async () => {
  try {
    console.time('Index page')
    let totalLawsDocument = await laws.getTotalLawsDoc()
    let pageInclude10000thDocument = variables.maxResultWindow / laws.lawsSearchSize 
    let lastPageOverTenThousandDocument = Math.ceil(totalLawsDocument / laws.lawsSearchSize + 1)
    let {scrollID} = await get10000ThLawsDocument1()
    for(let page = 2; page < lastPageOverTenThousandDocument; page++) {
      let {body} = await client.scroll({
        scroll_id: scrollID,
        scroll : '10s'
      })
      let lastDocumentOnCurrentPage = body.hits.hits[body.hits.hits.length - 1]
      lastLawsDocumentTimeForSearchAfter = getTime(lastDocumentOnCurrentPage._source.issuedDate)
      lastLawsDocumentIdForSearchAfter = lastDocumentOnCurrentPage._source.tie_breaker_id
      if(page > pageInclude10000thDocument)
        await index(lawsPaging.lawsPagingIndex, {lastLawsDocument: lastLawsDocumentIdForSearchAfter, page:  page, sortIssueDate : lastLawsDocumentTimeForSearchAfter})
    }
    console.timeEnd('Index page')
  } catch (error) {
    console.log(error)
  }
}

calculatePaging = () => {
  let job = new CronJob('0 * * * * *', function() {
    console.log(new Date())
    if(!isDoingPagingCron) {
      isDoingPagingCron = !isDoingPagingCron
      console.log(isDoingPagingCron)
      indexPageForPagination()
    }
  }, null, true, 'Asia/Ho_Chi_Minh');
  job.start();
}

module.exports = { calculatePaging }