
const client = require('../../connection/elastic-connect').client


const getLawsInParticularPage = (page) => {
    return new Promise((resolve, reject) => {
        page = page && page > 1 ? Number(page) : 1
        const {from, size, isOverTenThoudsandDocs, paginateDisplayConfiguration } = pagination(page)
        if(!isOverTenThoudsandDocs) {
            client.search({
                index : 'laws',
                body: {
                    "query": {
                        "match_all": {}
                    },
                    from, from,
                    size: size,
                    sort: {
                        "issuedDate": {
                            "order": "desc"
                      }
                    }
                }
            }).then(({body}) => {
                return resolve({ lawsDoc: body.hits.hits, page : page, paginateDisplayConfiguration : paginateDisplayConfiguration})
            }).catch(error => {
                console.log(error) 
                reject(error)
            })
        }
        else {
            return reject('More than 1000 documents')
        }
        })
}

const pagination = (page) => {
    const size = 10
    const max_result_window = 10000 // index.max_result_window 
    const from = page * size - size
    let isOverTenThoudsandDocs = false
    let startingPage = page - page % 10 + 1
    let endingPage = startingPage + 10
    let pageIncrementJumping = 1
    
    if(page % 10 === 0) {
        startingPage -= 1
        console.log(startingPage)
    }
    
    let paginateDisplayConfiguration = [
        {
            startingPage,
            endingPage,
            pageIncrementJumping,
        }
    ]


    if (from + size > max_result_window)
        isOverTenThoudsandDocs = true

    return { from : from, size : size, isOverTenThoudsandDocs : isOverTenThoudsandDocs, paginateDisplayConfiguration : paginateDisplayConfiguration}
}


module.exports.getLaws = async (req, res) => {
    try {
        let currentPage = req.query.page
        return getLawsInParticularPage(currentPage).then(rs => {
            return {s: 200, lawsData: rs}
        }).catch(error => {
            return {s: 400, msg: error}
        })
    } catch (error) {
        return {s: 400, msg: error}
    }
}
