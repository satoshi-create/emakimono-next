import "lazysizes";

const id = Math.floor(Math.random() * 500);
const id2 = Math.floor(Math.random() * 500);

export default function emakis() {
  return (
    <div className="App">
      <h1>Hello Lazysizes</h1>
      <main>
        <img
          style={{ width: 500, height: 500 }}
          src={`data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==`}
          data-src={`/cyoujyuu_yamazaki_kou_01-1080.webp`}
          className="lazyload blur-up"
          alt=""
        />
        <img
          style={{ width: 500, height: 500 }}
          src={`https://picsum.photos/id/${id2}/20`}
          data-src={`https://picsum.photos/id/${id2}/1000`}
          className="lazyload blur-up"
          alt=""
        />
      </main>
    </div>
  );
}
