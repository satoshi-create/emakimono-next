// workers/emaki-proxy/src/index.js (または該当の index.js)
var index_default = {
  async fetch(request, env, ctx) {
    // 1. GET および HEAD 以外のメソッドを弾く
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // 2. Cloudflare のエッジキャッシュを確認
    const cache = caches.default;
    let response = await cache.match(request);

    if (response) {
      // キャッシュ HIT: 保存されているレスポンスをそのまま返却
      // ※ cf-cache-status は Cloudflare エッジが自動で HIT を付与します
      return response;
    }

    // 3. キャッシュ MISS: R2 からオブジェクトを取得
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.replace(/^\//, ""));
    if (!key) {
      return new Response("Missing object key", { status: 400 });
    }

    const object = await env.EMAKI_BUCKET.get(key);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    // ※ 手動での "cf-cache-status" 設定は行わない

    response = new Response(request.method === "HEAD" ? null : object.body, {
      status: 200,
      headers,
    });

    // 4. GET リクエストの場合のみエッジキャッシュへ非同期保存
    if (request.method === "GET") {
      ctx.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  }
};

export {
  index_default as default
};