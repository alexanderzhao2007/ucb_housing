"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import { SaveStatusIndicator } from "./save-status-indicator";
import { DeleteNoteButton } from "./delete-note-button";
import { Tables } from "@/lib/supabase/database.types";

interface NoteFormProps {
	note?: Tables<"notes">;
	mode: "create" | "edit";
}

export function NoteForm({ note, mode }: NoteFormProps) {
	const router = useRouter();
	const supabase = createClient();

	// Controlled inputs for title and content
	const [title, setTitle] = useState(note?.title || "");
	const [content, setContent] = useState(note?.content || "");

	// Memoize callback to prevent unnecessary re-renders of the auto-save hook
	const handleNoteCreated = useCallback(
		(newNoteId: string) => {
			// After creating the note, redirect to edit mode
			router.push(`/notes/${newNoteId}?edit=true`);
		},
		[router],
	);

	// Auto-save hook
	const { status, error, triggerSave } = useAutoSave({
		supabase,
		noteId: note?.id,
		title,
		content,
		debounceMs: 500,
		onNoteCreated: handleNoteCreated,
	});

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<Link
						href="/dashboard"
						className="text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Go Back
					</Link>
					<div className="flex items-center gap-2">
						<SaveStatusIndicator
							status={status}
							error={error}
							onRetry={triggerSave}
						/>
						{mode === "edit" && note && (
							<DeleteNoteButton noteId={note.id} noteTitle={note.title} />
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<Input
						id="title"
						placeholder="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						onBlur={triggerSave}
						autoComplete="off"
						className="border-0 p-0 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
					/>
					<Textarea
						id="content"
						placeholder="Write your note here..."
						rows={10}
						value={content}
						onChange={(e) => setContent(e.target.value)}
						onBlur={triggerSave}
						className="border-0 p-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
					/>
				</div>
			</CardContent>
		</Card>
	);
}
