import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { deleteNote, fetchNoteById } from "../../services/notes.ts";
import type { Note } from "../../services/notes.ts";
import Showdown from "showdown"; // For rendering markdown content
import { Button } from "@/components/ui/button";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Create a single Showdown converter instance
const markdownConverter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
});

export function ShowNotes() {
    const { noteId } = useParams<{ noteId: string }>(); // Get noteId from URL
    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        setDeleteError(null);
        if (noteId) {
            const id = parseInt(noteId); // Parse string ID to number
            if (isNaN(id)) {
                setError("Invalid Note ID");
                setLoading(false);
                return;
            }

            const getNote = async () => {
                try {
                    const fetchedNote = await fetchNoteById(id);
                    setNote(fetchedNote);
                } catch (err: any) {
                    console.error("Error fetching note details:", err);
                    if (err.response && err.response.status === 404) {
                        setError("Note not found.");
                    } else if (err.response && err.response.status === 401) {
                        setError(
                            "You are not authorized to view this note. Please log in.",
                        );
                    } else {
                        setError(
                            "Failed to load note. Please try again later.",
                        );
                    }
                } finally {
                    setLoading(false);
                }
            };
            getNote();
        }
    }, [noteId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-lg font-medium">
                Loading note...
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
        return (
            <div className="flex justify-center items-center h-screen text-lg font-medium">
                No note data available.
            </div>
        );
    }

    const handleEditClick = () => {
        if (note) {
            navigate(`/notes/${note.id}/edit`);
        }
    };

    const confirmDelete = async () => {
        if (note) {
            setDeleteError(null); // Clear previous delete error
            try {
                await deleteNote(note.id);
                // On successful delete, navigate to homepage with a success message
                navigate("/home", {
                    state: { message: "Note deleted successfully!" },
                });
            } catch (err: any) {
                console.error("Failed to delete note:", err);
                const errorMessage = err.response?.data?.detail ||
                    err.message || "Failed to delete note.";
                setDeleteError(errorMessage); // Set error message to display on the show page
            }
        }
    };

    return (
        <div className="container mx-auto p-4 mt-20">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-4xl font-bold">{note.title}</h1>
                <div className="space-x-4">
                    <Button onClick={handleEditClick}>Edit</Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete your note and remove its
                                    data from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete}>
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {deleteError && ( // Display delete error if present
                <div className="text-red-500 text-center text-sm mb-4 p-2 border border-red-500 rounded">
                    Error: {deleteError}
                </div>
            )}

            {note.tags_display && note.tags_display.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags_display.map((tag, index) => (
                        <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
            <p className="text-sm text-gray-500 mb-6">
                Created: {new Date(note.created_at).toLocaleDateString()}{" "}
                | Last Updated: {new Date(note.updated_at).toLocaleDateString()}
            </p>
            <div className="prose max-w-none">
                {/* Apply prose for markdown rendering */}
                <div
                    className="prose prose-invert"
                    dangerouslySetInnerHTML={{
                        __html: markdownConverter.makeHtml(note.content),
                    }}
                />
            </div>
        </div>
    );
}
