'use strict'
const { createReadStream } = require('fs')
const split = require('split2')

const crawler = require('./controllers/crawler/crawler2.controller')
const {client} = require('./connection/elastic-connect')
const { laws, func, pipeline, scripts} = require('./common')


const createLawsIndex = async () => {
  let {body} = await client.indices.create({
    index: laws.lawsIndex,
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
          },
          "ratings" : {
            "properties" : {
              "1" : {
                "type" : "long"
              },
              "2" : {
                "type" : "long"
              },
              "3" : {
                "type" : "long"
              },
              "4" : {
                "type" : "long"
              },
              "5" : {
                "type" : "long"
              }
            }
          },
          "stars" : {
            "type" : "long"
          },
          "view" : {
            "type" : "long"
          },
          "wilson-score" : {
            "type" : "float"
          }
        }
      }
    }
  }, { ignore: [400] })
  return body
}

const bulkIndex = async (index, source, pipeline) => {
  const result = await client.helpers.bulk({
    datasource: createReadStream(source).pipe(split(JSON.parse)),
    onDocument (doc) {
      return {
        index: { _id: doc.tie_breaker_id, _index : index, pipeline : pipeline }
      }
    },
    onDrop (doc) {
      console.log(doc)
      return result.abort()
    }
  })
  return result
}

const initLawsData = async () => {
  let {body} = await client.ingest.putPipeline({
    id: pipeline.laws.initLawsData,
    master_timeout: '300ms',
    timeout: '300ms',
    body: {
      "description": "init default value for views, stars and rating when indexing laws",
      "processors": [
        {
          "script": {
            "source": `
                ctx.views = 0;
                ctx.stars = 0;
                ctx.ratings = params.object;
            `,
            "params": {
              "object": {
                "1": 0,
                "2": 0,
                "3": 0,
                "4": 0,
                "5": 0
              }
            }
          }
        }
      ]
    }
  })
  return body
}

const lawsCalculateViewScript = async () => {
  let {body} = await client.putScript({
    id: scripts.laws.calculateView,
    body: {
        "script": {
            "lang": "painless",
            "source": `
              ctx._source.views++;
            `
        }
    }
  })
  return body
}

const lawsRatingScript = async () => {
  let {body} = await client.putScript({
    id: scripts.laws.ratingDoc,
    body: {
      "script" : {
        "lang": "painless",
        "source": `
        // Increment the rating of the product.
        ctx._source.ratings[params.rating.toString()]++;
        // Readable variables for the ratings.
        long s1 = ctx._source.ratings['1'];
        long s2 = ctx._source.ratings['2'];
        long s3 = ctx._source.ratings['3'];
        long s4 = ctx._source.ratings['4'];
        long s5 = ctx._source.ratings['5'];
        // Calculate the positive score.
        // Normalize the rating scale to 0.0 - 1.0, giving more weight to higher ratings.
        double p = (s1 * 0.0) + (s2 * 0.25) + (s3 * 0.5) + (s4 * 0.75) + (s5 * 1.0);
        // Calculate the negative score.
        // Normalize the rating scale to 0.0 - 1.0, giving more weight to lower ratings.
        double n = (s1 * 1.0) + (s2 * 0.75) + (s3 * 0.5) + (s4 * 0.25) + (s5 * 0.0);
        // Calculate the Wilson score confidence interval for a given positive score (p) and negative score (n).
        double wilsonScore = p + n > 0 ? ((p + 1.9208) / (p + n) - 1.96 * Math.sqrt((p * n) / (p + n) + 0.9604) / (p + n)) / (1 + 3.8416 / (p + n)) : 0;
        // Update the Wilson score of the product.
        double stars = (s1 * 1.0 + s2 * 2.0 + s3 * 3.0 + s4 * 4.0 + s5 * 5.0) / (s1 + s2 + s3 + s4 + s5) * 1.0;
        ctx._source['wilson-score'] = wilsonScore;
        ctx._source['stars'] = stars;
        `
      }
    }
  })
  return body
}
const run = async () => {
  let isLawsIndexExists = await func.checkIndicesExists(laws.lawsIndex)
  if(isLawsIndexExists)
    await func.deleteIndex(laws.lawsIndex)
  isLawsIndexExists = await func.checkIndicesExists(laws.lawsIndex)
  await initLawsData()
  await lawsRatingScript()
  await lawsCalculateViewScript()
  await createLawsIndex()
  await crawler.crawler()
  await bulkIndex(laws.lawsIndex, laws.filePathStoreLawsData, pipeline.laws.initLawsData) 
}

run().catch(err => {
  console.log(err)
})