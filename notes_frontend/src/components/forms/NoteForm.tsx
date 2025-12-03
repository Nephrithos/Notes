"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOptions } from "../ui/combobox";

import { createNote, fetchInitialTags } from "../../services/notes";

// --- NEW IMPORTS FOR MARKDOWN EDITOR ---
import ReactMde from "react-mde";
import Showdown from "showdown";
// ------------------------------------

const formSchema = z.object({
  title: z
    .string()
    .min(2, {
      message: "Title must be at least 2 characters.",
    })
    .max(100, {
      message: "Title must not exceed 100 characters.",
    }),
  tags_input: z.array(z.string()).optional(),
  content: z
    .string()
    .min(10, {
      message: "Note content must be at least 10 characters.",
    })
    .max(5000, {
      message: "Note content must not exceed 5000 characters.",
    }),
});

type NoteFormValues = z.infer<typeof formSchema>;

interface NoteFormProps {
  noteToEdit?: Note; // This prop will contain the note data if we are editing
}

export function NoteForm({ noteToEdit }: NoteFormProps) {
  const navigate = useNavigate();
  const [noteTags, setNoteTags] = useState<ComboboxOptions[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // --- NEW STATE FOR MARKDOWN EDITOR ---
  // This state manages which tab (write/preview) is active in ReactMde
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");

  // Create a Showdown converter instance
  const markdownConverter = new Showdown.Converter({
    tables: true, // Enable table support
    simplifiedAutoLink: true, // Auto-link URLs
    strikethrough: true, // Strikethrough text
    tasklists: true, // Task lists (checkboxes)
  });
  // ------------------------------------

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(formSchema),
    // Set defaultValues based on noteToEdit or empty for creation
    defaultValues: {
      title: noteToEdit?.title || "",
      tags_input: noteToEdit?.tags_display || [],
      content: noteToEdit?.content || "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const loadTagsAndSetForm = async () => {
      try {
        setIsTagsLoading(true);
        const tagsFromApi = await fetchInitialTags();
        const formattedTags: ComboboxOptions[] = tagsFromApi.map(
          (tag: { name: string }) => ({
            value: tag.name.toLowerCase().replace(/\s+/g, "-"),
            label: tag.name,
          }),
        );

        // Combine fetched tags with existing tags from noteToEdit to ensure they are available in the combobox
        const allUniqueTags = new Map<string, ComboboxOptions>();
        formattedTags.forEach((tag) => allUniqueTags.set(tag.value, tag));
        if (noteToEdit && noteToEdit.tags_display) {
          noteToEdit.tags_display.forEach((tagName) => {
            const tagValue = tagName.toLowerCase().replace(/\s+/g, "-");
            if (!allUniqueTags.has(tagValue)) {
              allUniqueTags.set(tagValue, { value: tagValue, label: tagName });
            }
          });
        }
        setNoteTags(Array.from(allUniqueTags.values()));
      } catch (error) {
        console.error("Failed to load initial tags:", error);
      } finally {
        setIsTagsLoading(false);
      }
    };
    loadTagsAndSetForm();

    // Reset form fields if noteToEdit changes (important if component is reused without unmounting)
    if (noteToEdit) {
      form.reset({
        title: noteToEdit.title,
        tags_input: noteToEdit.tags_display || [],
        content: noteToEdit.content,
      });
    } else {
      // If no noteToEdit, ensure form is reset for new note creation
      form.reset({
        title: "",
        tags_input: [],
        content: "",
      });
    }
  }, [noteToEdit, form]);

  function handleCreateNoteTag(label: ComboboxOptions["label"]) {
    const newNoteTagValue = label.toLowerCase().replace(/\s+/g, "-");
    const newNoteTag: ComboboxOptions = {
      value: newNoteTagValue,
      label,
      isCreatable: true,
    };

    setNoteTags((prevNoteTags) => {
      if (!prevNoteTags.some((tag) => tag.value === newNoteTagValue)) {
        return [...prevNoteTags, newNoteTag];
      }
      return prevNoteTags;
    });

    const currentSelectedTags = form.getValues("tags_input") || [];
    if (!currentSelectedTags.includes(newNoteTagValue)) {
      form.setValue("tags_input", [...currentSelectedTags, newNoteTagValue], {
        shouldValidate: true,
      });
    }
  }

  function handleRemoveNoteTag(valueToRemove: ComboboxOptions["value"]) {
    setNoteTags((prevNoteTags) => {
      const updatedNoteTags = prevNoteTags.filter((f) => {
        const isMatch = f.value === valueToRemove;
        return !isMatch;
      });
      return updatedNoteTags;
    });

    const currentSelectedTags = form.getValues("tags_input") || [];

    const newSelectedTags = currentSelectedTags.filter(
      (v) => v !== valueToRemove,
    );
    form.setValue("tags_input", newSelectedTags, { shouldValidate: true });
  }

  async function onSubmit(values: NoteFormValues) {
    setSubmissionError(null);
    // console.log("Form submitted with values:", values);

    try {
      if (noteToEdit) {
        // --- EDIT LOGIC ---
        // Ensure you send the ID for update
        const updatedNote = await updateNote(noteToEdit.id, values);
        // console.log("Note updated successfully:", updatedNote);
        navigate(`/notes/${updatedNote.id}`); // Navigate back to the updated note's detail page
      } else {
        // --- CREATE LOGIC ---
        const createdNote = await createNote(values);
        // console.log("Note created successfully:", createdNote);
        navigate(`/notes/${createdNote.id}`); // Navigate to the newly created note's detail page
        form.reset(); // Reset form only after creation
      }
    } catch (error: any) {
      console.error("Failed to submit note:", error); // Changed log message
      const errorMessage = error.response?.data?.detail || error.message ||
        "An unknown error occurred.";
      setSubmissionError(errorMessage);
    }
  }

  const handleCancelClick = () => {
    // console.log("Form cancelled");
    if (noteToEdit) {
      navigate(`/notes/${noteToEdit.id}`); // Go back to the note's detail page
    } else {
      navigate("/home"); // Go back to home page for creation
    }
    form.reset(); // Reset form on cancel for good measure
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {noteToEdit ? "Edit Note" : "Create New Note"}
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {submissionError && (
            <div className="text-red-500 text-center text-sm mb-4 p-2 border border-red-500 rounded">
              Error: {submissionError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter note title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags_input"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Combobox
                      options={noteTags}
                      placeholder={isTagsLoading
                        ? "Loading tags..."
                        : "Select or create tags..."}
                      selected={field.value || []}
                      onChange={(selectedValues: string[]) => {
                        field.onChange(selectedValues);
                      }}
                      onCreate={handleCreateNoteTag}
                      onRemove={handleRemoveNoteTag}
                      className="min-w-0"
                      disabled={isTagsLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note Content</FormLabel>
                <FormControl>
                  <ReactMde
                    value={field.value} // `field.value` will be the markdown string
                    onChange={(value) => field.onChange(value)} // `field.onChange` updates react-hook-form state
                    selectedTab={selectedTab}
                    onTabChange={setSelectedTab}
                    generateMarkdownPreview={(markdown) =>
                      Promise.resolve(markdownConverter.makeHtml(markdown))}
                    minEditorHeight={200}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={handleCancelClick}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? (noteToEdit ? "Saving..." : "Creating...")
                : (noteToEdit ? "Save Changes" : "Create Note")}{" "}
              {/* Dynamic Button Text */}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
