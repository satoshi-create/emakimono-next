import { createTransport } from "nodemailer";

export default async function sendMail(req, res) {
  const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
  });

    await new Promise((resolve, reject) => {
      // verify connection configuration
      transporter.verify(function (error, success) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          console.log("Server is ready to take our messages");
          resolve(success);
        }
      });
    });

  const toHostMail = {
    from: process.env.USER,
    to: process.env.USER,
    subject: `【お問い合わせ】${req.body.name}様より`,
    text: req.body.message + " | Sent from: " + req.body.email,
    html: `
      <p>【名前】</p>
      <p>${req.body.name}</p>
      <p>【メールアドレス】</p>
      <p>${req.body.email}</p>
      <p>【メッセージ】</p>
      <p>${req.body.message.replaceAll("\n", "<br>")}</p>
    `,
  };

  const toGuestMail = {
    from: process.env.MAIL_USER,
    to: `${req.body.email}`,
    subject: `【お問い合わせ自動受付メール】`,
    text: req.body.message + " | Sent from: " + req.body.email,
    html: `
          <p>
            お問い合わせありがとうございます。
            <br>以下の内容でお問い合わせを承りました。
          </p>
          <p>-----------------------------------------</p>
            <p>【名前】</p>
            <p>${req.body.name}</p>
            <p>【メールアドレス】</p>
            <p>${req.body.email}</p>
            <p>【メッセージ】</p>
            <p>${req.body.message.replaceAll("\n", "<br>")}</p>
          <p>-----------------------------------------</p>
        `,
  };

    await new Promise((resolve, reject) => {
      // send mail
      transporter.sendMail(toHostMail, (err, info) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log(info);
          resolve(info);
        }
      });
    });
    await new Promise((resolve, reject) => {
      // send mail
      transporter.sendMail(toGuestMail, (err, info) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log(info);
          resolve(info);
        }
      });
    });

  res.status(200).json({
    success: true,
  });
}

