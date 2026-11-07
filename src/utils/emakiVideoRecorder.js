/**
 * 絵巻物の5秒ループ動画（9:16 リール/Shorts用）を生成してダウンロードする
 * @param {Object} params
 * @param {HTMLImageElement} params.image - 読み込み済みの絵巻画像オブジェクト
 * @param {Object} params.centerPoint - 現在プレビューで表示している中心座標 { x, y }
 * @param {number} params.zoom - 現在のズーム倍率
 * @param {string} params.title - 絵巻タイトル
 * @param {string} params.chapterTitle - 段タイトル
 * @param {Function} [params.onProgress] - 進捗コールバック (0〜100)
 * @returns {Promise<Blob>} 生成された動画Blob
 */
export async function recordEmakiLoopVideo({
  image,
  centerPoint,
  zoom = 1,
  title = "",
  chapterTitle = "",
  customComment = "",
  pageUrl = "",
  qrCodeImage = null,
  logoImage = null,
  onProgress = () => {},
}) {
  if (!image) throw new Error("Image is required for recording");

  const CANVAS_W = 1080;
  const CANVAS_H = 1920;
  const PHOTO_DX = 80;
  const PHOTO_DY = 260;
  const PHOTO_DW = 920;
  const PHOTO_DH = 1150; // 3:4 相当の枠
  const DURATION_SEC = 5;
  const FPS = 60;
  const TOTAL_FRAMES = DURATION_SEC * FPS;

  // オフスクリーンCanvas
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");

  // サポートされているMIMEタイプを判定
  let mimeType = "video/webm;codecs=vp9";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/mp4";
    }
  }

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: 6000000, // 6Mbpsで高画質出力
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = reject;
  });

  recorder.start();

  // スクロール移動幅（絵巻の進行方向：右から左へ緩やかに流す）
  // 写真枠の幅の約30%分を5秒間で移動
  const panRange = (PHOTO_DW / zoom) * 0.35;

  for (let frame = 0; frame <= TOTAL_FRAMES; frame++) {
    // 進行度 t: 0 -> 1
    const progress = frame / TOTAL_FRAMES;
    // 絵巻の鑑賞順序（右から左へ読み進める RTL）に合わせて進行方向を反転
    // 時間経過とともに画面が左から右へと流れていき、右側の続きが順に映し出される
    const panOffset = (0.5 - progress) * panRange;

    // 1. 全体背景（和風の白〜生成り）
    ctx.fillStyle = "#faf8f5";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. 写真枠背景（濃色または枠線）
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(PHOTO_DX, PHOTO_DY, PHOTO_DW, PHOTO_DH);

    // 3. 絵巻物画像のクリッピング描画
    ctx.save();
    ctx.beginPath();
    ctx.rect(PHOTO_DX, PHOTO_DY, PHOTO_DW, PHOTO_DH);
    ctx.clip();

    // ソース画像上の切り出し範囲計算
    const srcW = PHOTO_DW / zoom;
    const srcH = PHOTO_DH / zoom;
    const currentCenterX = centerPoint.x + panOffset;
    const currentCenterY = centerPoint.y;
    const sx = Math.max(0, currentCenterX - srcW / 2);
    const sy = Math.max(0, currentCenterY - srcH / 2);

    ctx.drawImage(
      image,
      sx,
      sy,
      srcW,
      srcH,
      PHOTO_DX,
      PHOTO_DY,
      PHOTO_DW,
      PHOTO_DH
    );
    ctx.restore();

    // 4. 写真枠の繊細なボーダー
    ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
    ctx.lineWidth = 2;
    ctx.strokeRect(PHOTO_DX, PHOTO_DY, PHOTO_DW, PHOTO_DH);

    // 5. キャプション・メタ情報の描画（静止配置）
    ctx.textAlign = "center";

    // 段タイトル
    if (chapterTitle) {
      ctx.fillStyle = "#222222";
      ctx.font = "bold 38px 'Noto Serif JP', serif";
      ctx.fillText(`― ${chapterTitle} ―`, CANVAS_W / 2, 1490);
    }

    // 絵巻名
    if (title) {
      ctx.font = "30px 'Noto Serif JP', serif";
      ctx.fillStyle = "#555555";
      ctx.fillText(`『${title}』`, CANVAS_W / 2, 1550);
    }

    // ユーザーひとこと（引用符付き）
    if (customComment) {
      ctx.font = "italic 28px 'Noto Serif JP', serif";
      ctx.fillStyle = "#666666";
      ctx.fillText(`“${customComment}”`, CANVAS_W / 2, 1610);
    }

    // フッターエリア（ロゴ・URL・QRコード）
    const footerY = 1820;

    // フッターロゴ（アイコン + テキスト）
    ctx.textAlign = "center";
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#555555";
    const logoText = "絵巻物ビューアー | emakimono.com";

    if (logoImage) {
      const iconSize = 32;
      const textWidth = ctx.measureText(logoText).width;
      const totalWidth = iconSize + 10 + textWidth;
      const startX = (CANVAS_W - totalWidth) / 2;
      try {
        ctx.drawImage(logoImage, startX, footerY - 26, iconSize, iconSize);
      } catch (e) {}
      ctx.textAlign = "left";
      ctx.fillText(logoText, startX + iconSize + 10, footerY);
    } else {
      ctx.fillText(logoText, CANVAS_W / 2, footerY);
    }

    // ページURL
    if (pageUrl) {
      ctx.textAlign = "center";
      ctx.font = "18px sans-serif";
      ctx.fillStyle = "#999999";
      ctx.fillText(pageUrl, CANVAS_W / 2, footerY + 30);
    }

    // QRコード画像（右下）
    if (qrCodeImage) {
      const qrSize = 100;
      const qrX = CANVAS_W - PHOTO_DX - qrSize;
      const qrY = CANVAS_H - 140;
      try {
        ctx.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);
      } catch (e) {}
    }

    onProgress(Math.round(progress * 100));

    // 次フレームへ（描画タイミングを維持）
    await new Promise((r) => setTimeout(r, 1000 / FPS));
  }

  recorder.stop();
  const videoBlob = await recordingPromise;

  // 自動ダウンロードの実行
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const url = URL.createObjectURL(videoBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `emakimono-short-${Date.now()}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return videoBlob;
}
