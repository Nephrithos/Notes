import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom"; // Import useNavigate as well, for redirects
import { NoteForm } from "../forms/NoteForm"; // Correct path to your NoteForm
import { fetchNoteById } from "../../services/notes"; // Import the fetch function
import type { Note } from "../../services/notes"; // Import the Note type

export function EditNote() {
    const { noteId } = useParams<{ noteId: string }>(); // Get noteId from URL
    const location = useLocation(); // Get access to location state
    const navigate = useNavigate(); // For potential redirects

    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getNoteData = async () => {
            setLoading(true);
            setError(null); // Reset error state

            // 1. Try to get note data from location.state (passed from ShowNotes)
            const noteFromState = location.state?.noteToEdit as
                | Note
                | undefined;

            if (
                noteFromState && noteFromState.id === parseInt(noteId || "", 10)
            ) {
                // If data is in state and matches the ID, use it directly
                setNote(noteFromState);
                setLoading(false);
            } else if (noteId) {
                // 2. If not in state, or ID doesn't match, fetch from API
                const id = parseInt(noteId, 10);
                if (isNaN(id)) {
                    setError("Invalid Note ID in URL.");
                    setLoading(false);
                    return;
                }

                try {
                    const fetchedNote = await fetchNoteById(id);
                    setNote(fetchedNote);
                } catch (err: any) {
                    console.error(
                        `Error fetching note with ID ${noteId}:`,
                        err,
                    );
                    if (err.response && err.response.status === 404) {
                        setError("Note not found.");
                    } else if (err.response && err.response.status === 401) {
                        setError(
                            "You are not authorized to edit this note. Please log in.",
                        );
                    } else {
                        setError(
                            "Failed to load note for editing. Please try again later.",
                        );
                    }
                } finally {
                    setLoading(false);
                }
            } else {
                // No noteId in URL and no state, perhaps redirect to create or home
                setError("No note ID provided to edit.");
                setLoading(false);
                // Optionally redirect
                // navigate('/create-note');
            }
        };

        getNoteData();
    }, [noteId, location.state, navigate]); // Depend on noteId and location.state

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-lg font-medium">
                Loading note for editing...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-600 text-center text-lg p-4 border border-red-300 rounded-md">
                    {error}
                </div>
            </div>
        );
    }

    if (!note) {
        // This case should ideally be caught by error handling, but as a fallback
        return (
            <div className="flex justify-center items-center h-screen text-lg font-medium">
                Note data not available for editing.
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 mt-20">
            {/* Pass the fetched/retrieved note data to the NoteForm */}
            <NoteForm noteToEdit={note} />
        </div>
    );
}
