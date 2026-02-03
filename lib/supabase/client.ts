import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Creates a Supabase client for use in the browser (Client Components).
 *
 * Use this in components that have "use client" at the top.
 * The client handles authentication state automatically using cookies.
 */
export function createClient() {
	return createBrowserClient<Database>(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
	);
}
