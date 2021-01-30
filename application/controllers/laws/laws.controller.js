
const {client} = require('../../connection/elastic-connect')
const {titles, pugFiles, laws, variables, lawsPaging, scripts, func} = require('../../common')
let lastPage = 0 

const getLawsInParticularPage = async (page, filter, keyword) => {
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
            "post_filter": {
                "bool": {
                    "filter": []
                }
            },
            // "aggs": {
            //     "docType": {
            //         "aggs": {
            //             "Loại văn bản": {
            //                 "terms": {
            //                     "field": "docType",
            //                     "size": 10000
            //                 }
            //             }
            //         },
            //         "filter": {
            //             "bool": {
            //                 "must": []
            //             }
            //         }
            //     },
            //     "field": {
            //         "aggs": {
            //             "Lĩnh vực" : {
            //                 "terms": {
            //                     "field": "field",
            //                     "size": 10000
            //                 }
            //             }
            //         },
            //         "filter": {
            //             "bool": {
            //                 "must": []
            //             }
            //         }
            //     },
            //     "signedBy": {
            //         "aggs": {
            //             "Người ký" : {
            //                 "terms": {
            //                     "field": "signedBy",
            //                     "size": 10000
            //                 }
            //             }
            //         },
            //         "filter": {
            //             "bool": {
            //                 "must": []
            //             }
            //         }
            //     },
            //     "effectiveStatus": {
            //         "aggs": {
            //             "Tình trạng": {
            //                 "terms": {
            //                     "field": "effectiveStatus",
            //                     "size": 10000
            //                 }
            //             }
            //         },
            //         "filter": {
            //             "bool": {
            //                 "must": []
            //             }
            //         }
            //     },
            //     "agencyIssued": {
            //         "aggs": {
            //             "Cơ quan ban hành": {
            //                 "terms": {
            //                     "field": "agencyIssued",
            //                     "size": 10000
            //                 }
            //             }
            //         },
            //         "filter": {
            //             "bool": {
            //                 "must": []
            //             }
            //         }
            //     }
            // },
            "sort": {
                "issuedDate": {
                    "order": "desc"
                },
                "tie_breaker_id": {
                    "order" : "desc"
                }
            },
            "highlight": {
                "pre_tags" : ["<mark style='background-color:yellow'>"],
                "post_tags" : ["</mark>"],
                "fields": {
                    "desc": {}
                    // "agencyIssued": {},
                    // "contentText": {},
                    // "docNum": {},
                    // "docType": {},
                    // "field": {},
                    // "name": {},
                    // "signedBy": {}
                }
            }
        }
        if(keyword) {
            delete(aggsBody.sort)
            aggsBody.query.bool.must = {}
            aggsBody.query.bool.must.multi_match = {}
            aggsBody.query.bool.must.multi_match.query = keyword
            aggsBody.query.bool.must.multi_match.fields = [
                "desc",
                "desc.2gram_vi",
                "desc.2gram",
                "desc.3gram_vi",
                "desc.3gram",
                "contentText",
                "contentText.2gram_vi",
                "contentText.2gram",
                "contentText.3gram_vi",
                "contentText.3gram",
                "agencyIssued", 
				"docNum", 
				"docType", 
				"field", 
				"name",
				"signedBy"
            ]

        }
        for (let filterProp in filter) {
            let filterSearchTerm = {
                "term": {}   
            }
            filterSearchTerm.term[filterProp] = filter[filterProp]
            aggsBody.query.bool.filter.push(filterSearchTerm)
            aggsBody.post_filter.bool.filter.push(filterSearchTerm)

            // for (let aggsBodyProp in aggsBody.aggs) {
            //     if(filterProp !== aggsBodyProp) {
            //         let filterTerm = {
            //             "term": {}   
            //         }
            //         filterTerm.term[filterProp] = filter[filterProp]
            //         aggsBody.aggs[aggsBodyProp].filter.bool.must.push(filterTerm)
            //     }
            // }
        }
        console.log(JSON.stringify(aggsBody))
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
            console.log(body.hits.total.value)

            if(body.hits.total.value < variables.maxResultWindow) {
                let endingPage = Math.ceil(body.hits.total.value / laws.lawsSearchSize)
                paginateDisplayConfiguration[0].endingPage = paginateDisplayConfiguration[0].endingPage > endingPage ? endingPage + 1 : paginateDisplayConfiguration[0].endingPage
                console.log(endingPage)
            }
            let {aggs} = await aggsForFilter(filter)
            console.timeEnd('search time')
            return Promise.resolve({ lawsDoc: body.hits.hits, page, paginateDisplayConfiguration, aggs})
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
    const totalLawsDoc = await func.countTotalIndexDocument(laws.lawsIndex)
    const lastPage = Math.ceil(totalLawsDoc / laws.lawsSearchSize + 1)
    console.log(lastPage)
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

