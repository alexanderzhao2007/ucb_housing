import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for signup
const signupSchema = z.object({
	email: z.email("Please enter a valid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * POST /api/auth/signup
 *
 * Creates a new user account. Sends a confirmation email to verify
 * the user's email address.
 */
export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const body = await request.json();

		// Validate the request body
		const result = signupSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json(
				{ error: result.error.issues[0].message },
				{ status: 400 },
			);
		}

		const { email, password } = result.data;

		// Create the user account
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				// Redirect here after clicking the confirmation email link
				emailRedirectTo: `${new URL(request.url).origin}/auth/confirm`,
			},
		});

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json({
			message: "Check your email to confirm your account",
			user: data.user,
		});
	} catch {
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}
