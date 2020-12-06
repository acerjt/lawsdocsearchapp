const { Client, ConnectionPool, events, errors } = require('@elastic/elasticsearch')
const {ClientLogger} = require('../util/logger')
// const client = new Client({ node: 'http://localhost:9200' , auth : { username: 'elastic', password: 'DT2403'}})
// class MyConnectionPool extends ConnectionPool {
//     markAlive(connection) {
//         super.markAlive(connection)
//     }
// }

// const client = new Client({ node: 'http://localhost:9200', ConnectionPool: MyConnectionPool})
const client = new Client({ node: 'http://localhost:9200' })

client.on('response', (err, reseult) => {
    if(err)
        ClientLogger.error(`Response error: ${JSON.stringify(err)}`)
    else
        ClientLogger.info(`Response success: ${JSON.stringify(reseult)}`)
})

client.on('request', (err, reseult) => {
    if(err)
        ClientLogger.error(`Request error: ${JSON.stringify(err)}`)
    else
        ClientLogger.info(`Request success: ${JSON.stringify(reseult)}`)
})

client.on('sniff', (err, reseult) => {
    if(err)
        ClientLogger.error(`Sniff error: ${JSON.stringify(err)}`)
    else
        ClientLogger.info(`Sniff success: ${JSON.stringify(reseult)}`)
})

client.on('resurrect', (err, reseult) => {
    if(err)
        ClientLogger.error(`Resurrect error: ${JSON.stringify(err)}`)
    else
        ClientLogger.info(`Resurrect success: ${JSON.stringify(reseult)}`)
})

module.exports = { client }