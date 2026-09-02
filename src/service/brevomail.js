
import * as SibApiV3Sdk from "sib-api-v3-sdk";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname);

const readHTMLFile = function (filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, { encoding: "utf-8" }, function (err, html) {
            if (err) reject(err);
            else resolve(html);
        });
    });
};

function brevoMail(emailData, replacements, htmlFileName = null) {
    return new Promise(async (resolve, reject) => {
        try {
            htmlFileName = htmlFileName || "email-template.html";
            let filePath = appRoot + "/mail-templates/" + htmlFileName;

            const html = await readHTMLFile(filePath);
            const {
                API_URL
            } = process.env

            const template = handlebars.compile(html);
            const htmlsend = template({...replacements,API_URL});

            // Configure Brevo API key
            let defaultClient = SibApiV3Sdk.ApiClient.instance;
            let apiKey = defaultClient.authentications["api-key"];
            apiKey.apiKey = process.env.BREVO_API_KEY;

            let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

            let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

            sendSmtpEmail.subject = emailData.subject;
            sendSmtpEmail.htmlContent = htmlsend;
            sendSmtpEmail.sender = {
                name: emailData.fromName || process.env.MAIL_FROM_NAME,
                email: emailData.from || process.env.MAIL_FROM_ADDRESS,
            };
            sendSmtpEmail.to = [{ email: emailData.to }];

            const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log("Email sent via Brevo!", response.messageId || response);
            resolve("Email sent!");
        } catch (err) {
            console.error("Error sending email via Brevo:", err);
            reject(err);
        }
    });
}

export default brevoMail;
