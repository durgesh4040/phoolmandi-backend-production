import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
      service: process.env.MAIL_DRIVER,
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT, //port 587
      secureConnection: false, // TLS requires secureConnection to be false
      auth: {
        // type:'custom',
        // method:'custom-m',
        user: process.env.MAIL_USERNAME, // email
        pass: process.env.MAIL_PASSWORD, // password
      },
      // customAuth:{
      //   'custom-m':myCustomMethod
      // }
    });

    readHTMLFile(filePath)
      .then(async (html) => {
        var template = handlebars.compile(html);

        var htmlsend = template(replacements);
        const msg = {
          from: emailData.from || `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`, // sender address
          to: emailData.to, // list of receivers
          subject: emailData.subject, // Subject line
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
        console.log("Email Sent!");
        resolve("Email Sent!");
      })
      .catch((e) => {
        reject(e);
      });
  });
}

export default Mail;
