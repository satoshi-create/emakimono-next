import { NextRequest, NextResponse } from "next/server";
import { toCloudinaryUploadRedirect } from "@/utils/cloudinaryUrl";

export function middleware(request: NextRequest) {
  const { pathname, locale } = request.nextUrl;

  const cloudinaryUrl = toCloudinaryUploadRedirect(pathname);
  if (cloudinaryUrl) {
    return NextResponse.redirect(cloudinaryUrl, 308);
  }

  // ルートURLかつロケール未指定（= default のときだけ実行）
  if (pathname === "/" && locale === "default") {
    const acceptLang = (request.headers.get("accept-language") || "").toLowerCase();
    const preferredLang = acceptLang.split(",")[0].trim();
    let detectedLocale = "en";
    if (preferredLang.startsWith("ja")) {
      detectedLocale = "ja";
    } else if (
      preferredLang.startsWith("zh-tw") ||
      preferredLang.startsWith("zh-hk") ||
      preferredLang.startsWith("zh-mo") ||
      preferredLang.includes("hant")
    ) {
      detectedLocale = "zh-Hant";
    } else if (preferredLang.startsWith("zh")) {
      detectedLocale = "zh-Hans";
    }
    const url = request.nextUrl.clone();
    url.pathname = `/${detectedLocale}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/kusouzu/:path*",
    "/en/kusouzu/:path*",
    "/ja/kusouzu/:path*",
    "/zh-Hans/kusouzu/:path*",
    "/zh-Hant/kusouzu/:path*",
  ],
};

