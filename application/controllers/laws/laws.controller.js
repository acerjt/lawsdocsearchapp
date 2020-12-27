
const {client} = require('../../connection/elastic-connect')
const {titles, pugFiles, laws, variables, lawsPaging, scripts} = require('../../common')


const getLawsInParticularPage = async (page, filter) => {
    try {
        page = page && page > 1 ? Number(page) : 1
        console.time('paging time')
        const {from, size, isOverTenThoudsandDocs, paginateDisplayConfiguration } =  await pagination(page)
        console.timeEnd('paging time')

        let aggsBody = {
            "query": {
                "bool": {
                    "filter": []
                }
            },
            "aggs": {
                "docType": {
                    "aggs": {
                        "Loại văn bản": {
                            "terms": {
                                "field": "docType",
                                "size": 10000
                            }
                        }
                    },
                    "filter": {
                        "bool": {
                            "must": []
                        }
                    }
                },
                "field": {
                    "aggs": {
                        "Lĩnh vực" : {
                            "terms": {
                                "field": "field",
                                "size": 10000
                            }
                        }
                    },
                    "filter": {
                        "bool": {
                            "must": []
                        }
                    }
                },
                "signedBy": {
                    "aggs": {
                        "Người ký" : {
                            "terms": {
                                "field": "signedBy",
                                "size": 10000
                            }
                        }
                    },
                    "filter": {
                        "bool": {
                            "must": []
                        }
                    }
                },
                "effectiveStatus": {
                    "aggs": {
                        "Tình trạng": {
                            "terms": {
                                "field": "effectiveStatus",
                                "size": 10000
                            }
                        }
                    },
                    "filter": {
                        "bool": {
                            "must": []
                        }
                    }
                },
                "agencyIssued": {
                    "aggs": {
                        "Cơ quan ban hành": {
                            "terms": {
                                "field": "agencyIssued",
                                "size": 10000
                            }
                        }
                    },
                    "filter": {
                        "bool": {
                            "must": []
                        }
                    }
                }
            },
            "sort": {
                "issuedDate": {
                    "order": "desc"
                },
                "tie_breaker_id": {
                    "order" : "desc"
                }
            }
        }
        for (let filterProp in filter) {
            let filterSearchTerm = {
                "term": {}   
            }
            filterSearchTerm.term[filterProp] = filter[filterProp]
            aggsBody.query.bool.filter.push(filterSearchTerm)
            for (let aggsBodyProp in aggsBody.aggs) {
                if(filterProp !== aggsBodyProp) {
                    let filterTerm = {
                        "term": {}   
                    }
                    filterTerm.term[filterProp] = filter[filterProp]
                    aggsBody.aggs[aggsBodyProp].filter.bool.must.push(filterTerm)
                }
            }
        }

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
                body: aggsBody
            })
            let endingPage = Math.ceil(body.hits.total.value / laws.lawsSearchSize)
            paginateDisplayConfiguration[0].endingPage = paginateDisplayConfiguration[0].endingPage > endingPage ? endingPage + 1 : paginateDisplayConfiguration[0].endingPage
            console.timeEnd('search time')
            return Promise.resolve({ lawsDoc: body.hits.hits, page, paginateDisplayConfiguration, aggs: body.aggregations})
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

