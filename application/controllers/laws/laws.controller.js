
const {client} = require('../../connection/elastic-connect')
const {titles, pugFiles, laws, variables, lawsPaging, scripts} = require('../../common')


const getLawsInParticularPage = async (page) => {
    try {
        page = page && page > 1 ? Number(page) : 1
        console.time('paging time')
        const {from, size, isOverTenThoudsandDocs, paginateDisplayConfiguration } =  await pagination(page)
        console.timeEnd('paging time')
        if(!isOverTenThoudsandDocs) {
            console.time('search time')
            let {body} = await client.search({
                index : laws.lawsIndex,
                from: from,
                size: size,
                // filterPath: 'took,hits.hits',
                // _source: [
                //     "name",
                //     "desc",
                //     "issuedDate",
                //     "effectiveDate",
                //     "effectiveStatus",
                // ],
                body: {
                    "sort": {
                        "issuedDate": {
                            "order": "desc"
                        },
                        "tie_breaker_id": {
                            "order" : "desc"
                        }
                    }
                }
            })
            console.timeEnd('search time')
            return Promise.resolve({ lawsDoc: body.hits.hits, page : page, paginateDisplayConfiguration : paginateDisplayConfiguration})
        }
        else {
            console.time('search time')
            console.time('search page id time')
            let {body} = await client.search({
                index: lawsPaging.lawsPagingIndex,
                body: {
                    query : {
                        match : {
                            "page" : page
                        }
                    }
                }
            })
            console.timeEnd('search page id time')
            if(body.hits.hits[0]) {
                console.time('search page time')
                let {lastLawsDocument, sortIssueDate} = body.hits.hits[0]._source
                let result = await client.search({
                    index : laws.lawsIndex,
                    size: laws.lawsSearchSize,
                    // _source: [
                    //     "name",
                    //     "desc",
                    //     "docType",
                    //     "docNum",
                    //     "issuedDate",
                    //     "effectiveDate",
                    //     "numOfAnnouncement",
                    //     "effectiveStatus",
                    // ],
                    body: {
                        "query": {
                            "match_all": {}
                        },
                        "search_after": [sortIssueDate, lastLawsDocument],
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
                console.timeEnd('search page time')
                console.timeEnd('search time')
                return Promise.resolve({ lawsDoc: result.body.hits.hits, page : page, paginateDisplayConfiguration : paginateDisplayConfiguration})
            }
            return Promise.resolve({ lawsDoc: [], page : page, paginateDisplayConfiguration : paginateDisplayConfiguration})
        }
    } catch (error) {
        return Promise.reject(new Error(`Get laws document on page ${page}: ` + error.message))
    }
}

const pagination = async (page) => {
    const size = laws.lawsSearchSize
    const maxDocumentsResultReturn = variables.maxResultWindow  // index.max_result_window 
    const from = page * size - size
    let isOverTenThoudsandDocs = false
    let startingPage = page - page % 10 + 1
    let endingPage = startingPage + 10
    let pageIncrementJumping = 1
    const totalLawsDoc = await laws.getTotalLawsDoc()
    const lastPage = Math.ceil(totalLawsDoc / laws.lawsSearchSize + 1)
    if(page % 10 === 0) {
        startingPage -= 1
    }

    if(endingPage > lastPage)
        endingPage = lastPage 

    let paginateDisplayConfiguration = [
        {
            startingPage,
            endingPage,
            pageIncrementJumping,
        }
    ]


    if (from + size > maxDocumentsResultReturn)
        isOverTenThoudsandDocs = true

    return { from : from, size : size, isOverTenThoudsandDocs : isOverTenThoudsandDocs, paginateDisplayConfiguration : paginateDisplayConfiguration}
}
const getLawById = async (lawDocId) => {
    lawDocId = '/' + lawDocId
    let {body} = await client.search({
        index: laws.lawsIndex,
        body: {
            "query" : {
                "match" : {
                    "href": lawDocId
                }   
            }
        }
    })
    return body.hits.hits[0]
}

const ratingDocument = async (id,ratingValue) => {
    try {
        await client.update({
            id: id,
            index: laws.lawsIndex,
            body: {    
                "script" : {
                    "id": scripts.laws.ratingDoc,
                    "params": {
                        "rating": ratingValue
                    }
                }
            }
        })
        let { body } = await client.get({
            index: laws.lawsIndex,
            id: id
        })
        return body._source
    }
    catch (error) {
        return new Error(`Rating document error: ${error}`)
    }
}

module.exports.getLaws = async (req, res) => {
    try {
        console.time('total time')
        let currentPage = req.query.page
        let lawsData = await getLawsInParticularPage(currentPage)
        console.time('render time')
        res.render(pugFiles.home, {
            title: titles.home, 
            lawsDoc: lawsData.lawsDoc && lawsData.lawsDoc.length === 0 ? [] : lawsData.lawsDoc, 
            currentPage: lawsData.page,
            paginateDisplayConfiguration : lawsData.paginateDisplayConfiguration
        })
        console.timeEnd('render time')
        console.timeEnd('total time')
    } catch (error) {
        console.log(error)
        res.render(pugFiles.home, { title: titles.home, lawsDoc : []});
    }
}

module.exports.getLawById = async (req,res) => {
    try {
        let lawsDocId = req.params.id
        let lawDocument  = await getLawById(lawsDocId)
        res.render(pugFiles.detailLaw, {lawDocument : lawDocument})
    } catch (error) {
        console.log(error)
        res.render(pugFiles.error404)
    }
}

module.exports.caculateRating = async (req, res) => {
    try {
        let {id, ratingValue} = req.body
        let result = await ratingDocument(id, ratingValue)
        res.send({s: 200, data: result})
    } catch (error) {
        console.log(error)
        res.render(pugFiles.error404)
    }
}
