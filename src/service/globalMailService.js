
import mail from "../service/mail.js"
import brevoMail from "./brevomail.js";
import sendMail from "../service/sendmail.js";
export async function globalMailService(emailData, newData, template = "en-mail-template.html") {
  if (process.env.MAIL_DRIVER === "sendmail") {
    await sendMail(emailData, newData, template);
  } else if(process.env.MAIL_DRIVER === "smtp") {
    await mail(emailData, newData, template);
  }else{
    brevoMail(emailData, newData, template);
  }
}
