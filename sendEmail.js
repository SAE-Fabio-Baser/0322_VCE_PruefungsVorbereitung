import nodemailer from "nodemailer";

export default function sendEmail(emailAddress, token) {


    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "<email>",
            pass: "<Password or App Pssword>"
        },
    })

    const mailOptions = {
        to: emailAddress,
        subject: "You forgot your passwd?? idiot",
        text: "Your token: " + token,
        html: `<a href="http://localhost:3000/forgot/?emailToken=${token}">Reset Password</a>`
    }

    transporter.sendMail(mailOptions, console.log)

}