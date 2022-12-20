import React, { useEffect, useState } from "react";

const Users = ({ data }) => {
  console.log(data);
  // API Routes

  // fetch関数によるアクセス

  // const [users, setUsers] = useState([]);
  // console.log(users);
  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     const response = await fetch("/api/users");
  //     const data = await response.json();
  //     setUsers(data.users);
  //   };
  //   fetchUsers()
  // }, []);

  // クライアントからPOSTリクエストを送信
  useEffect(() => {
    const postData = async () => {
      await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "John" }),
      });
    };
    postData();
  }, []);

  return <div>users</div>;
};

// getServerSideProps関数によるアクセス

// export async function getServerSideProps(req, res) {
//   console.log(req.method);
//   const response = await fetch("http://localhost:3000/api/users");
//   const data = await response.json();
//   return { props: { data } };
// }

export default Users;
