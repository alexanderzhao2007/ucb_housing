"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface DeleteNoteButtonProps {
	noteId: string;
	noteTitle: string;
}

export function DeleteNoteButton({ noteId, noteTitle }: DeleteNoteButtonProps) {
	const router = useRouter();
	const supabase = createClient();
	const [isDeleting, setIsDeleting] = useState(false);

	async function handleDelete() {
		const confirmed = window.confirm(
			`Are you sure you want to delete "${noteTitle}"? This action cannot be undone.`,
		);

		if (!confirmed) return;

		setIsDeleting(true);

		try {
			const { error } = await supabase.from("notes").delete().eq("id", noteId);

			if (error) {
				toast.error(error.message || "Failed to delete note");
				return;
			}

			toast.success("Note deleted");
			router.push("/dashboard");
			router.refresh();
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={handleDelete}
			disabled={isDeleting}
			className="text-red-600 hover:text-red-700 hover:bg-red-50"
		>
			{isDeleting ? "Deleting..." : "Delete"}
		</Button>
	);
}
