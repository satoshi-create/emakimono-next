import { NextResponse } from "next/server";

export function middleware(request) {
  const country = request.geo.country || "US";
  const locale = country === "JP" ? "ja" : "en";
  const url = request.nextUrl.clone();

  if (url.pathname === "/") {
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  if (!url.pathname.startsWith(`/${locale}`)) {
    url.pathname = `/${locale}${url.pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
