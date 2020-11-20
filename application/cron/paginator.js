const client = require('../connection/elastic-connect').client
const common = require('../common')
const {lawsIndex, maxResultWindow, lawsSearchSize, lawsPagingIndex, firstPageOverTenThousandDocument } = common
const { getTotalLawsDoc, countTotalIndexDocument, createIndex, deleteIndex, checkIndicesExists} = common
const {CronJob} = require('cron')


const get10000ThLawsDocument = async () => {
  try {
    let {body} = await client.search({
      index : lawsIndex,
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
    if (!checkIndicesExists(lawsPagingIndex))
      return true
    let countPagingIndexResult = await countTotalIndexDocument(lawsPagingIndex)
    if(onPage < firstPageOverTenThousandDocument + countPagingIndexResult || onPage === firstPageOverTenThousandDocument) {
      let {body} = await client.search({
        index: lawsPagingIndex,
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
        index : lawsIndex,
        size: lawsSearchSize,
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
    let totalLawsDocument = await getTotalLawsDoc()
    let lastPageOverTenThousandDocument = Math.ceil(totalLawsDocument / lawsSearchSize + 1)
    let {lastLawsDocumentIdForSearchAfter, lastLawsDocumentTimeForSearchAfter} = await get10000ThLawsDocument()
    let is10000thDocumentChanging = (await checkPagingChanged(lastLawsDocumentIdForSearchAfter, firstPageOverTenThousandDocument))
    if(is10000thDocumentChanging) {
      console.log('Paging changed')
      console.time('Index page')
      let isExistLawsPagingIndex = await checkIndicesExists(lawsPagingIndex)
      if(isExistLawsPagingIndex) {
        await deleteIndex(lawsPagingIndex).then(rs => console.log(`Delete ${lawsPagingIndex} successful: ${rs}`))
      }
      await createIndex(lawsPagingIndex).then(rs => console.log(`Create ${lawsPagingIndex} successful: ${rs}`))
      await indexPaging(lastPageOverTenThousandDocument,lastLawsDocumentTimeForSearchAfter, lastLawsDocumentIdForSearchAfter)
      console.timeEnd('Index page')
    } else {
      console.log('Paging not changed')
    }
  } catch (error) {
    console.log(error)
  }
}

const indexPaging = async (lastPageOverTenThousandDocument,lastLawsDocumentTimeForSearchAfter, lastLawsDocumentIdForSearchAfter) => {
  for(let page = firstPageOverTenThousandDocument; page < lastPageOverTenThousandDocument; page++) {
    let countPagingIndexResult = await countTotalIndexDocument(lawsPagingIndex)
    if(page > countPagingIndexResult + firstPageOverTenThousandDocument) {
      return indexPageForPagination()
    }
    let {body} = await client.search({
      index : lawsIndex,
      size: lawsSearchSize,
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
    await index(lawsPagingIndex, {lastLawsDocument: lastLawsDocumentIdForSearchAfter, page:  page, sortIssueDate : lastLawsDocumentTimeForSearchAfter})
    let lastDocumentOnCurrentPage = body.hits.hits[body.hits.hits.length - 1]
    lastLawsDocumentTimeForSearchAfter = lastDocumentOnCurrentPage.sort[0]
    lastLawsDocumentIdForSearchAfter = lastDocumentOnCurrentPage.sort[1]
  }
}

const get10000ThLawsDocument1 = async () => {
  try {
    let {body} = await client.search({
      index : lawsIndex,
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
    let totalLawsDocument = await getTotalLawsDoc()
    let pageInclude10000thDocument = maxResultWindow / lawsSearchSize 
    let lastPageOverTenThousandDocument = Math.ceil(totalLawsDocument / lawsSearchSize + 1)
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
        await index(lawsPagingIndex, {lastLawsDocument: lastLawsDocumentIdForSearchAfter, page:  page, sortIssueDate : lastLawsDocumentTimeForSearchAfter})
    }
    console.timeEnd('Index page')
  } catch (error) {
    console.log(error)
  }
}

calculatePaging = () => {
  let job = new CronJob('0 */10 * * * *', function() {
    console.log(new Date())
    indexPageForPagination()
  }, null, true, 'Asia/Ho_Chi_Minh');
  job.start();
}

module.exports = { calculatePaging }