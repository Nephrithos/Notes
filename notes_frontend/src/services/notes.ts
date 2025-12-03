import api from "./api";

interface TagResponse {
  id: number;
  name: string;
  // Add any other fields your Tag serializer exposes
}

export type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags_display: string[];
};

export const HomePage = async () => {
  const response = await api.get("/notes/");
  return response.data;
};

export const createNote = async (noteData: {
  title: string;
  tags?: string[];
  content: string;
}) => {
  // console.log(noteData);
  const response = await api.post("/notes/", noteData); // Assuming /notes/ is your list/create endpoint
  return response.data;
};

export const fetchInitialTags = async (): Promise<TagResponse[]> => {
  try {
    // Make a GET request to your Django API endpoint for tags
    // Assuming your Django endpoint for listing tags is something like '/tags/'
    const response = await api.get<TagResponse[]>("/tags/");
    return response.data;
  } catch (error) {
    console.error("Error fetching initial tags:", error);
    // You might want to throw the error or return an empty array/handle it upstream
    throw error;
  }
};

export const fetchNoteById = async (noteId: number): Promise<Note> => {
  try {
    // Construct the URL using the noteId
    // Assuming your DRF URL pattern for NoteView is something like 'notes/<int:id>/'
    const response = await api.get<Note>(`/note/${noteId}/`);
    return response.data;
  } catch (error) {
    // Log the error and re-throw it so the component can handle it
    console.error(`Error fetching note with ID ${noteId}:`, error);
    throw error;
  }
};

export const updateNote = async (
  noteId: number,
  noteData: { title: string; content: string; tags?: string[] },
): Promise<Note> => {
  try {
    const response = await api.put<Note>(`/note/${noteId}/`, noteData);
    return response.data;
  } catch (error) {
    console.error(`Error updating note with ID ${noteId}:`, error);
    throw error;
  }
};

export const deleteNote = async (noteId: number) => {
  try {
    const response = await api.delete(`note/${noteId}/`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting Note with ID ${noteId}:`, error);
    throw error;
  }
};
