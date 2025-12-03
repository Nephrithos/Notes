# Markdown Notes

A full-stack notes application with tag-based organization and dark mode. Built with React + TypeScript frontend and Django REST API backend to explore modern full-stack development patterns.

![Markdown Notes Dashboard](docs/screenshot-dashboard.png)

## Features

- **Tag-Based Organization** - Categorize notes with multiple tags for flexible organization
- **Search & Filter** - Real-time search across note titles and content, filter by tags
- **Dark Mode** - Eye-friendly dark theme optimized for long writing sessions
- **REST API Backend** - Django-powered API for data persistence
- **Clean UI** - Minimal interface using shadcn/ui components
- **Fast & Lightweight** - Built with Vite for instant hot module replacement

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **shadcn/ui** - Composable component library
- **Tailwind CSS** - Utility-first styling
- **Vite** - Build tool and dev server
- **Lucide Icons** - Icon library
- **Yarn** - Package manager

### Backend
- **Django** - Web framework
- **Django REST Framework** - RESTful API
- **SQLite** - Database (development)
- **Python 3.x** - Backend language

## Getting Started

### Prerequisites

- **Node.js 18+** and **Yarn**
- **Python 3.8+** and **pip**

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/Nephrithos/markdown-notes.git
cd markdown-notes
```

#### 2. Backend Setup

```bash
cd notes_backend

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the Django development server
python manage.py runserver
```

The backend API will be available at [http://localhost:8000](http://localhost:8000)

#### 3. Frontend Setup

Open a new terminal window:

```bash
cd notes_frontend

# Install dependencies
yarn install

# Start the development server
yarn dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173)

### Environment Variables

Create a `.env` file in `notes_frontend/` if you need to customize the API URL:

```env
VITE_API_URL=http://localhost:8000/api
```

## Usage

### Creating Notes

1. Click the "Create New Note" button
2. Enter a title and content
3. Add tags by typing and pressing Enter
4. Notes are automatically saved to the backend API

### Organizing with Tags

- Add multiple tags to each note for flexible categorization
- Click a tag to filter all notes with that tag
- Tags are color-coded for easy visual identification

### Searching

- Use the search bar to find notes by title or content
- Search updates in real-time as you type
- Combine search with tag filters for precise results

### Managing Notes

- Click "Edit" to modify a note
- Click "Delete" to remove a note (with confirmation)
- View creation and last updated timestamps

## API Endpoints

The Django backend provides the following REST API endpoints:

### Notes
- `GET /api/notes/` - List all notes
- `POST /api/notes/` - Create a new note
- `GET /api/notes/{id}/` - Retrieve a specific note
- `PUT /api/notes/{id}/` - Update a note
- `PATCH /api/notes/{id}/` - Partially update a note
- `DELETE /api/notes/{id}/` - Delete a note

### Tags
- `GET /api/tags/` - List all unique tags
- `GET /api/notes/?tags=tag1,tag2` - Filter notes by tags
- `GET /api/notes/?search=query` - Search notes by title/content

## Project Structure

```
markdown-notes/
├── notes_backend/           # Django REST API
│   ├── notes/              # Notes app
│   │   ├── migrations/
│   │   ├── models.py       # Note model
│   │   ├── serializers.py  # DRF serializers
│   │   ├── views.py        # API views
│   │   └── urls.py         # API routes
│   ├── notes_api/          # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3
├── notes_frontend/          # React + TypeScript app
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   ├── NoteCard.tsx
│   │   │   ├── NoteDetail.tsx
│   │   │   ├── NotesList.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── lib/
│   │   │   └── utils.ts    # Utility functions
│   │   ├── hooks/
│   │   │   └── useNotes.ts # API integration hook
│   │   ├── types/
│   │   │   └── note.ts     # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── node_modules/
├── package-lock.json
└── yarn.lock
```

## Data Models

### TypeScript Interface (Frontend)

```typescript
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface AppState {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  selectedTags: string[];
}
```

### Django Model (Backend)

```python
from django.db import models

class Note(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True)
    tags = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return self.title
```

## Building for Production

### Frontend

```bash
cd notes_frontend
yarn build
```

The optimized production build will be in the `notes_frontend/dist/` directory.

### Backend

For production deployment:

1. Update `notes_backend/settings.py`:
   - Set `DEBUG = False`
   - Configure `ALLOWED_HOSTS`
   - Use PostgreSQL instead of SQLite
   - Configure CORS settings

2. Collect static files:
```bash
python manage.py collectstatic
```

3. Use a production WSGI server (Gunicorn):
```bash
pip install gunicorn
gunicorn notes_api.wsgi:application
```

## Future Improvements

- [ ] Markdown rendering with live preview split-pane editor
- [ ] User authentication and multi-user support
- [ ] Cloud deployment (AWS/Heroku/Railway)
- [ ] Keyboard shortcuts (Cmd+N for new note, Cmd+K for search)
- [ ] Export notes to PDF/HTML/Markdown files
- [ ] Nested folder organization
- [ ] Rich text formatting toolbar
- [ ] Note sharing with public links
- [ ] Real-time collaboration with WebSockets
- [ ] Mobile app with React Native
- [ ] Note versioning and history
- [ ] File attachments and image uploads

## What I Learned

This project was built to explore full-stack development:

### Frontend
- **shadcn/ui Philosophy** - Copy-paste components you own vs. npm dependencies you don't. More work upfront, more control long-term.
- **TypeScript in Practice** - Strict typing caught several bugs during development that would have been runtime errors otherwise.
- **Dark Mode Implementation** - Using CSS variables and Tailwind's dark mode utilities for seamless theme switching.
- **API Integration** - Building custom hooks for clean separation between data fetching and UI components.

### Backend
- **Django REST Framework** - Building RESTful APIs with serializers, viewsets, and routers.
- **CORS Configuration** - Properly configuring cross-origin requests for local development and production.
- **Database Design** - Using JSONField for flexible tag storage while maintaining relational integrity.
- **API Design Patterns** - Implementing filtering, searching, and pagination endpoints.

## Development Tips

### Running Tests

**Backend:**
```bash
cd notes_backend
python manage.py test
```

**Frontend:**
```bash
cd notes_frontend
yarn test
```

### Database Management

**Create a new migration:**
```bash
python manage.py makemigrations
```

**Apply migrations:**
```bash
python manage.py migrate
```

**Access Django admin:**
```bash
python manage.py createsuperuser
# Then visit http://localhost:8000/admin
```

### Code Quality

**Frontend linting:**
```bash
cd notes_frontend
yarn lint
```

**Backend code formatting:**
```bash
cd notes_backend
black .
```

## Contributing

This is a personal learning project, but feedback and suggestions are welcome! Feel free to open an issue or submit a pull request.

## License

MIT License - feel free to use this code for your own projects.

## Acknowledgments

- [Django](https://www.djangoproject.com/) and [Django REST Framework](https://www.django-rest-framework.org/) for the robust backend
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Lucide](https://lucide.dev/) for the icon set
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for the blazing fast build tool

---

Built with ☕ by [Jarrod Smith](https://github.com/Nephrithos)
