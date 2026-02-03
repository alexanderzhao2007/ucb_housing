import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { useDebounce } from "./use-debounce";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutoSaveOptions {
	/**
	 * The Supabase client instance to use for database operations
	 */
	supabase: SupabaseClient<Database>;

	/**
	 * The ID of the note being edited (undefined for new notes)
	 */
	noteId?: string;

	/**
	 * The title of the note
	 */
	title: string;

	/**
	 * The content of the note
	 */
	content: string;

	/**
	 * The debounce delay in milliseconds
	 * @default 500
	 */
	debounceMs?: number;

	/**
	 * Callback invoked when a note is successfully created
	 * Receives the new note ID
	 */
	onNoteCreated?: (noteId: string) => void;

	/**
	 * Callback invoked when save succeeds
	 */
	onSaveSuccess?: () => void;

	/**
	 * Callback invoked when save fails
	 */
	onSaveError?: (error: Error) => void;
}

export interface UseAutoSaveReturn {
	/**
	 * Current save status
	 */
	status: SaveStatus;

	/**
	 * Timestamp of last successful save
	 */
	lastSaved: Date | null;

	/**
	 * Error message if save failed
	 */
	error: string | null;

	/**
	 * Manually trigger a save (useful for blur events)
	 */
	triggerSave: () => Promise<void>;
}

/**
 * Hook for auto-saving notes to Supabase with debouncing.
 *
 * Features:
 * - Automatically saves changes after debounce delay
 * - Handles both create (insert) and update operations
 * - Prevents concurrent saves (queues them instead)
 * - Provides save status feedback
 * - Handles errors gracefully
 *
 * @example
 * const { status, triggerSave } = useAutoSave({
 *   supabase,
 *   noteId: note?.id,
 *   title,
 *   content,
 *   onNoteCreated: (id) => router.push(`/notes/${id}?edit=true`),
 * });
 */
export function useAutoSave({
	supabase,
	noteId,
	title,
	content,
	debounceMs = 500,
	onNoteCreated,
	onSaveSuccess,
	onSaveError,
}: UseAutoSaveOptions): UseAutoSaveReturn {
	const [status, setStatus] = useState<SaveStatus>("idle");
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Track the current note ID (may change after creation)
	const currentNoteIdRef = useRef<string | undefined>(noteId);
	const isSavingRef = useRef(false);
	const pendingSaveRef = useRef(false);
	// Track initial values to prevent saving unchanged content on existing notes
	const initialValuesRef = useRef({ title, content, noteId });

	// Update the ref when noteId prop changes
	useEffect(() => {
		currentNoteIdRef.current = noteId;
	}, [noteId]);

	// Debounce the title and content
	const debouncedTitle = useDebounce(title, debounceMs);
	const debouncedContent = useDebounce(content, debounceMs);

	/**
	 * Performs the actual save operation
	 */
	const performSave = useCallback(
		async (titleToSave: string, contentToSave: string) => {
			// Don't save if title is empty
			if (!titleToSave.trim()) {
				return;
			}

			// If already saving, queue this save
			if (isSavingRef.current) {
				pendingSaveRef.current = true;
				return;
			}

			isSavingRef.current = true;
			setStatus("saving");
			setError(null);

			try {
				const hasNoteId = !!currentNoteIdRef.current;

				if (hasNoteId) {
					// Update existing note
					const { error: updateError } = await supabase
						.from("notes")
						.update({
							title: titleToSave,
							content: contentToSave || null,
						})
						.eq("id", currentNoteIdRef.current!);

					if (updateError) throw updateError;
				} else {
					// Create new note - need to get user ID for RLS policy
					const {
						data: { user },
					} = await supabase.auth.getUser();
					if (!user) {
						throw new Error("You must be logged in to create a note");
					}

					const { data, error: insertError } = await supabase
						.from("notes")
						.insert({
							title: titleToSave,
							content: contentToSave || null,
							user_id: user.id,
						})
						.select()
						.single();

					if (insertError) throw insertError;

					if (data) {
						// Update the ref with the new note ID
						currentNoteIdRef.current = data.id;
						// Notify parent component
						onNoteCreated?.(data.id);
					}
				}

				// Save succeeded
				setStatus("saved");
				setLastSaved(new Date());
				setError(null);
				onSaveSuccess?.();

				// Auto-hide "Saved" indicator after 2 seconds
				setTimeout(() => {
					setStatus((current) => (current === "saved" ? "idle" : current));
				}, 2000);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to save note";
				setStatus("error");
				setError(errorMessage);
				onSaveError?.(
					err instanceof Error ? err : new Error("Failed to save note"),
				);
			} finally {
				isSavingRef.current = false;

				// If there's a pending save, execute it
				if (pendingSaveRef.current) {
					pendingSaveRef.current = false;
					performSave(title, content);
				}
			}
		},
		[supabase, title, content, onNoteCreated, onSaveSuccess, onSaveError],
	);

	/**
	 * Manually trigger a save (for blur events)
	 */
	const triggerSave = useCallback(async () => {
		await performSave(title, content);
	}, [performSave, title, content]);

	// Auto-save when debounced values change
	useEffect(() => {
		// For existing notes, skip save if content hasn't changed from initial values
		if (noteId) {
			const { title: initialTitle, content: initialContent } =
				initialValuesRef.current;
			const hasChanged =
				debouncedTitle !== initialTitle || debouncedContent !== initialContent;
			if (!hasChanged) {
				return;
			}
		}

		// Only trigger auto-save if we have content
		if (debouncedTitle || debouncedContent) {
			performSave(debouncedTitle, debouncedContent);
		}
	}, [debouncedTitle, debouncedContent, performSave, noteId]);

	// Save on beforeunload if there are pending changes
	useEffect(() => {
		const handleBeforeUnload = () => {
			// If title is different from debounced title, we have unsaved changes
			if (title !== debouncedTitle || content !== debouncedContent) {
				// Trigger immediate save (won't wait for response in beforeunload)
				performSave(title, content);
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [title, content, debouncedTitle, debouncedContent, performSave]);

	return {
		status,
		lastSaved,
		error,
		triggerSave,
	};
}
