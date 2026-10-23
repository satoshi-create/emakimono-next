// workers/emaki-proxy/src/index.js
export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      // 先頭のスラッシュを除去して R2 のオブジェクトキーにする
      const key = decodeURIComponent(url.pathname.replace(/^\//, ""));
  
      if (!key) {
        return new Response("Missing object key", { status: 400 });
      }
  
      // R2 から画像を取得
      const object = await env.EMAKI_BUCKET.get(key);
      if (!object) {
        return new Response("Not Found", { status: 404 });
      }
  
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
  
      // ★ 学校環境・同時アクセスに耐える最強キャッシュヘッダー
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Access-Control-Allow-Origin", "*");
  
      return new Response(object.body, { headers });
    },
  };