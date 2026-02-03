"use client";

import Link from "next/link";
import { NoteCard } from "./note-card";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Plus, FileText } from "lucide-react";
import { Tables } from "@/lib/supabase/database.types";

interface NoteListProps {
	notes: Tables<"notes">[];
}

export function NoteList({ notes }: NoteListProps) {
	if (notes.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<FileText className="h-12 w-12" />
					</EmptyMedia>
					<EmptyTitle>No notes yet</EmptyTitle>
					<EmptyDescription>
						Get started by creating your first note.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Link href="/notes/new">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create note
						</Button>
					</Link>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Link href="/notes/new">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Create note
					</Button>
				</Link>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{notes.map((note) => (
					<NoteCard key={note.id} note={note} />
				))}
			</div>
		</div>
	);
}
