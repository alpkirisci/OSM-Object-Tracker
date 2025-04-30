# OpenStreetMap Object Tracker - Frontend

This is the frontend application for the OpenStreetMap Object Tracker. It allows users to track and monitor objects on OpenStreetMap in real-time.

## Features

- Interactive map display of OSM objects
- Real-time object tracking via WebSocket
- Object filtering by type, tags, and data source
- Detailed object information display
- Admin interface for managing data sources

## Tech Stack

- **Framework**: Next.js with App Router
- **UI**: React with TypeScript
- **Styling**: Tailwind CSS with CSS Modules
- **Map Library**: Leaflet.js
- **API Communication**: Fetch API for REST, WebSocket for real-time updates

## Project Structure

```
frontend/
  ├── src/
  │   ├── app/             # Next.js app router pages
  │   │   ├── admin/       # Admin interface for data sources
  │   │   ├── objects/     # Objects listing page
  │   │   └── page.tsx     # Homepage with map view
  │   ├── components/      # Reusable components
  │   │   ├── common/      # Layout components
  │   │   ├── Map/         # Map-related components 
  │   │   └── ui/          # Core UI components
  │   ├── services/        # API services
  │   ├── types/           # TypeScript type definitions
  │   └── utils/           # Utility functions
  ├── public/              # Static assets
  └── tailwind.config.ts   # Tailwind configuration
```

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Create a `.env.local` file in the frontend directory with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Main Pages

- **Homepage (`/`)**: Map view showing all tracked OSM objects with filtering options
- **Objects (`/objects`)**: List view of all tracked objects with detailed filtering
- **Admin (`/admin`)**: Interface for managing data sources (REST and WebSocket endpoints)

## Data Source Management

The admin page allows you to add, edit, and delete data sources. Each data source can be configured with:

- **Name**: A descriptive name for the data source
- **Type**: Either WebSocket or REST API
- **Connection Info**: JSON configuration for the connection (URLs, authentication, etc.)
- **Active Status**: Whether the data source is currently active

## Development

Follow the [Frontend Development Guidelines](./FRONTEND_GUIDELINES.md) for coding standards, component architecture, and styling guidelines.
