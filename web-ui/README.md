# Time Tracking Web UI

React TypeScript frontend application for the time tracking tool.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file in this directory (or use the root `.env`):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Components

- **Dashboard**: Main view with active timer and recent entries
- **Tasks**: Task management (CRUD operations)
- **Reports**: Time reporting and analytics
- **Timer**: Real-time timer component
- **TaskForm**: Modal for creating/editing tasks
- **TaskList**: Table view of tasks with actions

## Features

- Real-time timer with live updates
- Task management with vendor assignment
- Time entry tracking and reporting
- CSV export functionality
- Responsive design with Tailwind CSS