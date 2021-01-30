const path = require('path')

const {client} = require('./connection/elastic-connect')

const variables = {
    maxResultWindow: 10000, // index.max_result_window
} 
const titles = {
    home: "Trang chủ",
    policy: "Điều khoản",
    contact: "Liên hệ",
    aboutUs: "Về chúng tôi",
    myAccount: "Trang cá nhân",
    assignUserRole: "Chuyển đổi quyền khách hàng",
    memberShips: "Gói dịch vụ",
    error404: "Không tìm thấy trang"
}

const pugFiles = {
    home: 'home',
    contactUs: 'contactUs',
    termOfUse: 'termOfUse',
    aboutUs: 'aboutUs',
    profileUser: 'profileUser',
    roleChange: 'roleChange',
    typeUser: 'typeUser',
    detailLaw: 'detailLaw',
    error404: 'error404'
}

const laws = {
    filePathStoreLawsData : path.resolve(__dirname, "./data/lawsv1.json"),
    lawsIndex : 'laws5',
    lawsSearchSize : 20,
    firstPageOverTenThousandDocument : variables.maxResultWindow / 20 + 1,
}


    
const lawsPaging = {
    lawsPagingIndex : 'pages1',
}

const func = {
    createIndex: async (index) => {
        try {
            let {body} = await client.indices.create({
                index : index
            })
            return body
        }
        catch(error) {
            return `Create ${index} index error: ${error}`
        }
    },
    checkIndicesExists: async (index) => {
        try {
            let {body} = await client.indices.exists({
                index: index
            })
            return body
        } catch(error) {
            return `Check ${index} index exists error: ${error}`
        }
    },
    deleteIndex: async (index) => {
        try {
            let {body} = await client.indices.delete({
                index : index
            })
            return body
        } catch (error) {
            return `Delete ${index} index error: ${error}`
        }
    },
    countTotalIndexDocument: async (index) => {
        try {
            let {body} = await client.count({
                index : index,
                ignore_unavailable: true
            })
            return Promise.resolve(body.count)
        } catch(err) {
            return Promise.reject(`Get total ${index} error: ` + err)
        } 
    }
}

const pipeline = {
    laws : {
        initLawsData: 'laws_gen_views-stars-ratings'
    }
}
const scripts = {
    laws: {
        ratingDoc: 'laws_rating_doc_and_update_wilson_score',
        calculateView: 'laws_caluculate_view'
    }
}

module.exports = {
    titles,
    pugFiles,
    variables,
    laws,
    lawsPaging,
    func,
    pipeline,
    scripts
}