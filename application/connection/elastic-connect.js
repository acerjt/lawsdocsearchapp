const { Client } = require('@elastic/elasticsearch')
// const client = new Client({ node: 'http://localhost:9200' , auth : { username: 'elastic', password: 'DT2403'}})
const client = new Client({ node: 'http://localhost:9200' })



module.exports = { client }