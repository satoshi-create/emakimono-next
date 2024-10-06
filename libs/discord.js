const webHookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

function postMessage(title) {
  const data = {
    username: "blog-notify",
    content: title + "がいいねされました",
  };

  fetch(webHookUrl, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(data),
  }).catch((error) => console.error(error));
}

export default postMessage;

// export function postMessage(title: string) {
//   const data = {
//     username: "blog-notify",
//     content: title + "がいいねされました",
//   };
//   fetch(webHookUrl, {
//     method: "POST",
//     mode: "cors",
//     headers: {
//       "Content-type": "application/json",
//     },
//     body: JSON.stringify(data),
//   }).catch((error) => console.error(error));
// }
