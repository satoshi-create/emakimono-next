import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, locale } = request.nextUrl;

  // ① ルートURLかつロケール未指定（= default のときだけ実行）
  if (pathname === "/" && locale === "default") {
    // ② Accept-Language ヘッダーを取得（例: "ja,en-US;q=0.9,en;q=0.8"）
    const acceptLang = request.headers.get("accept-language") || "";
    const preferredLang = acceptLang.split(",")[0]; // "ja" など

    // ③ ブラウザ言語が ja で始まっていれば ja、それ以外は en を採用
    const detectedLocale = preferredLang.startsWith("ja") ? "ja" : "en";

    // ④ URL をクローンして、pathname を `/{言語}` に書き換える
    const url = request.nextUrl.clone();
    url.pathname = `/${detectedLocale}`;

    // ⑤ リダイレクトを返す
    return NextResponse.redirect(url);
  }

  // ⑥ それ以外は何もせず処理を通す
  return NextResponse.next();
}

// ルートだけを対象にする（例： https://your-app.com/）
export const config = {
  matcher: ["/"],
};
