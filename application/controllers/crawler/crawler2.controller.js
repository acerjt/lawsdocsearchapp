const cheerio = require("cheerio");
const axios = require("axios").default;
const crypto = require('crypto')
const fs = require('fs');
const moment = require("moment");
// moment().tz("Asia/Ho_Chi_Minh").format();

const { laws } = require('../../common');

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
  try {
    const html = await fetchHtml(lawURL);
    
    const selector = cheerio.load(html);
    
    const searchResults = selector("body").find(
      ".row .items-push > .col-md-12 > .row"
      );
    // return Promise.all(
            searchResults
            .map(async (idx, el) => {
              const elementSelector = selector(el);
              return extractLawsData(elementSelector);
            })
        //     .get()
        // );
  } catch (err) {
    console.log(err)
  }
};
      
const extractLawsData = async (selector) => {
  try {
    const href = await selector
      .find(".col-md-9")
      .find(".doc-summary")
      .find(".col-md-12, .col-md-9")
      .find(".push-5")
      .find("a")[0].attribs.href;

    const currentDocLawURL = `${baseURL + href}`;
    const html = await fetchHtml(currentDocLawURL);
    const selector1 = await cheerio.load(html);

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
      .trim().split(', ');

    const signedBy = await dataDocLaw
      .find("tr:nth-child(4) > td:nth-child(2)")
      .text()
      .trim().split(', ');

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
      .trim().split(', ');

    const effectiveStatus = await dataDocLaw
      .find("tr:nth-child(10) > td:nth-child(2)")
      .text()
      .trim();

    const lawContent = await selector1("body").find(".row > .col-md-8");

    const contentText = await lawContent.text();
    const contentHtml = await lawContent.html();
    const updatedAtText = await dataDocLaw
      .find("tr:nth-child(11) > td:nth-child(2)")
      .text()
      .trim();
    const updatedAt = calculateUpdatedAt(updatedAtText)

    const fileLinks = await selector1("body").find(
      ".block-table.table-bordered.text-center"
    );
    let pdfLawsLink = await fileLinks.find(".bg-warning").find("a");
    let docLawsLink = await fileLinks.find(".bg-danger").find("a");
    pdfLawsLink = pdfLawsLink[0] ? baseURL + pdfLawsLink[0].attribs.href : "";
    docLawsLink = docLawsLink[0] ? baseURL + docLawsLink[0].attribs.href : "";

    const law = {
      tie_breaker_id: await hexIdGeneration(),
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
      updatedAt: updatedAt,
      pdfLawsLink: pdfLawsLink,
      docLawsLink: docLawsLink,
      contentText: contentText,
      contentHtml: contentHtml,
    };
    let writeFile = await writeLawsDataFile(
      laws.filePathStoreLawsData,
      JSON.stringify(law) + "\n"
    ).catch((err) => {
      console.log(err);
      Promise.reject(err);
    });
    return writeFile
  } catch(err) {
    console.log(err)
  }
};

const calculateUpdatedAt = (updatedAt) => {
  let splitUpdatedAt = updatedAt.split(" ");
  let date;
  if (splitUpdatedAt[1] === "giây") {
    date = moment().subtract(splitUpdatedAt[0], "seconds");
  } else if (splitUpdatedAt[1] === "phút") {
    date = moment().subtract(splitUpdatedAt[0], "minutes");
  } else if (splitUpdatedAt[1] === "giờ") {
    date = moment().subtract(splitUpdatedAt[0], "hours");
  } else if (splitUpdatedAt[1] === "ngày") {
    date = moment().subtract(splitUpdatedAt[0], "days");
  } /**  else if (splitUpdatedAt[1] === 'tuần') {
      date = moment().subtract(splitUpdatedAt[0], "weeks")
  } else if (splitUpdatedAt[1] === 'tháng') {
      date = moment().subtract(splitUpdatedAt[0], "months")
  } **/ else if (
    splitUpdatedAt[1] === "năm"
  ) {
    date = moment().subtract(splitUpdatedAt[0], "years");
  } else if (updatedAt.indexOf("Hôm qua") > -1)
    date = moment().subtract(1, "days");
  else if (updatedAt.indexOf("Năm ngoái") > -1)
    date = moment().subtract(1, "years");
  else {
    date = moment(formattedDate(updatedAt), "YYYYMMDD");
  }
  console.log(date.toDate())
  return date.toDate();
};

const formattedDate = (date) => {
  console.log(date)
  let splitDate = date.slice(date.length - 11, date.length - 1).split("/");
  return `${splitDate[2]}${splitDate[1]}${Number(splitDate[0])}`;
};

const writeLawsDataFile = async (filePath, data) => {
  fs.appendFile(filePath, data, function (err) {
    if (err) throw err;
  });
};

const hexIdGeneration = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buffer) => {
      if (err) {
        console.log(err);
        return rejeq({ s: 400, msg: err });
      }
      const currentTimeHexString = Date.now().toString(16);

      const id = buffer.toString("hex") + currentTimeHexString;
      return resolve(id);
    });
  });
};

module.exports.crawler = async () => {
  try {
    const totalPagesVBPL = 15; // 11338
    for (let page = 1; page <= totalPagesVBPL; page++) {
      const lawURL = `${baseURL}/csdl/van-ban-phap-luat?p=${page}`;
      await crawLawsPerPage(lawURL)
        .then((rs) => {
          console.log(rs)
          console.log(`page ${page} has crawled`);
        })
        .catch((error) => console.log("Index error: " + error));
    }
  } catch (error) {
    console.log(error);
  }
};