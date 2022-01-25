const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
const nodemailersendgrid = require("nodemailer-sendgrid");
// new Email(user,url).sendWelcome()
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Arjun Murali<${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      //sendgrid
      // return nodemailer.createTransport({
      //   service:'sendGrid',
      //   auth:{
      //     user:process.env.SENDGRID_USERNAME,
      //     pass:process.env.SENDGRID_PASSWORD
      //   }
      // })
      return nodemailer.createTransport(
        nodemailersendgrid({
          apiKey: process.env.SENDGRID_PASSWORD,
        })
      );
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    //1)Render the HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    //2)Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
      // html:
    };
    //3)Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours Family!");
  }

  async passwordReset() {
    await this.send(
      "passwordReset",
      "your password reset token (valid for only 10 mins)"
    );
  }
};
