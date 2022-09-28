import imagemin from "imagemin";
import imageminWebp from "imagemin-webp";

(async () => {
  await imagemin(["./public/images/*.{jpg,png}"], {
    destination: "./public/",
    plugins: [imageminWebp({ quality: 50 })],
  });
})();

// npm start（node convert_webp.js）
