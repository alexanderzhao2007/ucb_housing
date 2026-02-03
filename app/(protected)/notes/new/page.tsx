import { NoteForm } from "@/components/notes/note-form";

export default function NewNotePage() {
	return (
		<div className="py-6">
			<NoteForm mode="create" />
		</div>
	);
}
