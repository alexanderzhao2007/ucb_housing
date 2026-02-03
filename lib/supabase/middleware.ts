import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Updates the user's session by refreshing the auth token.
 *
 * This function is called by the middleware on every request.
 * It ensures the user's session stays fresh and handles redirects
 * for protected/auth routes.
 */
export async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// IMPORTANT: Do not add any code between createServerClient and
	// supabase.auth.getUser(). A simple mistake could make your app
	// vulnerable to security issues.

	const {
		data: { user },
	} = await supabase.auth.getUser();

	// Don't redirect for API routes - they handle their own auth
	const isApiRoute = request.nextUrl.pathname.startsWith("/api/");
	if (isApiRoute) {
		return supabaseResponse;
	}

	// Define which paths are public (don't require auth)
	const publicPaths = ["/", "/login", "/signup", "/auth"];
	const isPublicPath = publicPaths.some(
		(path) =>
			request.nextUrl.pathname === path ||
			request.nextUrl.pathname.startsWith("/auth/"),
	);

	// Redirect unauthenticated users away from protected routes
	if (!user && !isPublicPath) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	// Redirect authenticated users away from auth pages (login/signup)
	if (
		user &&
		(request.nextUrl.pathname === "/login" ||
			request.nextUrl.pathname === "/signup")
	) {
		const url = request.nextUrl.clone();
		url.pathname = "/dashboard";
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}
