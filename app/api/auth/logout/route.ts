import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Signs out the current user and clears their session cookies.
 */
export async function POST() {
	try {
		const supabase = await createClient();

		const { error } = await supabase.auth.signOut();

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ message: "Logged out successfully" });
	} catch {
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}
