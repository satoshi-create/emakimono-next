export default async function handler(req, res) {
  console.log(req.method);
  console.log(req.body);
  console.log(req.query);
  const response = await fetch("https://jsonplaceholder.typicode.com/users/");
  const users = await response.json();
  res.status(200).json({ users });
}