const aggsAllInfor = async(filter) => {
    let aggsBody = {
        "post_filter": {
            "bool": {
                "must": []
            }
        },
        "aggs": {
            "docType": {
                "aggs": {
                    "Loại văn bản": {
                        "terms": {
                            "field": "docType",
                            "size": 10000
                        }
                    }
                },
                "filter": {
                    "bool": {
                        "must": []
                    }
                }
            },
            "field": {
                "aggs": {
                    "Lĩnh vực" : {
                        "terms": {
                            "field": "field",
                            "size": 10000
                        }
                    }
                },
                "filter": {
                    "bool": {
                        "must": []
                    }
                }
            },
            "signedBy": {
                "aggs": {
                    "Người ký" : {
                        "terms": {
                            "field": "signedBy",
                            "size": 10000
                        }
                    }
                },
                "filter": {
                    "bool": {
                        "must": []
                    }
                }
            },
            "effectiveStatus": {
                "aggs": {
                    "Tình trạng": {
                        "terms": {
                            "field": "effectiveStatus",
                            "size": 10000
                        }
                    }
                },
                "filter": {
                    "bool": {
                        "must": []
                    }
                }
            },
            "agencyIssued": {
                "aggs": {
                    "Cơ quan ban hành": {
                        "terms": {
                            "field": "agencyIssued",
                            "size": 10000
                        }
                    }
                },
                "filter": {
                    "bool": {
                        "must": []
                    }
                }
            }
        }
    }
    for (let filterProp in filter) {
        let filterSearchTerm = {
            "term": {}   
        }
        filterSearchTerm.term[filterProp] = filter[filterProp]
        aggsBody.post_filter.bool.must.push(filterSearchTerm)
        for (let aggsBodyProp in aggsBody.aggs) {
            if(filterProp !== aggsBodyProp) {
                let filterTerm = {
                    "term": {}   
                }
                filterTerm.term[filterProp] = filter[filterProp]
                aggsBody.aggs[aggsBodyProp].filter.bool.must.push(filterTerm)
            }
        }
    }
    console.log(JSON.stringify(aggsBody))
    const {body} = await client.search({
        index: laws.lawsIndex,
        size: 20,
        body: aggsBody
    })
    return body
}

const getViFieldName = (field) => {
    if(field === 'field') 
        return 'Lĩnh vực'
    else if(field === 'docType') 
        return 'Loại văn bản'
    else if(field === 'signedBy') 
        return 'Người ký'
    else if(field === 'effectiveStatus') 
        return 'Tình trạng'
    else if(field === 'agencyIssued') 
        return 'Cơ quan ban hành'
}


module.exports.getLaws = async (req, res) => {
    try {
        console.time('total time')
        let currentPage = req.query.p
        const {lv: field, lvb: docType, nk: signedBy, tt: effectiveStatus, cqbh: agencyIssued} = req.query
        const filter = {field, docType, signedBy, effectiveStatus, agencyIssued}
        for (let prop in filter) {
            if(filter[prop] === undefined)
            delete filter[prop]
        }
        let lawsData = await getLawsInParticularPage(currentPage, filter)
        console.time('render time')
        let aggs = await aggsAllInfor(filter)
        // if(aggs.hits.hits && lawsData.lawsDoc && lawsData.lawsDoc.length === 0)
        if(lawsData.lawsDoc && lawsData.lawsDoc.length === 0)
            res.render(pugFiles.error404, { title: titles.error404})
        else
            res.render(pugFiles.home, {
                title: titles.home, 
                lawsDoc:  lawsData.lawsDoc, 
                currentPage: lawsData.page,
                paginateDisplayConfiguration : lawsData.paginateDisplayConfiguration,
                aggs: aggs.aggregations,
                getViFieldName,
                filter
            })
        console.timeEnd('render time')
        console.timeEnd('total time')
    } catch (error) {
        console.log(error)
        res.render(pugFiles.error404, { title: titles.error404})
    }
}

module.exports.getLawById = async (req,res) => {
    try {
        let lawsDocId = req.params.id
        let lawDocument  = await getLawById(lawsDocId)
        if(lawDocument !== undefined)
            res.render(pugFiles.detailLaw, {lawDocument : lawDocument})
        else
            res.render(pugFiles.error404, { title: titles.error404})
    } catch (error) {
        console.log(error)
        res.render(pugFiles.error404, { title: titles.error404})
    }
}

module.exports.caculateRating = async (req, res) => {
    try {
        let {id, ratingValue} = req.body
        let result = await ratingDocument(id, ratingValue)
        res.send({s: 200, data: result})
    } catch (error) {
        console.log(error)
        res.send({s:400})
    }
}

module.exports.getLawsByFiltering = async (req, res) => {
    try {
        const {lv: field, lvb: docType, nk: signedBy, tt: effectiveStatus, cqbh: agencyIssued} = req.query
        const filter = {field, docType, signedBy, effectiveStatus, agencyIssued}
        for (let prop in filter) {
            if(filter[prop] === undefined)
                delete filter[prop]
        }
        let aggs = await aggsAllInfor(filter)
        res.render(pugFiles.home, { title: titles.home, lawsDoc : aggs.hits.hits, aggs: aggs.aggregations, getViFieldName});
    } catch(error) {
        console.log(error)
        res.render(pugFiles.error404, {title: titles.error404})
    }
}
