import { createTransport } from "nodemailer";

export default async function sendMail(req, res) {
  const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from:process.env.MAIL_USER,
    to:process.env.MAIL_USER,
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
  });

  await transporter.sendMail({
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
  });

  res.status(200).json({
    success: true,
  });
}