const ratingDocument = async (id, ratingValue) => {
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
const aggsForFilter = async (filter) => {
    const ITEMS_PER_PAGE = 10000;
    const uniqueDocType = [];
    const uniqueSignedBy = [];
    const uniqueField = [];
    const uniqueEffectiveStatus = [];
    const uniqueAgencyIssued = [];

    const body =  {
        "index": laws.lawsIndex,
        "size": 0,
        "body": {
            "aggs" : {
                "signedBy": {
                    "composite" : {
                        "size": ITEMS_PER_PAGE,
                        "sources" : [
                            { "signedBy": { "terms" : {"script": {}} } }
                        ]
                    }
                },
                "docType": {
                    "composite" : {
                        "size": ITEMS_PER_PAGE,
                        "sources" : [
                            { "docType": { "terms" : {"script": {}} } }
                        ]
                    }
                },
                "field": {
                    "composite" : {
                        "size": ITEMS_PER_PAGE,
                        "sources" : [
                            { "field": { "terms" : {"script": {}} } }
                        ]
                    }
                },
                "effectiveStatus": {
                    "composite" : {
                        "size": ITEMS_PER_PAGE,
                        "sources" : [
                            { "effectiveStatus": { "terms" : {"script": {}} } }
                        ]
                    }
                },
                "agencyIssued": {
                    "composite" : {
                        "size": ITEMS_PER_PAGE,
                        "sources" : [
                            { "agencyIssued": { "terms" : {"script": {}} } }
                        ]
                    }
                }
            }
        }
    };
    let signedByScriptString = `doc['signedBy'].value`
    let docTypeScriptString = `doc['docType'].value`
    let fieldScriptString = `doc['field'].value`
    let effectiveStatusScriptString = `doc['effectiveStatus'].value`
    let agencyIssuedScriptString = `doc['agencyIssued'].value`

    body.body.aggs.signedBy.composite.sources[0].signedBy.terms.script = signedByScriptString
    body.body.aggs.docType.composite.sources[0].docType.terms.script = docTypeScriptString
    body.body.aggs.field.composite.sources[0].field.terms.script = fieldScriptString
    body.body.aggs.effectiveStatus.composite.sources[0].effectiveStatus.terms.script = effectiveStatusScriptString
    body.body.aggs.agencyIssued.composite.sources[0].agencyIssued.terms.script = agencyIssuedScriptString

    for (let aggsBodyProp in body.body.aggs) {
        let str = `if(`
        let strArr = []
        for (let filterProp in filter) {
            if(filterProp !== aggsBodyProp) {
                strArr.push(` doc['${filterProp}'].value == '${filter[filterProp]}' `)
            }
        }
        str += strArr.join('&&') + ')' + ` return doc['${aggsBodyProp}'].value;`
        if(strArr.length)
            body.body.aggs[aggsBodyProp].composite.sources[0][aggsBodyProp].terms.script = str
    }
    console.log(JSON.stringify(body))
    while (true) {
        const result = await client.search(body);
        const currentUniqueDocType = result.body.aggregations.docType.buckets
        const currentUniqueSignedBy = result.body.aggregations.signedBy.buckets
        const currentUniqueField = result.body.aggregations.field.buckets
        const currentUniqueEffectiveStatus = result.body.aggregations.effectiveStatus.buckets
        const currentUniqueAgencyIssued = result.body.aggregations.agencyIssued.buckets


        uniqueDocType.push(...currentUniqueDocType);
        uniqueSignedBy.push(...currentUniqueSignedBy)
        uniqueField.push(...currentUniqueField)
        uniqueEffectiveStatus.push(...currentUniqueEffectiveStatus)
        uniqueAgencyIssued.push(...currentUniqueAgencyIssued)


        const afterDocType = result.body.aggregations.docType.after_key;
        const afterSignedBy = result.body.aggregations.signedBy.after_key;
        const afterField = result.body.aggregations.field.after_key;
        const afterEffectiveStatus = result.body.aggregations.effectiveStatus.after_key;
        const afterAgencyIssued = result.body.aggregations.agencyIssued.after_key;


        if (afterDocType || afterSignedBy) {
            body.body.aggs.signedBy.composite.after = afterSignedBy;
            body.body.aggs.docType.composite.after = afterDocType;
            body.body.aggs.field.composite.after = afterField;
            body.body.aggs.effectiveStatus.composite.after = afterEffectiveStatus;
            body.body.aggs.agencyIssued.composite.after = afterAgencyIssued;
            
        } else {
            break;
        }
    }
    let docType = uniqueDocType.sort(sortDocCount)
    let signedBy = uniqueSignedBy.sort(sortDocCount)
    let field = uniqueField.sort(sortDocCount)
    let effectiveStatus = uniqueEffectiveStatus.sort(sortDocCount)
    let agencyIssued = uniqueAgencyIssued.sort(sortDocCount)

    if(docType.length > 150)
        docType = docType.slice(0,150)
    if(signedBy.length > 150)
        signedBy = signedBy.slice(0,150)
    if(field.length > 150)
        field = field.slice(0,150)
    if(effectiveStatus.length > 150)
        effectiveStatus = effectiveStatus.slice(0,150)
    if(agencyIssued.length > 150)
        agencyIssued = agencyIssued.slice(0,150)
    return {
        aggs : {
            docType,
            signedBy,
            field,
            effectiveStatus,
            agencyIssued
        }
    }
}

const sortDocCount = (a, b) =>  {
    if(a.doc_count > b.doc_count)
        return -1
    else if(a.doc_count < b.doc_count)
        return 1
    else return 0
}

// module.exports.aggsForFilter = aggsForFilter
module.exports.getLaws = async (req, res) => {
    try {
        console.time('total time')
        let currentPage = req.query.p
        const {keyword, lv: field, lvb: docType, nk: signedBy, tt: effectiveStatus, cqbh: agencyIssued} = req.query
        const filter = {field, docType, signedBy, effectiveStatus, agencyIssued}
        for (let prop in filter) {
            if(filter[prop] === undefined)
            delete filter[prop]
        }
        let lawsData = await getLawsInParticularPage(currentPage, filter, keyword)
        console.time('render time')
        // let aggs = await aggsAllInfor(filter)
        // if(aggs.hits.hits && lawsData.lawsDoc && lawsData.lawsDoc.length === 0)
        if(lawsData.lawsDoc && lawsData.lawsDoc.length === 0)
            res.render(pugFiles.error404, { title: titles.error404})
        else
            res.render(pugFiles.home, {
                title: titles.home, 
                lawsDoc:  lawsData.lawsDoc, 
                currentPage: lawsData.page,
                paginateDisplayConfiguration : lawsData.paginateDisplayConfiguration,
                aggs: lawsData.aggs,
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

module.exports.getAutocompleteDesc = async (req, res) => {
    try {
        let {text} = req.body
        let {body} = await client.search({
            index: laws.lawsIndex,
            size: 10,
            body: {
                "_source": [
                    "href",
                    "name",
                    "desc",
                    "effectiveStatus"
                ],
                "query": {
                    "multi_match": {
                        "query": `${text}`,
                        "type": "bool_prefix",
                        "fields": [
                            "desc.autocomplete",
                            "desc.autocomplete_vi"
                        ]
                    }
                }
            }
        })
        res.send({s:200, data: body.hits.hits})
    } catch(error) {
        console.log(error)
        res.render(pugFiles.error404, {title: titles.error404})
    }
}

module.exports.searchLawsDoc = async (req, res) => {
    try {
        console.log(req.query)
    } catch(error) {
        console.log(error)
        res.render(pugFiles.error404, {title: titles.error404})
    }
}