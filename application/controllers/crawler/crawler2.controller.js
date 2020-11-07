const cheerio = require("cheerio");
const axios = require("axios").default;
const crypto = require('crypto')
const fs = require('fs');

const {filePathStoreLawsData} = require('../../common')

const baseURL = "https://vanbanphapluat.co";


const fetchHtml = async (url) => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch {
    console.error(
      `ERROR: An error occurred while trying to fetch the URL: ${url}`
    );
  }
};

const crawLawsPerPage = async (lawURL) => {
  const html = await fetchHtml(lawURL);

  const selector = cheerio.load(html);

  const searchResults = selector("body").find(
    ".row .items-push > .col-md-12 > .row"
  );
  return searchResults.map(async (idx, el) => {
    const elementSelector = selector(el);
    return extractLawsData(elementSelector);
  });
};

const extractLawsData = async (selector) => {
  const href = selector
    .find(".col-md-9")
    .find(".doc-summary")
    .find(".col-md-12, .col-md-9")
    .find(".push-5")
    .find("a")[0].attribs.href;

  currentDocLawURL = `${baseURL + href}`;
  const html = await fetchHtml(currentDocLawURL);
  const selector1 = cheerio.load(html);

  const name = await selector1("body")
    .find(".bg-primary-dark-op > .content > .push-10-t > h1")
    .text()
    .trim();

  const desc = await selector1("body")
    .find(".bg-primary-dark-op > .content > .push-10-t > h2")
    .text()
    .trim();

  const dataDocLaw = await selector1("body").find(
    "#toan-van > .row  > .col-md-4 > table > tbody"
  );

  const docType = await dataDocLaw
    .find("tr:nth-child(1) > td:nth-child(2)")
    .text()
    .trim();

  const docNum = await dataDocLaw
    .find("tr:nth-child(2) > td:nth-child(2)")
    .text()
    .trim();

  const agencyIssued = await dataDocLaw
    .find("tr:nth-child(3) > td:nth-child(2)")
    .text()
    .trim();

  const signedBy = await dataDocLaw
    .find("tr:nth-child(4) > td:nth-child(2)")
    .text()
    .trim();

  // Ngay ban hanh
  const issuedDate = await dataDocLaw
    .find("tr:nth-child(5) > td:nth-child(2)")
    .text()
    .trim();

  const effectiveDate = await dataDocLaw
    .find("tr:nth-child(6) > td:nth-child(2)")
    .text()
    .trim();

  const dateOfAnnouncement = await dataDocLaw
    .find("tr:nth-child(7) > td:nth-child(2)")
    .text()
    .trim();

  const numOfAnnouncement = await dataDocLaw
    .find("tr:nth-child(8) > td:nth-child(2)")
    .text()
    .trim();

  const field = await dataDocLaw
    .find("tr:nth-child(9) > td:nth-child(2)")
    .text()
    .trim();

  const effectiveStatus = await dataDocLaw
    .find("tr:nth-child(10) > td:nth-child(2)")
    .text()
    .trim();

  const lawContent = await selector1("body").find(".row > .col-md-8");

  const contentText = await lawContent.text();
  const contentHtml = await lawContent.html();

  const law = {
    tie_breaker_id : await hexIdGeneration(),
    href: href,
    name: name,
    desc: desc,
    docType: docType,
    docNum: docNum,
    agencyIssued: agencyIssued,
    signedBy: signedBy,
    issuedDate: issuedDate,
    effectiveDate: effectiveDate,
    dateOfAnnouncement: dateOfAnnouncement,
    numOfAnnouncement: numOfAnnouncement,
    field: field,
    effectiveStatus: effectiveStatus,
    contentText: contentText,
    contentHtml: contentHtml,
  };

  await writeLawsDataFile(filePathStoreLawsData, JSON.stringify(law)+ '\n').catch(err => {
    console.log(err)
    Promise.reject(err)
  })

  return Promise.resolve()
};

const writeLawsDataFile = async(filePath, data) => {
  fs.appendFile(filePath, data, function (err) {
    if (err) throw err;
  });
}

const hexIdGeneration = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buffer) => {
      if(err) {
        console.log(err)
        return rejeq({s: 400, msg : err})
      }
      const currentTimeHexString = Date.now().toString(16)

      const id =  buffer.toString('hex') + currentTimeHexString
      return resolve(id)
    })
  })
}


module.exports.crawler = async () => {
  try {
    const totalPagesVBPL = 5000; // 11338
    for (let page = 1; page <= totalPagesVBPL; page++) {
      const lawURL = `${baseURL}/csdl/van-ban-phap-luat?p=${page}`;
      await crawLawsPerPage(lawURL).then(rs => {
        console.log(`page ${page} has crawled`);
      }).catch(error => console.log('Index error: ' + error))
    }
  } catch (error) {
    console.log(error);
  }
};
