import { createClient } from "@/lib/supabase/server";
import { NoteList } from "@/components/notes/note-list";

export default async function DashboardPage() {
	const supabase = await createClient();

	const { data: notes } = await supabase
		.from("notes")
		.select("*")
		.order("created_at", { ascending: false });

	return <NoteList notes={notes ?? []} />;
}
