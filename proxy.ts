import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

const protectedPrefixes = ["/dashboard", "/bills", "/settings"];
const authPages = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthPage = authPages.includes(pathname);

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
