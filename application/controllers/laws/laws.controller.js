
const {client} = require('../../connection/elastic-connect')
const {titles, pugFiles, laws, variables, lawsPaging, scripts, func} = require('../../common')
let lastPage = 0 

const getLawsInParticularPage = async (page, filter, keyword, searchAdvanced) => {
    try {
        page = page && page > 1 ? Number(page) : 1
        console.time('paging time')
        const ITEMS_PER_PAGE = 10000;
        const fieldName = ['docType', 'field', 'agencyIssued', 'signedBy', 'effectiveStatus']
        const multiMatchField = [
            "contentHtml",
            "contentHtml.2gram_vi",
            "contentHtml.2gram",
            "contentHtml.3gram_vi",
            "contentHtml.3gram",
            "desc",
            // "desc.vi_analyzer_folding_ascii",
            // "desc.vi_analyzer_without_folding_ascii",  
            "desc.2gram_vi",
            "desc.2gram",
            "desc.3gram_vi",
            "desc.3gram",
            // "issuedDate",
            "agencyIssued",
            "docNum",
            "docType",
            "field",
            "name",
            "signedBy"
            // "agencyIssued.vi_analyzer_folding_ascii",
            // "agencyIssued.vi_analyzer_without_folding_ascii",  
            // "docNum.vi_analyzer_folding_ascii",
            // "docNum.vi_analyzer_without_folding_ascii",  
            // "docType.vi_analyzer_folding_ascii",
            // "docType.vi_analyzer_without_folding_ascii", 
            // "field.vi_analyzer_folding_ascii",
            // "field.vi_analyzer_without_folding_ascii", 
            // "name.vi_analyzer_folding_ascii",
            // "name.vi_analyzer_without_folding_ascii",
            // "signedBy.vi_analyzer_folding_ascii",
            // "signedBy.vi_analyzer_without_folding_ascii",
        ]
        const {from, size, isOverTenThoudsandDocs, paginateDisplayConfiguration } =  await pagination(page)
        console.timeEnd('paging time')


        let docTypeProp = fieldName[0]
        let fieldProp = fieldName[1] 
        let agencyIssuedProp = fieldName[2] 
        let signedByProp = fieldName[3] 
        let effectiveStatusProp = fieldName[4] 
    

        let docTypescriptString = `doc['${docTypeProp}'].value`
        let fieldscriptString = `doc['${fieldProp}'].value`
        let agencyIssuedscriptString = `doc['${agencyIssuedProp}'].value`
        let signedByscriptString = `doc['${signedByProp}'].value`
        let effectiveStatusscriptString = `doc['${effectiveStatusProp}'].value`

        let docTypeAggsBodyString = {
            "size": 0,
            "aggs": {
                "docType": {
                    "terms": {
                    "size": ITEMS_PER_PAGE, 
                    "script": {}
                    }
                }
            }
        }

        let fieldAggsBodyString = {
            "size": 0,
            "aggs": {
                "field": {
                    "terms": {
                    "size": ITEMS_PER_PAGE, 
                    "script": {}
                    }
                }
            }
        }

        let agencyIssuedAggsBodyString = {
            "size": 0,
            "aggs": {
                "agencyIssued": {
                    "terms": {
                    "size": ITEMS_PER_PAGE, 
                    "script": {}
                    }
                }
            }
        }

        let signedByAggsBodyString = {
            "size": 0,
            "aggs": {
                "signedBy": {
                    "terms": {
                    "size": ITEMS_PER_PAGE, 
                    "script": {}
                    }
                }
            }
        }

        let effectiveStatusAggsBodyString = {
            "size": 0,
            "aggs": {
                "effectiveStatus": {
                    "terms": {
                    "size": ITEMS_PER_PAGE, 
                    "script": {}
                    }
                }
            }
        }

        let aggsBody = {
            "query": {
                "bool": {
                    "filter": [],
                    "must": [],
                    "should": [
                    ]
                }
            },
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
        aggsBody.from = from
        aggsBody.size = size

        docTypeAggsBodyString.aggs.docType.terms.script = docTypescriptString
        fieldAggsBodyString.aggs.field.terms.script = fieldscriptString
        agencyIssuedAggsBodyString.aggs.agencyIssued.terms.script = agencyIssuedscriptString
        signedByAggsBodyString.aggs.signedBy.terms.script = signedByscriptString
        effectiveStatusAggsBodyString.aggs.effectiveStatus.terms.script = effectiveStatusscriptString
    
        let str = `if(`
        let strArr = []
    
        for (let aggsBodyProp of fieldName) {
            let str = `if(`
            let strArr = []
            for (let filterProp in filter) {
                if(filterProp !== aggsBodyProp) {
                    strArr.push(` doc['${filterProp}'].value == '${filter[filterProp]}' `)
                }
            }
            str += strArr.join('&&') + ')' + ` return doc['${aggsBodyProp}'].value;`
            if(strArr.length) {
                if(aggsBodyProp === 'docType')
                    docTypeAggsBodyString.aggs[aggsBodyProp].terms.script = str
                else if(aggsBodyProp === 'field')
                    fieldAggsBodyString.aggs[aggsBodyProp].terms.script = str
                else if(aggsBodyProp === 'agencyIssued')
                    agencyIssuedAggsBodyString.aggs[aggsBodyProp].terms.script = str
                else if(aggsBodyProp === 'signedBy')
                    signedByAggsBodyString.aggs[aggsBodyProp].terms.script = str
                else if(aggsBodyProp === 'effectiveStatus')
                    effectiveStatusAggsBodyString.aggs[aggsBodyProp].terms.script = str
            }
        }
        if(keyword) {
            delete(aggsBody.sort)
            // aggsBody.sort = [
            //     { "_score": { "order": "desc" }},
            //     { "issuedDate":   { "order": "desc" }},
            // ]
            let queryString = {
                "multi_match": {
                    "query": keyword,
                    "fields": multiMatchField
                }
            }
            aggsBody.query.bool.must.push(queryString)
            // aggsBody.query.bool.must = {}
            // aggsBody.query.bool.must.multi_match = {}
            // aggsBody.query.bool.must.multi_match.query = keyword
            // aggsBody.query.bool.must.multi_match.fields = multiMatchField
            // docTypeAggsBodyString.query = aggsBody.query
            // fieldAggsBodyString.query = aggsBody.query
            // agencyIssuedAggsBodyString.query = aggsBody.query
            // signedByAggsBodyString.query = aggsBody.query
            // effectiveStatusAggsBodyString.query = aggsBody.query

        }
        for (let filterProp in filter) {
            let filterSearchTerm = {
                "term": {}   
            }
            filterSearchTerm.term[filterProp] = filter[filterProp]
            aggsBody.query.bool.filter.push(filterSearchTerm)
        }
        // console.log(searchAdvanced)
        if(searchAdvanced.rdAdvanced === 'rdExactly'){
            for(let searchInput in searchAdvanced){
                if(searchInput === 'ipDocName'){
                    // aggsBody.query.must = []
                    // if (searchAdvanced[searchInput]){
                        let searchNameQueryString = {}
                        searchNameQueryString.match_phrase = {}
                        searchNameQueryString.match_phrase.name = searchAdvanced[searchInput]
                        aggsBody.query.bool.must.push(searchNameQueryString)
                        console.log(aggsBody.query.bool.must)
                    // }
                }
                else if(searchInput === 'ipDocNum'){
                    // if (searchAdvanced[searchInput]){
                        let searchNameQueryString = {}
                        searchNameQueryString.match_phrase = {}
                        searchNameQueryString.match_phrase.docNum = searchAdvanced[searchInput]
                        aggsBody.query.bool.must.push(searchNameQueryString)
                    // }
                }
                else if(searchInput === 'ipIssuedDate'){
                    let searchNameQueryString = {}
                    searchNameQueryString.range = {}
                    searchNameQueryString.range.issuedDate = {}
                    searchNameQueryString.range.issuedDate.gte = searchAdvanced[searchInput]
                    searchNameQueryString.range.issuedDate.lte = searchAdvanced[searchInput]
                    aggsBody.query.bool.must.push(searchNameQueryString)
                }
                else if(searchInput === 'ipEffectiveDate'){
                    let searchNameQueryString = {}
                    searchNameQueryString.range = {}
                    searchNameQueryString.range.effectiveDate = {}
                    searchNameQueryString.range.effectiveDate.gte = searchAdvanced[searchInput]
                    searchNameQueryString.range.effectiveDate.lte = searchAdvanced[searchInput]
                    aggsBody.query.bool.must.push(searchNameQueryString)
                }
                else if(searchInput === 'ipEffectiveDate'){
                    let searchNameQueryString = {}
                    searchNameQueryString.range = {}
                    searchNameQueryString.range.effectiveDate = {}
                    searchNameQueryString.range.effectiveDate.gte = searchAdvanced[searchInput]
                    searchNameQueryString.range.effectiveDate.lte = searchAdvanced[searchInput]
                    aggsBody.query.bool.must.push(searchNameQueryString)
                }
                else if(searchInput === 'ipEffectiveStatus' && searchAdvanced[searchInput] !== 'allStatus' ){
                    let searchNameQueryString = {}
                        searchNameQueryString.term = {}
                        searchNameQueryString.term.effectiveStatus = {}
                        searchNameQueryString.term.effectiveStatus = searchAdvanced[searchInput]
                        aggsBody.query.bool.filter.push(searchNameQueryString)
                }
                else if(searchInput === 'ipField'){
                    let searchNameQueryString = {}
                        searchNameQueryString.term = {}
                        searchNameQueryString.term.field = {}
                        searchNameQueryString.term.field = searchAdvanced[searchInput]
                        aggsBody.query.bool.filter.push(searchNameQueryString)
                }
                else if(searchInput === 'ipDocType'){
                    let searchNameQueryString = {}
                        searchNameQueryString.term = {}
                        searchNameQueryString.term.docType = {}
                        searchNameQueryString.term.docType = searchAdvanced[searchInput]
                        aggsBody.query.bool.filter.push(searchNameQueryString)
                }
                else if(searchInput === 'ipAgencyIssued'){
                    let searchNameQueryString = {}
                        searchNameQueryString.term = {}
                        searchNameQueryString.term.agencyIssued = {}
                        searchNameQueryString.term.agencyIssued = searchAdvanced[searchInput]
                        aggsBody.query.bool.filter.push(searchNameQueryString)
                }
                else if(searchInput === 'ipSignedBy'){
                    let searchNameQueryString = {}
                        searchNameQueryString.term = {}
                        searchNameQueryString.term.signedBy = {}
                        searchNameQueryString.term.signedBy = searchAdvanced[searchInput]
                        aggsBody.query.bool.filter.push(searchNameQueryString)
                }
            }
        }
        else{
            for(let searchInput in searchAdvanced){
                if(searchInput === 'ipDocName'){
                    let searchNameQueryString = {}
                    searchNameQueryString.match = {}
                    searchNameQueryString.match.name = searchAdvanced[searchInput]
                    aggsBody.query.bool.must.push(searchNameQueryString)
                }
                else if(searchInput === 'ipDocNum'){
                    let searchNameQueryString = {}
                    searchNameQueryString.match = {}
                    searchNameQueryString.matc.docNum = searchAdvanced[searchInput]
                    aggsBody.query.bool.must.push(searchNameQueryString)
                }
                else if(searchInput === 'ipIssuedDate'){
                    let searchNameQueryString = {}
                    searchNameQueryString.range = {}
                    searchNameQueryString.range.issuedDate = {}
                    searchNameQueryString.range.issuedDate.gte = searchAdvanced[searchInput]
                    searchNameQueryString.range.issuedDate.lte = searchAdvanced[searchInput]
                    aggsBody.query.bool.must.push(searchNameQueryString)
                }
                else if(searchInput === 'ipEffectiveDate'){
                    let searchNameQueryString = {}
                    searchNameQueryString.range = {}
                    searchNameQueryString.range.effectiveDate = {}
                    searchNameQueryString.range.effectiveDate.gte = searchAdvanced[searchInput]
                    searchNameQueryString.range.effectiveDate.lte = searchAdvanced[searchInput]
                    aggsBody.query.bool.must.push(searchNameQueryString)
                }
                else if(searchInput === 'ipEffectiveDate'){
                    let searchNameQueryString = {}
                    searchNameQueryString.range = {}
                    searchNameQueryString.range.effectiveDate = {}
                    searchNameQueryString.range.effectiveDate.gte = searchAdvanced[searchInput]
                    searchNameQueryString.range.effectiveDate.lte = searchAdvanced[searchInput]
                    aggsBody.query.bool.must.push(searchNameQueryString)
                }
                else if(searchInput === 'ipEffectiveStatus' && searchAdvanced[searchInput] !== 'allStatus' ){
                    let searchNameQueryString = {}
                    searchNameQueryString.term = {}
                    searchNameQueryString.term.effectiveStatus = {}
                    searchNameQueryString.term.effectiveStatus = searchAdvanced[searchInput]
                    aggsBody.query.bool.filter.push(searchNameQueryString)
                }
                else if(searchInput === 'ipField'){
                    let searchNameQueryString = {}
                    searchNameQueryString.term = {}
                    searchNameQueryString.term.field = {}
                    searchNameQueryString.term.field = searchAdvanced[searchInput]
                    aggsBody.query.bool.filter.push(searchNameQueryString)
                }
                else if(searchInput === 'ipDocType'){
                    let searchNameQueryString = {}
                    searchNameQueryString.term = {}
                    searchNameQueryString.term.docType = {}
                    searchNameQueryString.term.docType = searchAdvanced[searchInput]
                    aggsBody.query.bool.filter.push(searchNameQueryString)
                }
                else if(searchInput === 'ipAgencyIssued'){
                    let searchNameQueryString = {}
                    searchNameQueryString.term = {}
                    searchNameQueryString.term.agencyIssued = {}
                    searchNameQueryString.term.agencyIssued = searchAdvanced[searchInput]
                    aggsBody.query.bool.filter.push(searchNameQueryString)
                }
                else if(searchInput === 'ipSignedBy'){
                    let searchNameQueryString = {}
                    searchNameQueryString.term = {}
                    searchNameQueryString.term.signedBy = {}
                    searchNameQueryString.term.signedBy = searchAdvanced[searchInput]
                    aggsBody.query.bool.filter.push(searchNameQueryString)
                }
            }
        }
        if(!filter.hasOwnProperty("effectiveStatus") && keyword) {
            let boostScoreString =   {
                            "match": {
                                "effectiveStatus": {
                                    "query": "Còn hiệu lực",
                                    "boost": 100
                                }
                            },
                        }
            aggsBody.query.bool.should.push(boostScoreString)
            boostScoreString = {
                "boosting": {
                    "positive": {
                      "term": {
                        "effectiveStatus": "Còn hiệu lực"
                      }
                    },
                    "negative": {
                      "term": {
                        "effectiveStatus": "Hết hiệu lực"
                      }
                    },
                    "negative_boost": 10
                }
            }
            aggsBody.query.bool.should.push(boostScoreString)

        }   
        console.log(JSON.stringify(aggsBody))
        
        if(!isOverTenThoudsandDocs) {
            console.time('search time')
            let {body} = await client.msearch({
                body: [
                    {index : laws.lawsIndex},
                    aggsBody,
                    {index : laws.lawsIndex},
                    docTypeAggsBodyString,
                    {index : laws.lawsIndex},
                    fieldAggsBodyString,
                    {index : laws.lawsIndex},
                    agencyIssuedAggsBodyString,
                    {index : laws.lawsIndex},
                    signedByAggsBodyString,
                    {index : laws.lawsIndex},
                    effectiveStatusAggsBodyString

                ]
                // filterPath: 'took,hits.hits',
                // _source: [
                //     "name",
                //     "desc",
                //     "issuedDate",
                //     "effectiveDate",
                //     "effectiveStatus",
                // ],
                // body: aggsBody
            })
            // console.log(body.hits.total.value)
            // console.log(body.responses)

            let docType = body.responses[1].aggregations.docType.buckets
            let field = body.responses[2].aggregations.field.buckets
            let agencyIssued = body.responses[3].aggregations.agencyIssued.buckets
            let signedBy = body.responses[4].aggregations.signedBy.buckets
            let effectiveStatus = body.responses[5].aggregations.effectiveStatus.buckets
        
            if(docType.length > 150)
                docType = docType.slice(0,150)
            if(field.length > 150)
                field = field.slice(0,150)
            if(agencyIssued .length > 150)
                agencyIssued     = agencyIssued .slice(0,150)
            if(signedBy .length > 150)
                signedBy     = agencyIssued .slice(0,150)
            if(effectiveStatus.length > 150)
                effectiveStatus = effectiveStatus.slice(0,150)
            if(body.responses[0].hits.total.value < variables.maxResultWindow) {
                let endingPage = Math.ceil(body.responses[0].hits.total.value / laws.lawsSearchSize)
                paginateDisplayConfiguration[0].endingPage = paginateDisplayConfiguration[0].endingPage > endingPage ? endingPage + 1 : paginateDisplayConfiguration[0].endingPage
                console.log(endingPage)
            }
            aggs = {docType, field, agencyIssued, signedBy, effectiveStatus}
            console.timeEnd('search time')
            return Promise.resolve({ lawsDoc: body.responses[0].hits.hits, page, paginateDisplayConfiguration, aggs})
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
                let searchBody = {
                    "query": {
                        "match_all": {}
                    },
                    "size": 20,
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
                let result = await client.msearch({
                    // index : laws.lawsIndex,
                    // size: laws.lawsSearchSize,
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
                    body: [
                        {index : laws.lawsIndex},
                        searchBody,
                        {index : laws.lawsIndex},
                        docTypeAggsBodyString,
                        {index : laws.lawsIndex},
                        fieldAggsBodyString,
                        {index : laws.lawsIndex},
                        agencyIssuedAggsBodyString,
                        {index : laws.lawsIndex},
                        signedByAggsBodyString,
                        {index : laws.lawsIndex},
                        effectiveStatusAggsBodyString
                    ]
                })            
                // console.log(JSON.stringify(result)    
                // console.log(result.body.responses[0])    
                let docType = result.body.responses[1].aggregations.docType.buckets
                let field = result.body.responses[2].aggregations.field.buckets
                let agencyIssued = result.body.responses[3].aggregations.agencyIssued.buckets
                let signedBy = result.body.responses[4].aggregations.signedBy.buckets
                let effectiveStatus = result.body.responses[5].aggregations.effectiveStatus.buckets
            
                if(docType.length > 150)
                    docType = docType.slice(0,150)
                if(field.length > 150)
                    field = field.slice(0,150)
                if(agencyIssued .length > 150)
                    agencyIssued     = agencyIssued .slice(0,150)
                if(signedBy .length > 150)
                    signedBy     = agencyIssued .slice(0,150)
                if(effectiveStatus.length > 150)
                    effectiveStatus = effectiveStatus.slice(0,150)
                if(result.body.responses[0].hits.total.value < variables.maxResultWindow) {
                    let endingPage = Math.ceil(result.body.responses[0].hits.total.value / laws.lawsSearchSize)
                    paginateDisplayConfiguration[0].endingPage = paginateDisplayConfiguration[0].endingPage > endingPage ? endingPage + 1 : paginateDisplayConfiguration[0].endingPage
                    console.log(endingPage)
                }
                aggs = {docType, field, agencyIssued, signedBy, effectiveStatus}
                console.timeEnd('search page time')
                console.timeEnd('search time')
                return Promise.resolve({ lawsDoc: result.body.responses[0].hits.hits, page : page, paginateDisplayConfiguration : paginateDisplayConfiguration, aggs})
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
    try {
        lawDocId = '/' + lawDocId
        let {body} = await client.search({
            index: laws.lawsIndex,
            body: {
                "query": {
                    "match": {
                        "href": lawDocId
                    }
                }
            }
        })
        if(body.hits.hits.length === 0)
            return
        await client.update({
            id: body.hits.hits[0]._id,
            index: laws.lawsIndex,
            body: {    
                "script" : {
                    "id": scripts.laws.calculateView
                }
            }
        })
        let result = await client.get({
            index: laws.lawsIndex,
            id: body.hits.hits[0]._id
        })
        return result.body
    }
    catch (error) {
        return new Error(`Get document error: ${error}`)
    }
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


// const aggsForFieldName = async (filter) => {
//     const ITEMS_PER_PAGE = 10000;
//     let docTypeProp = 'docType'
//     let fieldProp = 'field'
//     let agencyIssuedProp = 'agencyIssued'
//     let signedByProp = 'signedBy'
//     let effectiveStatusProp = 'effectiveStatus'

//     const body =  {
//         "index": laws.lawsIndex,
//         "size": 0,
//         "body": {
//             "aggs": {
//                 "docType": {
//                     "terms": {
//                     "size": ITEMS_PER_PAGE, 
//                     "script": {}
//                     }
//                 },
//                 "field": {
//                     "terms": {
//                     "size": ITEMS_PER_PAGE, 
//                     "script": {}
//                     }
//                 },
//                 "agencyIssued": {
//                     "terms": {
//                     "size": ITEMS_PER_PAGE, 
//                     "script": {}
//                     }
//                 },
//                 "signedBy": {
//                     "terms": {
//                     "size": ITEMS_PER_PAGE, 
//                     "script": {}
//                     }
//                 },
//                 "effectiveStatus": {
//                     "terms": {
//                     "size": ITEMS_PER_PAGE, 
//                     "script": {}
//                     }
//                 }
//             }
//         }
//     };
//     let docTypescriptString = `doc['${docTypeProp}'].value`
//     let fieldscriptString = `doc['${fieldProp}'].value`
//     let agencyIssuedscriptString = `doc['${agencyIssuedProp}'].value`
//     let signedByscriptString = `doc['${signedByProp}'].value`
//     let effectiveStatusscriptString = `doc['${effectiveStatusProp}'].value`

//     body.body.aggs.docType.terms.script = docTypescriptString
//     body.body.aggs.field.terms.script = fieldscriptString
//     body.body.aggs.agencyIssued.terms.script = agencyIssuedscriptString
//     body.body.aggs.signedBy.terms.script = signedByscriptString
//     body.body.aggs.effectiveStatus.terms.script = effectiveStatusscriptString

//     let str = `if(`
//     let strArr = []

//     for (let aggsBodyProp in body.body.aggs) {
//         let str = `if(`
//         let strArr = []
//         for (let filterProp in filter) {
//             if(filterProp !== aggsBodyProp) {
//                 strArr.push(` doc['${filterProp}'].value == '${filter[filterProp]}' `)
//             }
//         }
//         str += strArr.join('&&') + ')' + ` return doc['${aggsBodyProp}'].value;`
//         if(strArr.length)
//             body.body.aggs[aggsBodyProp].terms.script = str
//     }
//     // for (let filterProp in filter) {
//     //     if(filterProp !== fieldName) {
//     //         strArr.push(` doc['${filterProp}'].value == '${filter[filterProp]}' `)
//     //     }
//     // }
//     // str += strArr.join('&&') + ')' + ` return doc['${fieldName}'].value;`
//     // if(strArr.length)
//     //     body.body.aggs.data.terms.script = str
//     console.log(JSON.stringify(body))
//     const result = await client.search(body);
//     let docType = result.body.aggregations.docType.buckets
//     let field = result.body.aggregations.field.buckets
//     let agencyIssued = result.body.aggregations.agencyIssued.buckets
//     let signedBy = result.body.aggregations.signedBy.buckets
//     let effectiveStatus = result.body.aggregations.effectiveStatus.buckets

//     if(docType.length > 150)
//         docType = docType.slice(0,150)
//     if(field.length > 150)
//         field = field.slice(0,150)
//     if(agencyIssued .length > 150)
//         agencyIssued     = agencyIssued .slice(0,150)
//     if(signedBy .length > 150)
//         signedBy     = agencyIssued .slice(0,150)
//     if(effectiveStatus.length > 150)
//         effectiveStatus = effectiveStatus.slice(0,150)
//     return {
//         docType, field, agencyIssued, signedBy, effectiveStatus
//     }    
// }
const aggsForFieldName = async (filter, fieldName) => {
    const ITEMS_PER_PAGE = 10000;

    const body =  {
        "index": laws.lawsIndex,
        "size": 0,
        "body": {
            "aggs": {
                "data": {
                    "terms": {
                    "size": ITEMS_PER_PAGE, 
                    "script": {}
                    }
                }
            }
        }
    };
    let scriptString = `doc['${fieldName}'].value`

    body.body.aggs.data.terms.script = scriptString

    let str = `if(`
    let strArr = []

    // for (let aggsBodyProp in body.body.aggs) {
    //     let str = `if(`
    //     let strArr = []
    //     for (let filterProp in filter) {
    //         if(filterProp !== aggsBodyProp) {
    //             strArr.push(` doc['${filterProp}'].value == '${filter[filterProp]}' `)
    //         }
    //     }
    //     str += strArr.join('&&') + ')' + ` return doc['${aggsBodyProp}'].value;`
    //     if(strArr.length)
    //         body.body.aggs[aggsBodyProp].terms.script = str
    // }
    for (let filterProp in filter) {
        if(filterProp !== fieldName) {
            strArr.push(` doc['${filterProp}'].value == '${filter[filterProp]}' `)
        }
    }
    str += strArr.join('&&') + ')' + ` return doc['${fieldName}'].value;`
    if(strArr.length)
        body.body.aggs.data.terms.script = str
    const result = await client.search(body);
    let data = result.body.aggregations.data.buckets

    if(data.length > 150)
        data = data.slice(0,150)

    return {
        data
    }    
}
const aggsForFilter = async (filter) => {
    console.time('abc')
    // const {docType, field, agencyIssued, signedBy, effectiveStatus} = await aggsForFieldName(filter)
    const {data: docType} = await aggsForFieldName(filter, 'docType')
    const {data: field} = await aggsForFieldName(filter, 'field')
    const {data: agencyIssued} = await aggsForFieldName(filter, 'agencyIssued')
    const {data: signedBy} = await aggsForFieldName(filter, 'signedBy')
    const {data: effectiveStatus} = await aggsForFieldName(filter, 'effectiveStatus')

    console.timeEnd('abc')

    return {aggs: {docType, field, agencyIssued, signedBy, effectiveStatus}}
}

// const aggsForFilter = async (filter) => {
//     const ITEMS_PER_PAGE = 10000;
//     const uniqueDocType = [];
//     const uniqueSignedBy = [];
//     const uniqueField = [];
//     const uniqueEffectiveStatus = [];
//     const uniqueAgencyIssued = [];

//     const body =  {
//         "index": laws.lawsIndex,
//         "size": 0,
//         "body": {
//             "aggs" : {
//                 "signedBy": {
//                     "composite" : {
//                         "size": ITEMS_PER_PAGE,
//                         "sources" : [
//                             { "signedBy": { "terms" : {"script": {}} } }
//                         ]
//                     }
//                 },
//                 "docType": {
//                     "composite" : {
//                         "size": ITEMS_PER_PAGE,
//                         "sources" : [
//                             { "docType": { "terms" : {"script": {}} } }
//                         ]
//                     }
//                 },
//                 "field": {
//                     "composite" : {
//                         "size": ITEMS_PER_PAGE,
//                         "sources" : [
//                             { "field": { "terms" : {"script": {}} } }
//                         ]
//                     }
//                 },
//                 "effectiveStatus": {
//                     "composite" : {
//                         "size": ITEMS_PER_PAGE,
//                         "sources" : [
//                             { "effectiveStatus": { "terms" : {"script": {}} } }
//                         ]
//                     }
//                 },
//                 "agencyIssued": {
//                     "composite" : {
//                         "size": ITEMS_PER_PAGE,
//                         "sources" : [
//                             { "agencyIssued": { "terms" : {"script": {}} } }
//                         ]
//                     }
//                 }
//             }
//         }
//     };
//     let signedByScriptString = `doc['signedBy'].value`
//     let docTypeScriptString = `doc['docType'].value`
//     let fieldScriptString = `doc['field'].value`
//     let effectiveStatusScriptString = `doc['effectiveStatus'].value`
//     let agencyIssuedScriptString = `doc['agencyIssued'].value`

//     body.body.aggs.signedBy.composite.sources[0].signedBy.terms.script = signedByScriptString
//     body.body.aggs.docType.composite.sources[0].docType.terms.script = docTypeScriptString
//     body.body.aggs.field.composite.sources[0].field.terms.script = fieldScriptString
//     body.body.aggs.effectiveStatus.composite.sources[0].effectiveStatus.terms.script = effectiveStatusScriptString
//     body.body.aggs.agencyIssued.composite.sources[0].agencyIssued.terms.script = agencyIssuedScriptString

//     for (let aggsBodyProp in body.body.aggs) {
//         let str = `if(`
//         let strArr = []
//         for (let filterProp in filter) {
//             if(filterProp !== aggsBodyProp) {
//                 strArr.push(` doc['${filterProp}'].value == '${filter[filterProp]}' `)
//             }
//         }
//         str += strArr.join('&&') + ')' + ` return doc['${aggsBodyProp}'].value;`
//         if(strArr.length)
//             body.body.aggs[aggsBodyProp].composite.sources[0][aggsBodyProp].terms.script = str
//     }
//     console.log(JSON.stringify(body))
//     while (true) {
//         const result = await client.search(body);
//         const currentUniqueDocType = result.body.aggregations.docType.buckets
//         const currentUniqueSignedBy = result.body.aggregations.signedBy.buckets
//         const currentUniqueField = result.body.aggregations.field.buckets
//         const currentUniqueEffectiveStatus = result.body.aggregations.effectiveStatus.buckets
//         const currentUniqueAgencyIssued = result.body.aggregations.agencyIssued.buckets


//         uniqueDocType.push(...currentUniqueDocType);
//         uniqueSignedBy.push(...currentUniqueSignedBy)
//         uniqueField.push(...currentUniqueField)
//         uniqueEffectiveStatus.push(...currentUniqueEffectiveStatus)
//         uniqueAgencyIssued.push(...currentUniqueAgencyIssued)


//         const afterDocType = result.body.aggregations.docType.after_key;
//         const afterSignedBy = result.body.aggregations.signedBy.after_key;
//         const afterField = result.body.aggregations.field.after_key;
//         const afterEffectiveStatus = result.body.aggregations.effectiveStatus.after_key;
//         const afterAgencyIssued = result.body.aggregations.agencyIssued.after_key;


//         if (afterDocType || afterSignedBy) {
//             body.body.aggs.signedBy.composite.after = afterSignedBy;
//             body.body.aggs.docType.composite.after = afterDocType;
//             body.body.aggs.field.composite.after = afterField;
//             body.body.aggs.effectiveStatus.composite.after = afterEffectiveStatus;
//             body.body.aggs.agencyIssued.composite.after = afterAgencyIssued;
            
//         } else {
//             break;
//         }
//     }
//     let docType = uniqueDocType.sort(sortDocCount)
//     let signedBy = uniqueSignedBy.sort(sortDocCount)
//     let field = uniqueField.sort(sortDocCount)
//     let effectiveStatus = uniqueEffectiveStatus.sort(sortDocCount)
//     let agencyIssued = uniqueAgencyIssued.sort(sortDocCount)

//     if(docType.length > 150)
//         docType = docType.slice(0,150)
//     if(signedBy.length > 150)
//         signedBy = signedBy.slice(0,150)
//     if(field.length > 150)
//         field = field.slice(0,150)
//     if(effectiveStatus.length > 150)
//         effectiveStatus = effectiveStatus.slice(0,150)
//     if(agencyIssued.length > 150)
//         agencyIssued = agencyIssued.slice(0,150)
//     return {
//         aggs : {
//             docType,
//             signedBy,
//             field,
//             effectiveStatus,
//             agencyIssued
//         }
// //     }
// }

const getUniqueDocType = async () => {
    const ITEMS_PER_PAGE = 10000;
    const uniqueDocType = [];
    const body =  {
        "index": laws.lawsIndex,
        "size": 0,
        "body": {
            "aggs" : {
                "docType": {
                    "composite" : {
                        "size": ITEMS_PER_PAGE,
                        "sources" : [
                            { "docType": { "terms" : {"script": {}} } }
                        ]
                    }
                },
            }
        }
    };
    
    let docTypeScriptString = `doc['docType'].value`
    
    body.body.aggs.docType.composite.sources[0].docType.terms.script = docTypeScriptString
    
    while (true) {
        const result = await client.search(body);
        const currentUniqueDocType = result.body.aggregations.docType.buckets
    
        uniqueDocType.push(...currentUniqueDocType);

        const afterDocType = result.body.aggregations.docType.after_key;

        if (afterDocType) {
            body.body.aggs.docType.composite.after = afterDocType;
 
        } else {
            break;
        }
    }
    let docType = uniqueDocType.map(item => {
        return item.key.docType
    })
    // if(docType.length > 150)
    //     docType = docType.slice(0,150)

    return {
        docType
    }
}

const getUniqueField = async () => {
    const ITEMS_PER_PAGE = 10000;
    const uniqueField = [];
    const body =  {
        "index": laws.lawsIndex,
        "size": 0,
        "body": {
            "aggs" : {
                "field": {
                    "composite" : {
                        "size": ITEMS_PER_PAGE,
                        "sources" : [
                            { "field": { "terms" : {"script": {}} } }
                        ]
                    }
                },
            }
        }
    };
    
    let fieldScriptString = `doc['field'].value`
    
    body.body.aggs.field.composite.sources[0].field.terms.script = fieldScriptString
    
    while (true) {
        const result = await client.search(body);
        const currentUniqueField = result.body.aggregations.field.buckets
    
        uniqueField.push(...currentUniqueField);

        const afterField = result.body.aggregations.field.after_key;

        if (afterField) {
            body.body.aggs.field.composite.after = afterField;
 
        } else {
            break;
        }
    }
    let field = uniqueField.map(item => {
        return item.key.field
    })
    
    return {
        field
    }
}

const getUniqueSignedBy = async () => {
    const ITEMS_PER_PAGE = 10000;
    const uniqueSignedBy = [];
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
            }
        }
    };
    
    let signedbyScriptString = `doc['signedBy'].value`
    
    body.body.aggs.signedBy.composite.sources[0].signedBy.terms.script = signedbyScriptString
    
    while (true) {
        const result = await client.search(body);
        const currentUniqueSignedBy= result.body.aggregations.signedBy.buckets
    
        uniqueSignedBy.push(...currentUniqueSignedBy);

        const afterSignedBy = result.body.aggregations.signedBy.after_key;

        if (afterSignedBy) {
            body.body.aggs.signedBy.composite.after = afterSignedBy;
 
        } else {
            break;
        }
    }
    let signedBy = uniqueSignedBy.map(item => {
        return item.key.signedBy
    })
    
    return {
        signedBy
    }
}

const getUniqueAgencyIssued = async () => {
    const ITEMS_PER_PAGE = 10000;
    const uniqueAgencyIssued = [];
    const body =  {
        "index": laws.lawsIndex,
        "size": 0,
        "body": {
            "aggs" : {
                "agencyIssued": {
                    "composite" : {
                        "size": ITEMS_PER_PAGE,
                        "sources" : [
                            { "agencyIssued": { "terms" : {"script": {}} } }
                        ]
                    }
                },
            }
        }
    };
    
    let agencyIssuedScriptString = `doc['agencyIssued'].value`
    
    body.body.aggs.agencyIssued.composite.sources[0].agencyIssued.terms.script = agencyIssuedScriptString
    
    while (true) {
        const result = await client.search(body);
        const currentUniqueAgencyIssued = result.body.aggregations.agencyIssued.buckets
    
        uniqueAgencyIssued.push(...currentUniqueAgencyIssued);

        const afterAgencyIssued = result.body.aggregations.agencyIssued.after_key;

        if (afterAgencyIssued) {
            body.body.aggs.agencyIssued.composite.after = afterAgencyIssued;
 
        } else {
            break;
        }
    }
    let agencyIssued = uniqueAgencyIssued.map(item => {
        return item.key.agencyIssued
    })
        return {
        agencyIssued
    }
}


const sortDocCount = (a, b) =>  {
    if(a.doc_count > b.doc_count)
        return -1
    else if(a.doc_count < b.doc_count)
        return 1
    else return 0
}
const encodeVN = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return str;
  }

const getLawsNameVi = (name) => {
    if(name[0] === 'VanBanHuongDan')
        return 'Văn Bản Hướng Dẫn'
    else if (name[0] === 'VanBanBiDinhChinh')
        return 'Văn Bản Bị Đính Chính'
    else if (name[0] === 'VanBanDuocHuongDan')
        return 'Văn Bản Được Hướng Dẫn'
    else if (name[0] === 'VanBanLienQuanNgonNgu')
        return 'Văn Bản Liên Quan Ngôn Ngữ'
    else if (name[0] === 'VanBanBiSuaDoiBoSung')
        return 'Văn Bản Bị Sửa Đổi Bổ Sung'
    else if (name[0] === 'VanBanDinhChinh')
        return 'Văn Bản Đính Chính'
    else if (name[0] === 'VanBanDuocDanChieu')
        return 'Văn Bản Được Dân Chiếu'
    else if (name[0] === 'VanBanThayThe')
        return 'Văn Bản Thay Thế'   
    else if (name[0] === 'VanBanBiThayThe')
        return 'Văn Bản Bị Thay Thế'   
    else if (name[0] === 'VanBanSuaDoiBoSung')
        return 'Văn Bản Sửa Đổi Bổ Sung'
    else if (name[0] === 'VanBanDuocHopNhat')
        return 'Văn Bản Được Hợp Nhất'
    else if (name[0] === 'VanBanDuocCanCu')
        return 'Văn Bản Được Căn Cứ'
    else if (name[0] === 'VanBanHopNhat')
        return 'Văn Bản Hợp Nhất'
} 


// module.exports.aggsForFilter = aggsForFilter
module.exports.getLaws = async (req, res) => {
    try {
        console.time('total time')
        let currentPage = req.query.p
        let {rdAdvanced, ipDocName, ipField, ipDocNum, ipDocType, ipIssuedDate, ipAgencyIssued, ipEffectiveDate, ipSignedBy, ipEffectiveStatus} = req.query
        let searchAdvanced = {rdAdvanced, ipDocName, ipField, ipDocNum, ipDocType, ipIssuedDate, ipAgencyIssued, ipEffectiveDate, ipSignedBy, ipEffectiveStatus}
        
        const {keyword, lv: field, lvb: docType, nk: signedBy, tt: effectiveStatus, cqbh: agencyIssued} = req.query
        const filter = {field, docType, signedBy, effectiveStatus, agencyIssued}
        for (let prop in filter) {
            if(filter[prop] === undefined)
                delete filter[prop]
        }
        for (let searchInput in searchAdvanced){
            // if(searchAdvanced[searchInput] === undefined)
            if(!searchAdvanced[searchInput])
                delete searchAdvanced[searchInput]
        }
        let lawsData = await getLawsInParticularPage(currentPage, filter, keyword, searchAdvanced)
        console.time('render time')
        if(lawsData.lawsDoc && lawsData.lawsDoc.length === 0) {
            res.render(pugFiles.error404, { title: titles.error404, aggs: lawsData.aggs, getViFieldName, keyword})
        }
        else
            res.render(pugFiles.home, {
                title: titles.home, 
                lawsDoc:  lawsData.lawsDoc, 
                currentPage: lawsData.page,
                paginateDisplayConfiguration : lawsData.paginateDisplayConfiguration,
                aggs: lawsData.aggs,
                getViFieldName,
                filter,
                keyword
            })
        console.timeEnd('render time')
        console.timeEnd('total time')
    } catch (error) {
        console.log(error)
        res.render(pugFiles.error404, { title: titles.error404, aggs: [], getViFieldName})
    }
}

module.exports.getLawById = async (req,res) => {
    try {
        let lawsDocId = req.params.id
        let lawDocument  = await getLawById(lawsDocId)
        if(lawDocument !== undefined)
            res.render(pugFiles.detailLaw, {lawDocument : lawDocument, getLawsNameVi})
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

module.exports.getAutocompleteDocType = async (req, res) => {
    try {
        let {docType} = await getUniqueDocType() 
        
        let {text} = req.body
        let filterDocType = docType.filter(item => {
            item = encodeVN(item.toLowerCase())
            text = encodeVN(text.toLowerCase())
            return item.includes(text)
        })
        res.send({s:200, data: filterDocType})
    } catch(error) {
        console.log(error)
        res.render(pugFiles.error404, {title: titles.error404})
    }
}

module.exports.getAutocompleteField = async (req, res) => {
    try {
        let {field} = await getUniqueField() 
        
        let {text} = req.body
        let filterField = field.filter(item => {
            item = encodeVN(item.toLowerCase())
            text = encodeVN(text.toLowerCase())
            return item.includes(text)
        })
        res.send({s:200, data: filterField})
    } catch(error) {
        console.log(error)
        res.render(pugFiles.error404, {title: titles.error404})
    }
}

module.exports.getAutocompleteSignedBy = async (req, res) => {
    try {
        let {signedBy} = await getUniqueSignedBy() 
        
        let {text} = req.body
        let filterSignedBy = signedBy.filter(item => {
            item = encodeVN(item.toLowerCase())
            text = encodeVN(text.toLowerCase())
            return item.includes(text)
        })
        res.send({s:200, data: filterSignedBy})
    } catch(error) {
        console.log(error)
        res.render(pugFiles.error404, {title: titles.error404})
    }
}

module.exports.getAutocompleteAgencyIssued = async (req, res) => {
    try {
        let {agencyIssued} = await getUniqueAgencyIssued() 
        
        let {text} = req.body
        let filterAgencyIssued = agencyIssued.filter(item => {
            item = encodeVN(item.toLowerCase())
            text = encodeVN(text.toLowerCase())
            return item.includes(text)
        })
        res.send({s:200, data: filterAgencyIssued})
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

