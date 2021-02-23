const cheerio = require("cheerio");
const axios = require("axios").default;
const crypto = require("crypto");
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const https = require("https");
// moment().tz("Asia/Ho_Chi_Minh").format();

const { laws } = require("../../common");
const { CrawlerLogger } = require("../../util/logger");

const baseURL = "https://vanbanphapluat.co";
let isDownLoadFile = true
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
    const $ = await cheerio.load(html);

    const searchResults = await $("body").find(
      ".row .items-push > .col-md-12 > .row"
    );
    // console.log(searchResults)
    return Promise.all(
        searchResults.map(async (idx, el) => {
            // console.log(el)
            const elementSelector = $(el);
            return extractLawsData(elementSelector);
        }).
        get()
    )
    // console.log(searchResults)
    // Promise.all(() => { 
    // return new Promise((resolve, reject) => {
    //     for(let i = 0; i < 20; i++) {
    //         const elementSelector = $(searchResults[i]);
    //         // console.log(elementSelector)
    //         extractLawsData(elementSelector).then(rs => {
    //             return resolve()
    //         });
    //     }
    // })   
    // })
  } catch (err) {
    console.log(err);
  }
};

const extractLawsData = async (selector) => {
  try {
    let startCrawlerOneDoc = process.hrtime();
    const href = await selector
      .find(".col-md-9")
      .find(".doc-summary")
      .find(".col-md-12, .col-md-9")
      .find(".push-5")
      .find("a")[0].attribs.href;

    const currentDocLawURL = `${baseURL + '/api/vanban' + href}`;
    const html = await fetchHtml(currentDocLawURL);
    const desc = html.TrichYeu
    const docType = html.LoaiVanBan.Title
    const docNum = html.SoHieu
    const agencyIssued = html.CoQuanBanHanh.map(agency => {
        return agency.Title
    })
    const signedBy = html.NguoiKy.map(name => {
        return name.Title
    })
    const name = docType + ' ' + docNum
    const issuedDate = html.NgayBanHanh
    const effectiveDate = html.NgayHieuLuc
    const dateOfAnnouncement = html.NgayCongBao ? html.NgayCongBao : '...'
    const numOfAnnouncement = html.SoCongBao ? html.SoCongBao : '...'
    const field = html.LinhVuc.map(fieldName => {
        return fieldName.Title
    })
    const effectiveStatus = html.TrinhTrangHieuLuc.Title
    const updatedAt = html.Updated
    const pdfLawsLink = html.PDFUrl ? '/data' + html.PDFUrl : ''
    const pdfLawsSize = html.PDFSize ? html.PDFSize : 0
    const docLawsLink = html.DOCUrl ? '/data' + html.DOCUrl : ''
    const docLawsSize = html.DOCSize ? html.DOCSize : 0
    const contentHtml = html.ToanVan
    const diagram = html.LuocDo
    const inavailableDate =  html.NgayHetHieuLuc ? html.NgayHetHieuLuc : ''
    if(isDownLoadFile) {

        if(pdfLawsLink)
        await fs.mkdir(path.resolve(__dirname, '../../public/' + pdfLawsLink.slice(0,pdfLawsLink.lastIndexOf('/'))), { recursive: true }, async (err) => {
            if (err) throw err;
            await downloadFile(baseURL + pdfLawsLink, path.resolve(__dirname, '../../public' + pdfLawsLink)).catch(err => {
                CrawlerLogger.error(`Download file error: ${pdfLawsLink} ${err}`)
            })
        });
        if(docLawsLink)
        await fs.mkdir(path.resolve(__dirname, '../../public/' + docLawsLink.slice(0,docLawsLink.lastIndexOf('/'))), { recursive: true }, async (err) => {
            if (err) throw err;
            await downloadFile(baseURL + docLawsLink, path.resolve(__dirname, '../../public/' + docLawsLink)).catch(err => {
                CrawlerLogger.error(`Download file error: ${docLawsLink} ${err}`)
            })
        });
    }
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
        pdfLawsSize: pdfLawsSize,
        docLawsLink: docLawsLink,
        docLawsSize:docLawsSize,
        contentHtml: contentHtml,
        inavailableDate: inavailableDate,
        diagram: diagram
    };

    return fs.appendFile(laws.filePathStoreLawsData, JSON.stringify(law) + "\n", function (err) {
        if (err) 
            console.log(err);
        let endCrawlerOneDoc = process.hrtime(startCrawlerOneDoc)
        CrawlerLogger.info('crawler one document time:' + endCrawlerOneDoc[1] / 1000000 + 'ms')
        return Promise.resolve()
    });
  } catch (err) {
    console.log(err);
  }
};
const downloadFile = async (fileUrl, outputLocationPath) => {
  const writer = fs.createWriteStream(outputLocationPath);
  return axios({
    method: "get",
    url: fileUrl,
    responseType: "stream",
  })
    .then((response) => {
      return new Promise((resolve, reject) => {
        if (response.status === 200) {
          response.data.pipe(writer);
        } else {
          writer.close();
          resolve(true);
        }
        let error = null;
        writer.on("error", (err) => {
          error = err;
          console.log(err);
          writer.close();
          reject(err);
        });
        writer.on("close", () => {
          if (!error) {
          }
          resolve(true);
        });
      });
    })
    .catch((error) => {
      writer.close();
      return error;
    });
};
// const downloadFile = async (fileUrl, outputLocationPath) => {
//   let file = fs.createWriteStream(outputLocationPath);
//   let request = https.get(fileUrl, function(response) {
//     response.pipe(file);
//     file.on('finish', function() {
//       file.close( (err) => {

//       });  // close() is async, call cb after close completes.
//     });
//   }).on('error', function(err) { // Handle errors
//     fs.unlink(outputLocationPath); // Delete the file async. (But we don't check the result)
//     // if (cb) cb(err.message);
//   });
// };
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
  else if (updatedAt.indexOf("năm ngoái") > -1)
    date = moment().subtract(1, "years");
  else {
    date = moment(formattedDate(updatedAt), "YYYYMMDD");
  }
  return date.toDate();
};

const formattedDate = (date) => {
  let splitDate = date.slice(date.length - 11, date.length - 1).split("/");
  return `${splitDate[2]}${splitDate[1]}${Number(splitDate[0])}`;
};

const writeLawsDataFile = async (filePath, data) => {
  return fs.appendFile(filePath, data, function (err) {
    if (err) console.log(err);
  });
};

const hexIdGeneration = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, buffer) => {
      if (err) {
        console.log(err);
        return reject({ s: 400, msg: err });
      }
      const currentTimeHexString = Date.now().toString(16);

      const id = buffer.toString("hex") + currentTimeHexString;
      return resolve(id);
    });
  });
};

module.exports.crawler = async () => {
  try {
    const totalPagesVBPL = 11393; // 11391
    for (let page = 1; page <= totalPagesVBPL; page++) {
      const lawURL = `${baseURL}/csdl/van-ban-phap-luat?p=${page}`;
      let startCrawlerOnePage = process.hrtime();
      await crawLawsPerPage(lawURL)
        .then((rs) => {
          console.log(`page ${page} has crawled`);
        })
        .catch((error) => console.log("Index error: " + error));
      let endCrawlerOnePage = process.hrtime(startCrawlerOnePage);
      CrawlerLogger.info(
        "crawler one page time: " + endCrawlerOnePage[1] / 1000000 + "ms"
      );
    //   if(page === 100)
    //     isDownLoadFile = !isDownLoadFile
    }
    return Promise.resolve();
  } catch (error) {
    console.log(error);
  }
};
