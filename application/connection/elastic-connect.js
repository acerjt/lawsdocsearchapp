const { Client, ConnectionPool } = require('@elastic/elasticsearch')
// const client = new Client({ node: 'http://localhost:9200' , auth : { username: 'elastic', password: 'DT2403'}})
// class MyConnectionPool extends ConnectionPool {
//     markAlive(connection) {
//         super.markAlive(connection)
//     }
// }

const client = new Client({ node: 'http://localhost:9200' })
// const client = new Client({ node: 'http://localhost:9200', ConnectionPool: MyConnectionPool})



module.exports = { client }