import { NextResponse } from "next/server";

export function middleware(req) {
  const { nextUrl, headers } = req;

  // ユーザーのAccept-Language（ブラウザ言語設定）を取得
  const acceptLanguage = headers.get("accept-language") || "";
  const country = headers.get("x-vercel-ip-country") || ""; // IPから国判定（Vercel環境）

  // 日本のユーザーを判定（ブラウザが日本語設定 or 国がJPの場合）
  if (acceptLanguage.includes("ja") || country === "JP") {
    const url = nextUrl.clone();
    url.locale = "ja"; // 日本語ページへリダイレクト
    return NextResponse.redirect(url);
  }

  // それ以外のユーザーは英語ページ
  const url = nextUrl.clone();
  url.locale = "en"; // 英語ページへリダイレクト
  return NextResponse.redirect(url);
}
