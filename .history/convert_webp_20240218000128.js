import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";

(async () => {
  await imagemin(["./public/images/*.{jpg,png}"], {
    destination: "./public/",
    plugins: [imageminWebp({ quality: 50 })],
  });
})();

// add "type module to package.json
// npm start（node convert_webp.js）
// remove type module to package.json