// src/components/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { HomePage as fetchNotesService } from "../../services/notes";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { fetchUserProfile } from "../../services/user";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOptions } from "@/components/ui/combobox";

// --- NEW IMPORT FOR MARKDOWN RENDERING ---
import Showdown from "showdown";
// ------------------------------------

// Define the type for a single note, matching your backend's NoteSerializer output
type Note = {
  id: number;
  title: string;
  tags_display: string[];
  content: string; // This will now contain markdown
  created_at: string;
  updated_at: string;
};

// Create a single Showdown converter instance outside the component
// This prevents re-creating it on every render, which is more efficient.
const markdownConverter = new Showdown.Converter({
  tables: true, // Enable table support
  simplifiedAutoLink: true, // Auto-link URLs
  strikethrough: true, // Strikethrough text
  tasklists: true, // Task lists (checkboxes)
});

// Helper function to truncate and convert content for a preview
const getNotePreviewHtml = (
  content: string,
  maxLength: number = 150,
): string => {
  if (content.length <= maxLength) {
    return markdownConverter.makeHtml(content); // Convert full content if short enough
  }
  // Truncate the raw markdown first
  const truncatedMarkdown =
    content.substring(0, content.lastIndexOf(" ", maxLength)) + "...";
  return markdownConverter.makeHtml(truncatedMarkdown); // Convert truncated markdown to HTML
};

export function Home() {
  // const { user } = useAuth(); // REMOVED: Not using AuthContext for user details anymore
  const navigate = useNavigate();

  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true); // Renamed for clarity
  const [errorNotes, setErrorNotes] = useState<string | null>(null); // Renamed for clarity

  const [userDisplayName, setUserDisplayName] = useState<string>(""); // NEW: State for user display name
  const [loadingUser, setLoadingUser] = useState(true); // NEW: State for user loading
  const [errorUser, setErrorUser] = useState<string | null>(null); // NEW: State for user error

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagValues, setSelectedTagValues] = useState<string[]>([]);
  const [availableTagOptions, setAvailableTagOptions] = useState<
    ComboboxOptions[]
  >([]);

  // Effect to fetch Notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await fetchNotesService(); // Using renamed import
        setAllNotes(data);

        const uniqueTags = new Set<string>();
        data.forEach((note) => {
          note.tags_display?.forEach((tag) => uniqueTags.add(tag));
        });

        const options: ComboboxOptions[] = Array.from(uniqueTags).map(
          (tag) => ({
            value: tag.toLowerCase().replace(/\s+/g, "-"),
            label: tag,
          }),
        );
        setAvailableTagOptions(options);
      } catch (err: any) {
        console.error("Error fetching notes:", err);
        // Note: Layout.tsx already handles 401 redirection, so this might be redundant
        // but kept for specific error messages for notes fetch.
        if (err.response && err.response.status === 401) {
          setErrorNotes("You are not authorized to view notes. Please log in.");
        } else {
          setErrorNotes("Failed to load notes. Please try again later.");
        }
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, []); // Run once on component mount

  // NEW: Effect to fetch User Profile for display name
  useEffect(() => {
    const loadUserDisplayName = async () => {
      try {
        setLoadingUser(true);
        const userProfile = await fetchUserProfile(); // Fetch the full profile

        if (userProfile) {
          if (userProfile.profile && userProfile.profile.first_name) {
            setUserDisplayName(userProfile.profile.first_name);
          } else {
            setUserDisplayName(userProfile.username); // Fallback to username
          }
        } else {
          setUserDisplayName(""); // No user profile
        }
      } catch (err: any) {
        console.error(
          "Failed to fetch user profile for HomePage display:",
          err,
        );
        setErrorUser("Failed to load user name.");
        setUserDisplayName("");
      } finally {
        setLoadingUser(false);
      }
    };

    loadUserDisplayName();
  }, []); // Run once on component mount

  const filteredNotes = useMemo(() => {
    let currentNotes = allNotes;

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      currentNotes = currentNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(lowerCaseQuery) ||
          note.content.toLowerCase().includes(lowerCaseQuery),
      );
    }

    if (selectedTagValues.length > 0) {
      currentNotes = currentNotes.filter((note) => {
        return selectedTagValues.some((selectedVal) =>
          note.tags_display?.some(
            (noteTag) =>
              noteTag.toLowerCase().replace(/\s+/g, "-") === selectedVal,
          )
        );
      });
    }

    return currentNotes;
  }, [allNotes, searchQuery, selectedTagValues]);

  const handleCreateNoteClick = () => {
    navigate("/new");
  };

  const handleClickNote = (noteId: number) => {
    navigate(`/notes/${noteId}`);
  };

  // Combined loading state for notes and user data
  if (loadingNotes || loadingUser) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-medium">
        Loading data...
      </div>
    );
  }

  // Combined error state
  if (errorNotes || errorUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-600 text-center text-lg p-4 border border-red-300 rounded-md">
          {errorNotes || errorUser} {/* Display the first error encountered */}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-20 mx-auto p-4 not-prose">
      {userDisplayName && (
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl mb-6">
          Welcome, {userDisplayName}!
        </h1>
      )}
      {!userDisplayName && (
        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl mb-6">
          Your Notes
        </h1>
      )}
      <p className="text-lg text-muted-foreground max-w-2xl mb-8">
        Your personalized space to manage and organize your notes.
      </p>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label htmlFor="search-notes" className="sr-only">
            Search notes by title or content
          </label>
          <Input
            id="search-notes"
            placeholder="Search notes by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="filter-tags" className="sr-only">
            Filter by tags
          </label>
          <Combobox
            options={availableTagOptions}
            selected={selectedTagValues}
            onChange={setSelectedTagValues}
            placeholder="Filter by tags..."
            className="w-full"
            onCreate={() => { }}
            onRemove={() => { }}
          />
        </div>
      </div>

      <div className="flex justify-end mb-8">
        <Button onClick={handleCreateNoteClick} className="px-6 py-3 text-lg">
          Create New Note
        </Button>
      </div>

      {filteredNotes.length === 0
        ? (
          <div className="text-center text-gray-500 text-lg mt-10">
            {searchQuery || selectedTagValues.length > 0
              ? "No notes match your search and filter criteria."
              : "No notes available. Click 'Create New Note' to add one!"}
          </div>
        )
        : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map((note) => (
              <li key={note.id}>
                <Card
                  className="h-[15rem] flex flex-col cursor-pointer transition-all hover:shadow-xl hover:scale-[1.01]"
                  onClick={() => handleClickNote(note.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-xl font-bold leading-tight">
                      {note.title}
                    </CardTitle>
                    {note.tags_display && note.tags_display.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {note.tags_display.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-2 py-1 rounded-full text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <CardDescription className="text-xs text-gray-500 mt-2">
                      Created: {new Date(note.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {/* --- RENDER MARKDOWN HERE --- */}
                    <div
                      className="prose max-w-none" // Tailwind Typography classes for basic markdown styling
                      dangerouslySetInnerHTML={{
                        __html: getNotePreviewHtml(note.content),
                      }}
                    />
                    {/* --------------------------- */}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
