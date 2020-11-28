const path = require('path')

const {client} = require('./connection/elastic-connect')

const filePathStoreLawsData = path.resolve(__dirname, "./data/lawsv1.json")
const lawsIndex = 'laws'
const lawsPagingIndex = 'pages1'
const lawsSearchSize = 20
const maxResultWindow = 10000 // index.max_result_window
const firstPageOverTenThousandDocument = maxResultWindow / lawsSearchSize + 1

const titles = {
    home: "Trang chủ",
    policy: "Điều khoản",
    contact: "Liên hệ",
    aboutUs: "Về chúng tôi",
    myAccount: "Trang cá nhân",
    assignUserRole: "Chuyển đổi quyền khách hàng",
    memberShips: "Gói dịch vụ"
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

const countTotalIndexDocument = async (index) => {
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
let totalLawsDoc = countTotalIndexDocument(lawsIndex)
                        .then(totalLawsDocument => totalLawsDocument)
                        .catch(err => {
                            console.log(err)
                            return -1
                        })

const getTotalLawsDoc = () => {
    return totalLawsDoc
}
const setTotalLawsDoc = (totalLawsDocument) => {
    totalLawsDoc = totalLawsDocument
}


const createIndex = async (index) => {
    try {
        let {body} = await client.indices.create({
            index : index
        })
        return body
    }
    catch(error) {
        return `Create ${index} index error: ${error}`
    }
}

const checkIndicesExists = async (index) => {
    try {

        let {body} = await client.indices.exists({
            index: index
        })
        return body
    } catch(error) {
        return `Check ${index} index exists error: ${error}`
    }
}

const deleteIndex = async (index) => {
    try {

        let {body} = await client.indices.delete({
            index : index
        })
        return body
    } catch (error) {
        return `Delete ${index} index error: ${error}`
    }
}
module.exports = {
    titles,
    pugFiles,
    filePathStoreLawsData, 
    lawsIndex, 
    lawsSearchSize, 
    maxResultWindow, 
    lawsPagingIndex,
    firstPageOverTenThousandDocument,
    countTotalIndexDocument, 
    getTotalLawsDoc, 
    setTotalLawsDoc,
    deleteIndex,
    createIndex,
    checkIndicesExists
}