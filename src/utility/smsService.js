import { twilioClient } from "../configuration/twillio.js";
export async function createMessage(data){
    const message = await twilioClient.messages.create({
    body:data.body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to:data.to
  });
  return message
}