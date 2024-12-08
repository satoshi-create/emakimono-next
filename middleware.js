import { NextResponse } from "next/server";

export function middleware(request) {
  const country = request.geo?.country || "US";
  const locale = country === "JP" ? "ja" : "en";
  const pathname = request.nextUrl.pathname;

  // ロケールがパスに含まれていない場合、適切なロケールを追加してリダイレクト
  if (!pathname.startsWith(`/${locale}`) && !pathname.startsWith("/_next")) {
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next).*)",
    // Optional: only run on root (/) URL
    // '/'
  ],
};
