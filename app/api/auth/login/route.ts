import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for login
const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 *
 * Authenticates a user with their email and password.
 * Sets session cookies on success.
 */
export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const body = await request.json();

		// Validate the request body
		const result = loginSchema.safeParse(body);
		if (!result.success) {
			return NextResponse.json(
				{ error: result.error.issues[0].message },
				{ status: 400 },
			);
		}

		const { email, password } = result.data;

		// Attempt to sign in
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 401 });
		}

		return NextResponse.json({
			message: "Logged in successfully",
			user: data.user,
		});
	} catch {
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}
