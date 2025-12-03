import { ThemeProvider } from "@/components/ui/theme-provider";
import { Navigate, Route, Routes } from "react-router-dom";
import { NewNote } from "./components/pages/NewNote.tsx";
import { Login } from "./components/pages/Login.tsx";
import { Register } from "./components/pages/Register.tsx";
import { Home } from "./components/pages/HomePage.tsx";
import { ShowNotes } from "./components/pages/ShowNotes.tsx";
import { EditNote } from "./components/pages/EditNote.tsx";
import { UserProfilePage } from "./components/pages/Profile.tsx";
import { Layout } from "./components/ui/layout.tsx";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/new" element={<NewNote />} />
          <Route path="/notes/:noteId" element={<ShowNotes />} />
          <Route path="/notes/:noteId/edit" element={<EditNote />} />
          <Route path="/profile" element={<UserProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
