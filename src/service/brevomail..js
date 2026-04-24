import * as SibApiV3Sdk from "sib-api-v3-sdk";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
const appRoot=path.resolve(__dirname);
const readHTMLFile = function(filePath){
    return new Promise((resolve,reject)=>{
        fs.readFile(filePath,{encoding:'utf-8'},function(err,html){
            if(err){
                reject(err);
            }else{
                resolve(html);
            }       
    });
});
};
function brevoMail(emailData,replacements,htmlFileName=null){
    return new Promise(async (resolve,reject)=>{
        try{
            htmlFileName=htmlFileName || 'en-mail-template.html';
            let filePath=appRoot+'/mail-templates/'+htmlFileName;
            let html=await readHTMLFile(filePath);
            const {
                API_URL
            }=global.envVariable.globalConfig;
            const template=Handlebars.compile(html);
            const  htmlsend=template({...replacements,API_URL});
            // Configure brevo api key
            let defaultClient=SibApiV3Sdk.ApiClient.instance;
            let apiKey=defaultClient.authentications['api-key'];
            apiKey.apiKey=global.envVariable.globalConfig.MAIL_PASS;
            let apiInstance=new SibApiV3Sdk.TransactionalEmailsApi();
            let sendSmtpEmail=new SibApiV3Sdk.SendSmtpEmail();
            sendSmtpEmail.subject=emailData.subject;
            sendSmtpEmail.htmlContent=htmlsend;
            sendSmtpEmail.sender={
                name:emailData.fromName || global.envVariable.globalConfig.MAIL_FROM_NAME ,
                email:emailData.from ||global.envVariable.globalConfig.MAIL_FROM_ADDRESS
            };
            sendSmtpEmail.to=[{email:emailData.to}];
            const response=await apiInstance.sendTransacEmail(sendSmtpEmail);
            console.log("Email sent via Brevo!", response.messageId || response);
            resolve("Email sent!");

        } catch(err){
            console.log("Error in brevo mail function",err);
            reject(err);
        }
    })
}
export default brevoMail;