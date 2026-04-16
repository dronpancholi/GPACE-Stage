import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // EMERGENCY BYPASS: Temporarily disabling all middleware logic to recover visibility
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
