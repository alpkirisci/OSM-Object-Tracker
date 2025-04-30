# Frontend Development Guidelines

## Project Architecture

### Stack
- Next.js (App Router)
- React 
- TypeScript
- Tailwind CSS with CSS Modules

### Directory Structure
```
frontend/
  ├── src/
  │   ├── app/             # Next.js app router pages
  │   ├── components/      # Reusable components
  │   │   ├── ui/          # Core UI components
  │   │   └── [feature]/   # Feature-specific components
  │   ├── services/        # API services
  │   ├── types/           # TypeScript type definitions
  │   └── utils/           # Utility functions
  ├── public/              # Static assets
  └── tailwind.config.ts   # Tailwind configuration
```

## API Structure & Communication

### API Organization
- Maintain a single `api.ts` file in the `services` directory
- Group API functions by entity (objects, devices, etc.)
- Use TypeScript interfaces from `types/index.ts` for request/response data

### API Function Structure
```typescript
// Example API function structure
const getObjects = (): Promise<MapObject[]> => 
  fetchApi<MapObject[]>('/objects');

const getObjectsByType = (typeId: string): Promise<MapObject[]> => 
  fetchApi<MapObject[]>(`/objects/type/${typeId}`);

const createObject = (data: ObjectCreate): Promise<MapObject> => 
  fetchApi<MapObject>('/objects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
```

### Helper Function
```typescript
// Base fetchApi helper - use for all API calls
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Error handling
    try {
      const errorData = await response.json();
      // Enhanced error logging
      console.error('API Error Details:', errorData);
      
      if (errorData.detail) {
        throw new Error(errorData.detail);
      } else if (errorData.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error(JSON.stringify(errorData));
      }
    } catch (parseError) {
      throw new Error(`API Error (${response.status}): ${response.statusText}`);
    }
  }

  // For successful DELETE requests (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
```

### WebSocket Connections
- Use a similar WebSocket connection pattern for real-time updates
- Manage connections with connect/disconnect methods
- Store active connections in a map

## Component Architecture

### Component Structure
```typescript
// Component template
import React from 'react';
import styles from './ComponentName.module.css';

interface ComponentNameProps {
  // Props definition with proper TypeScript types
  property: string;
  optionalProperty?: number;
  onAction: (param: string) => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ 
  property, 
  optionalProperty = 0, // Default value for optional props
  onAction
}) => {
  // Component logic here
  
  return (
    <div className={styles.container}>
      {/* Component content */}
    </div>
  );
};
```

### UI Components
- Place reusable UI components in `components/ui/`
- Design components to be flexible with props for variants
- Use TypeScript interfaces for all component props
- Follow proper naming conventions for component files
- Implement clear separation of logic from presentation

## Styling Guidelines

### Color System
- Use CSS variables for theming in light and dark mode
- Follow the color palette defined in `:root` and `.dark` in globals.css
- Primary colors are based on blue (#2563eb) with hover, light, dark variants
- Secondary colors are based on gray (#e5e7eb)
- Include success (green) and danger (red) colors

```css
/* Example color variables - already defined in globals.css */
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-light: #dbeafe;
  --color-primary-dark: #1e40af;
  
  --color-secondary: #e5e7eb;
  --color-secondary-hover: #d1d5db;
  --color-secondary-light: #f3f4f6;
  --color-secondary-dark: #9ca3af;
}

/* Dark mode overrides */
.dark {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  /* Additional dark mode colors */
}
```

### CSS Modules
- Use CSS modules for component-specific styles
- Name files as `ComponentName.module.css`
- Use camelCase for CSS classes (e.g., `.mapContainer`)
- Apply Tailwind utilities with `@apply` directives when appropriate
- Create responsive styles with media queries

```css
/* Example CSS module */
.mapContainer {
  @apply w-full h-96 rounded-lg overflow-hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .mapContainer {
    @apply h-[500px];
  }
}
```

### Common Component Styles

#### Buttons
- Use variants: 'primary', 'secondary', 'danger', 'success'
- Implement sizes: 'xs', 'sm', 'md', 'lg'
- Apply consistent hover, focus, and disabled states

```jsx
<Button 
  variant="primary" 
  size="md" 
  onClick={handleAction}
>
  Action
</Button>
```

#### Cards
- Use `.card` for basic cards with light shadow
- Use `.card-elevated` for more prominent cards
- Follow card structure with header, content, footer

#### Form Elements
- Apply consistent input, select, textarea styling
- Use label + input grouping
- Implement proper validation states
- Show validation errors in consistent manner

## State Management

- Use React hooks (useState, useEffect, useRef) for component state
- Implement form state with controlled inputs
- Consider using React Context for global state when needed
- Prefer local component state when possible

```jsx
// Example state management
const [objects, setObjects] = useState<MapObject[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchObjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getObjects();
      setObjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objects');
    } finally {
      setLoading(false);
    }
  };
  
  fetchObjects();
}, []);
```

## Type Definitions

- Define all data types in `types/index.ts`
- Use interfaces for entity objects
- Create separate interfaces for create/update operations
- Use TypeScript generics for API functions

```typescript
// Example type definitions
export interface MapObject {
  id: string;
  name: string;
  type: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  properties: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MapObjectCreate {
  name: string;
  type: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  properties?: Record<string, any>;
}

export interface MapObjectUpdate {
  name?: string;
  type?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  properties?: Record<string, any>;
}
```

## Loading & Error States

- Implement consistent loading states with LoadingSpinner
- Show loading indicators during API calls
- Display error messages in a consistent format
- Provide fallback UI for error states

```jsx
// Example loading and error handling
{loading ? (
  <div className={styles.loadingContainer}>
    <LoadingSpinner />
    <p className={styles.loadingText}>Loading objects...</p>
  </div>
) : error ? (
  <div className={styles.errorContainer}>
    <p className={styles.errorText}>{error}</p>
    <Button onClick={handleRetry}>Retry</Button>
  </div>
) : (
  <ObjectList objects={objects} />
)}
```

## Map-Specific Guidelines

### Map Container
- Create a dedicated map container component
- Use responsive sizing for different viewports
- Follow established styling patterns for containers

### Map Controls
- Implement map controls using existing button patterns
- Create a controls container with proper positioning
- Ensure controls have appropriate spacing and hover states

### Filtering
- Implement filter UI with existing form elements
- Use consistent card styling for filter containers
- Ensure filters are responsive on different devices

### Object Display
- Show object information in cards
- Use established typography for object details
- Use badges for object types/states

## Admin Features

### Data Entry Management
- Create admin pages with restricted access if needed
- Implement forms for managing data entry points
- Allow configuration of connection types (WebSocket, REST)
- Store and retrieve connection configurations via API

## Accessibility

- Ensure proper color contrast in both light and dark modes
- Implement keyboard navigation support
- Use semantic HTML elements
- Add appropriate ARIA attributes when needed
- Test with screen readers

## Performance Considerations

- Lazy load components when appropriate
- Optimize image loading with Next.js Image component
- Implement API response caching when applicable
- Add proper loading and error states to improve perceived performance

## Documentation

- Document components with clear props descriptions
- Add comments for complex logic
- Include usage examples for shared components
- Document API functions with expected parameters and responses 