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
    const acceptLang = request.headers.get("accept-language") || "";
    const preferredLang = acceptLang.split(",")[0];
    const detectedLocale = preferredLang.startsWith("ja") ? "ja" : "en";
    const url = request.nextUrl.clone();
    url.pathname = `/${detectedLocale}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/kusouzu/:path*", "/en/kusouzu/:path*", "/ja/kusouzu/:path*"],
};

