'use strict'
const { createReadStream } = require('fs')
const split = require('split2')

const crawler = require('./controllers/crawler/crawler2.controller')
const {client} = require('./connection/elastic-connect')
const { filePathStoreLawsData, lawsIndex} = require('./common')

const checkIndicesExists = async (index) => {
  let {body} = await client.indices.exists({
    index: index
  })
  return body
}

const deleteIndex = async (index) => {
  let {body} = await client.indices.delete({
    index : index
  })
  return body
}

const createLawsIndex = async () => {
  client.indices.create({
    index: lawsIndex,
    body: {
      "settings": {
        "index.analyze.max_token_count": 20000,
        "analysis": {
          "analyzer": {
            "custom_vi_analyzer": {
              "type": "custom",
              "tokenizer": "vi_tokenizer",
              "filter": [
                "lowercase",
                "stop",
                "token_limit"
              ]
            }
          },
          "filter": {
            "token_limit": {
              "type": "limit",
              "max_token_count": 100000
            }
          }
        }
      },
      "mappings": {
        "properties": {
          "href": {
            "type": "keyword"
          },
          "name": {
            "type": "keyword"
          },
          "desc": {
            "type": "text"
          },
          "docType": {
            "type": "keyword"
          },
          "docNum": {
            "type": "keyword"
          },
          "agencyIssued": {
            "type": "keyword"
          },
          "signedBy": {
            "type": "keyword"
          },
          "issuedDate": {
            "type": "date",
            "format": "dd/MM/yyyy||epoch_millis",
            "ignore_malformed": true
          },
          "effectiveDate": {
            "type": "date",
            "format": "dd/MM/yyyy||epoch_millis",
            "ignore_malformed": true
          },
          "dateOfAnnouncement": {
            "type": "date",
            "format": "dd/MM/yyyy||epoch_millis",
            "ignore_malformed": true
          },
          "numOfAnnouncement": {
            "type": "keyword"
          },
          "field": {
            "type": "keyword"
          },
          "effectiveStatus": {
            "type": "keyword"
          },
          "contentText": {
            "type": "text"
          },
          "contentHtml": {
            "type": "keyword",
            "index": false,
            "ignore_above": 32000
          },
          "tie_breaker_id" : {
            "type": "keyword"
          }
        }
      }
    }
  }, { ignore: [400] })
}

const bulkIndex = async (index) => {
  const result = await client.helpers.bulk({
    datasource: createReadStream(filePathStoreLawsData).pipe(split(JSON.parse)),
    onDocument (doc) {
      return {
        index: { _id: doc.tie_breaker_id, _index : index }
      }
    },
    onDrop (doc) {
      console.log(doc)
      return result.abort()
    }
  })
  return result
}

const run = async () => {
  let isLawsIndexExists = await checkIndicesExists(lawsIndex)
  if(isLawsIndexExists)
    await deleteIndex(lawsIndex)
  await createLawsIndex()
  await crawler.crawler()
  await bulkIndex(lawsIndex) 
}

run().catch(err => {
  console.log(err)
})