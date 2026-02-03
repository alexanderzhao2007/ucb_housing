import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";

/**
 * Layout for protected pages (requires authentication).
 *
 * The middleware handles redirecting unauthenticated users,
 * so if we reach this layout, the user is logged in.
 */
export default async function ProtectedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<div className="min-h-screen flex flex-col">
			<Header userEmail={user?.email} />
			<main className="flex-1 container py-6">{children}</main>
		</div>
	);
}
