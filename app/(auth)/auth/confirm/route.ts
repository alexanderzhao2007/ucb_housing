import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /auth/confirm
 *
 * This route handles the email confirmation link that Supabase sends.
 * When users click the link in their email, they're redirected here.
 *
 * The URL contains a token_hash and type that we exchange for a session.
 */
export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);

	// Get the code from the URL (Supabase adds this)
	const code = searchParams.get("code");

	if (code) {
		const supabase = await createClient();

		// Exchange the code for a session
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			// Successfully confirmed! Redirect to dashboard
			return NextResponse.redirect(`${origin}/dashboard`);
		}
	}

	// Something went wrong, redirect to login with error
	return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
