# TOSync Production Management

A comprehensive Production Management Web Application for managing projects, workers, and tasks with real-time tracking, Gantt-style planning, and reporting. The application is AI-enhanced to provide intelligent suggestions for task reallocation.

## Core Features

*   **Dashboard:** An at-a-glance overview of all projects, tasks, and key statistics.
*   **Project & Task Management:** Create, update, and manage projects and their associated tasks in multiple views (Board, Grid). Includes a project calendar and Gantt chart visualization.
*   **Worker-Specific Views:** Dedicated dashboards for workers to view and manage their planned, active, and finished tasks.
*   **Real-time Task Timers:** Workers can start, pause, and complete tasks with integrated time tracking.
*   **QR Code Integration:** Generate and scan QR codes for quick task identification and completion.
*   **Reporting & Analytics:** Generate reports on task status and worker productivity, with export options (CSV, Excel, PDF).
*   **User Management:** Admins can manage user accounts and roles.
*   **AI Assistant:** An integrated chat assistant powered by Google Gemini to answer questions about project data.
*   **Recycle Bin:** Soft-deletes projects, tasks, and users, allowing for restoration or permanent deletion.
*   **Audit Log:** Tracks key actions performed by users throughout the application for accountability.
*   **Multi-language Support:** UI translated into English, Czech, Hindi, and Gujarati.
*   **PWA Enabled:** Can be installed on devices for an app-like experience with offline capabilities thanks to a service worker.
*   **Data Portability:** Encrypted backup and restore functionality for all application data.

## Technology Stack

*   **Frontend:** React, TypeScript
*   **Styling:** Tailwind CSS (via CDN)
*   **Dependencies:** Loaded via ES Modules from `esm.sh` (React, jsQR, @google/genai, jspdf, xlsx). No local `node_modules` or complex build step is required.
*   **AI:** Google Gemini API
*   **Data Persistence:** Browser `localStorage` is used as the database, making the application fully client-side.

## Project Structure

The project is organized into several key directories:

```
.
├── components/       # Reusable React components
│   ├── icons/        # SVG icon components
│   └── ...           # Other UI components
├── constants/        # Static data and constants (e.g., initial users, tasks)
├── context/          # React Context providers for state management
├── locales/          # JSON files for internationalization (i18n)
├── types/            # TypeScript type definitions
├── utils/            # Utility functions (date formatting, DB access, etc.)
├── App.tsx           # Main application component with routing logic
├── index.html        # The main HTML entry point
├── index.tsx         # React root renderer
├── metadata.json     # Application metadata
├── README.md         # This documentation file
└── service-worker.js # Service worker for PWA offline capabilities
```

### Key Contexts

*   **`FormworkDataContext`**: The heart of the application. It manages all primary data (projects, tasks, users, logs) and provides functions to manipulate this data.
*   **`AuthContext`**: Handles user authentication, login, logout, and session management.
*   **`I18nContext`**: Manages the application's internationalization, loading language files and providing the translation function.

## Getting Started

### Prerequisites

You need a modern web browser and a local web server to run this application. The application does not require a build step (like `npm run build`).

### Environment Variables

The application requires a Google Gemini API key to be available in the execution environment.

*   `API_KEY`: Your Google Gemini API key.

The application is configured to read this key from `process.env.API_KEY`. You must ensure this variable is set in the environment where you serve the application.

### Running the Application

1.  **Serve the files:**
    Use a simple local web server to serve the project's root directory. A popular choice is the `http-server` npm package or the "Live Server" extension in VS Code.

    ```bash
    # If you have Node.js, you can use http-server
    npx http-server .
    ```

2.  **Access the App:**
    Open your web browser and navigate to the address provided by your local server (e.g., `http://localhost:8080`).