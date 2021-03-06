const cheerio = require("cheerio");
const axios = require("axios").default;

const elastic = require("../../connection/elastic-connect");
const client = elastic.client;

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
    return extractDeal(elementSelector);
  });
  // return Promise.all(
  //   searchResults
  //     .map(async (idx, el) => {
  //       const elementSelector = selector(el);
  //       return extractDeal(elementSelector);
  //     })
  //     .get()
  // );
};

const extractDeal = async (selector) => {
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

  const lawContent = selector1("body").find(".row > .col-md-8");

  const contentText = lawContent.text();
  const contentHtml = lawContent.html();

  await client.index({
    index: "laws",
    body: {
      href,
      name,
      desc,
      docType,
      docNum,
      agencyIssued,
      signedBy,
      issuedDate,
      effectiveDate,
      dateOfAnnouncement,
      numOfAnnouncement,
      field,
      effectiveStatus,
      contentText,
      contentHtml,
    },
  });

  return Promise.resolve();
  // return Promise.resolve({
  //   href,
  //   name,
  //   desc,
  //   docType,
  //   docNum,
  //   agencyIssued,
  //   signedBy,
  //   issuedDate,
  //   effectiveDate,
  //   dateOfAnnouncement,
  //   numOfAnnouncement,
  //   field,
  //   effectiveStatus,
  //   contentText,
  //   contentHtml
  // });
};

module.exports.crawler = async (req, res) => {
  try {
    const numberPagesVBPL = 5; // 11307
    for (let page = 1; page <= numberPagesVBPL; page++) {
      const lawURL = `${baseURL}/csdl/van-ban-phap-luat?p=${page}`;
      await crawLawsPerPage(lawURL);
      console.log(`page ${page} has crawed`);
      // .then( async (documents) => {
      //   laws.push(documents);
      //   await documents.forEach(document => {
      //     client.index({
      //       index : 'laws',
      //       body: document
      //     })
      //   })
      // });
    }
    res.send(`<h1>${numberPagesVBPL} pages has crawled</h1>`)
  } catch (error) {
    console.log(error);
  }
};
