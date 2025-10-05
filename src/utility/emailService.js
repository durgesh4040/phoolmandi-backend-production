import nodemailer from 'nodemailer';
export async function sendEmail(to, subject, text, html) {
        try {
            let transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST, 
                port: 587, 
                secure: false, 
                auth: {
                    user:process.env.EMAIL_USER, 
                    pass: process.env.EMAIL_PASS
                }
            });
            let mailOptions = {
                from: process.env.EMAIL_USER,
                to: to,
                subject: subject, 
                text: text,
                html: html 
            };
            let info = await transporter.sendMail(mailOptions);

            console.log('Message sent: %s', info.messageId);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('Error sending email:', error);
            return { success: false, error: error.message };
        }
}