import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
const path = require("path");
const appRoot = path.resolve(__dirname);
let readHTMLFile = function (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
      if (err) {
        reject(err);
      } else {
        resolve(html);
      }
    });
  });
};

function Mail(
  emailData,
  replacements,
  htmlFileName = null,
  pdfBufferData = null,
  pdfFileName = null
) {
  return new Promise((resolve, reject) => {
    // create reusable transporter object using the default SMTP transport

    htmlFileName = htmlFileName ? htmlFileName : "en-mail-template.html";

    let filePath = appRoot + "/mail-templates/" + htmlFileName;
    let transporter = nodemailer.createTransport({
      sendmail: true,
      newline: "unix",
      path: "/usr/sbin/sendmail",
    });

    readHTMLFile(filePath)
      .then(async (html) => {
        var template = handlebars.compile(html);
        // console.log(replacements)
        var htmlsend = template(replacements);
        const msg = {
          from: emailData.from || `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`, // sender address
          to: emailData.to,
          subject: emailData.subject,
          html: htmlsend,
        };

        // ADD attachments
        if (pdfBufferData) {
          msg.attachments = {
            filename: pdfFileName,
            content: pdfBufferData,
          };
        }

        // send mail with defined transport object
        const info = await transporter.sendMail(msg);
        resolve("Email Sent!");
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export default Mail;
