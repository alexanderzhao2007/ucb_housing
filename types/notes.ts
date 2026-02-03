/**
 * Data required to create a new note.
 */
export interface CreateNoteInput {
	title: string;
	content?: string;
}

/**
 * Data that can be updated on an existing note.
 */
export interface UpdateNoteInput {
	title?: string;
	content?: string;
}
