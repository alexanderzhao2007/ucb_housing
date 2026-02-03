import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

/**
 * Middleware runs on every request before it reaches the page.
 *
 * It handles:
 * 1. Refreshing the user's auth token (keeps them logged in)
 * 2. Redirecting unauthenticated users away from protected pages
 * 3. Redirecting authenticated users away from login/signup pages
 */
export async function middleware(request: NextRequest) {
	return await updateSession(request);
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder assets (images, etc.)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
