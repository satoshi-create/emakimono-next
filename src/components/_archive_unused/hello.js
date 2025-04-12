// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  const { method } = req;

  switch (method) {
    case "GET":
      res.json({ message: "GETリクエスト" });
      break;
    case "POST":
      res.json({ message: "POST" });
    case "PATCH":
      res.json({ messsage: "PATCH" });
    default:
      res.json({ messsage: "enything else" });
      break;
  }
  // res.status(200).json({ name: "John Doe" });
}
