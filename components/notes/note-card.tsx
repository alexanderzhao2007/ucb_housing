"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tables } from "@/lib/supabase/database.types";

interface NoteCardProps {
	note: Tables<"notes">;
}

export function NoteCard({ note }: NoteCardProps) {
	const formattedDate = new Date(note.created_at).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return (
		<Link href={`/notes/${note.id}`}>
			<Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
				<CardHeader className="pb-2">
					<CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
					<p className="text-xs text-muted-foreground">{formattedDate}</p>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground line-clamp-3">
						{note.content || "No content"}
					</p>
				</CardContent>
			</Card>
		</Link>
	);
}
