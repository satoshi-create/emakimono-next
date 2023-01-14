export default function sendmail(req, res) {
  let nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure:true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const toHostMailData = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,
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

  const toGuestMailData = {
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

  transporter.sendMail(toHostMailData, function (err, info) {
    if (err) console.log(err);
    else console.log(info);
  });

  transporter.sendMail(toGuestMailData, function (err, info) {
    if (err) console.log(err);
    else console.log(info);
  });

  res.send("success");
}
