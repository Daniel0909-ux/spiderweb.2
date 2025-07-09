Spiderweb - Network Visualization Dashboard

Spiderweb is a sophisticated, real-time network visualization and management dashboard built with React. It provides an interactive, D3.js-powered graphical representation of complex network topologies, alongside detailed tabular data views, administrative controls, and a real-time alert system.

(Note: This is a placeholder image. Replace with an actual screenshot of the application.)

✨ Key Features

Interactive Network Graphs: Two distinct D3.js-powered network topology visualizations (L-Chart & P-Chart) with zoom, pan, and interactive elements.

Dynamic Link Handling: Intelligently handles parallel links between nodes, fanning them out on hover for individual inspection and interaction.

Detailed Drill-Down: Navigate from a high-level network overview to specific zone/site views, and further down to individual device link tables.

Robust State Management: Centralized and predictable state management using Redux Toolkit, with individual slices for each data domain (devices, links, sites, etc.).

Resilient Data Fetching: Asynchronous data fetching using createAsyncThunk, with clear loading and error states handled gracefully throughout the application.

Real-time Updates: A real-time service updates link statuses live on the graph, providing an up-to-the-minute view of the network's health.

Component-Based UI: A rich set of reusable UI components built with React and styled with Tailwind CSS, including virtualized tables for high-performance data display.

Comprehensive Data Views:

All Interfaces: A searchable, filterable, and virtualized table of every network interface.

Favorites: A personalized dashboard for tracking important connections.

End-Sites: A browsable and searchable index of all end-sites.

Alerts: A dedicated page for viewing, filtering, and managing system alerts.

Secure Authentication: A token-based login flow with protected routes ensures that only authenticated users can access the application.

Admin Panel: A dedicated interface for authorized users to add and delete core network entities like sites and devices.

Dark Mode: A sleek, modern UI with full support for both light and dark themes.

🚀 Tech Stack

Frontend: React

State Management: Redux Toolkit

Routing: React Router

Data Visualization: D3.js

Styling: Tailwind CSS

UI Components: Custom components inspired by shadcn/ui

High-Performance Tables: TanStack Virtual for virtualization.

Icons: Lucide React & React Icons

📂 Project Structure

The codebase is organized into logical directories to maintain a clean and scalable architecture.

Generated code
src/
├── chart/ # D3.js visualization logic and helpers
├── components/ # Reusable components (UI, layout, etc.)
│ ├── auth/ # Authentication-related components (AppInitializer)
│ ├── CoreDevice/ # Components for the device link table
│ ├── CoreSite/ # Components for the detailed zone/site view
│ ├── end-site/ # Components for the end-site pages
│ └── ui/ # Generic UI library (buttons, tables, cards, etc.)
├── hooks/ # Custom React hooks for shared logic
├── pages/ # Top-level page components for each route
├── redux/ # Redux Toolkit state management
│ ├── middleware/ # Custom Redux middleware (e.g., realtime)
│ └── slices/ # State slices for each data domain
├── services/ # API communication and other services
└── ... # Other standard React files

🏛️ Architecture & Core Concepts

1. Data Initialization Flow

The application follows a robust, centralized data loading sequence orchestrated by Redux.

Login: The user provides credentials on the LoginPage.

Authentication: The loginUser async thunk in authSlice.js sends the credentials to the API.

Token & Data Fetch: Upon successful login, the JWT is stored in a cookie. Crucially, loginUser then dispatches the fetchInitialData thunk.

Parallel Fetching: fetchInitialData acts as a coordinator, dispatching all individual data-fetching thunks from other slices (fetchDevices, fetchSites, fetchTenGigLinks, etc.) in parallel.

UI Orchestration: The AppInitializer component wraps the entire application. It monitors the status of the authentication and core data slices, showing a global loading screen until all essential data has been fetched, or an error screen if authentication fails.

Generated javascript
// src/redux/slices/authSlice.js (Simplified)
export const fetchInitialData = createAsyncThunk(
"auth/fetchInitialData",
async (\_, { dispatch }) => {
// Dispatch all data fetches concurrently
dispatch(fetchNetTypes());
dispatch(fetchCorePikudim());
dispatch(fetchDevices());
// ... and so on for all other data slices
}
);

export const loginUser = createAsyncThunk(
"auth/loginUser",
async (credentials, { dispatch }) => {
const token = await mockApi.login(credentials);
// After a successful login, trigger the fetch for all initial app data.
dispatch(fetchInitialData());
return token;
}
);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END 2. D3.js & React Integration

D3 is used for its powerful data visualization capabilities, while React manages the component lifecycle and state.

Separation of Concerns: The D3 logic is encapsulated within specific chart components (NetworkVisualizer) and helper files (handleInteractions.js, drawHelpers.js).

Data Flow: React components receive data from the Redux store and pass it down as props to the D3 chart components.

DOM Manipulation: Inside a useEffect hook, D3 takes control of the SVG element to render, update, and remove nodes and links based on the data prop. This pattern combines React's declarative nature with D3's imperative DOM manipulation strengths.

3. Real-time Updates

The application simulates (or can connect to) a real-time data stream for live updates.

Middleware: A custom Redux middleware (realtimeMiddleware.js) intercepts a startConnecting action.

Service: The middleware starts a service (realtimeService.js) which then simulates WebSocket messages by periodically dispatching update actions (e.g., updateTenGigLink).

State Update: The corresponding reducer in tenGigLinksSlice.js handles this update action, changing the status of a link.

UI Re-render: Because the D3 chart is subscribed to this data in the Redux store, it automatically re-renders to reflect the new link status with the correct color.

4. Custom Hooks for Logic Reusability

Custom hooks are used to extract complex or shared logic from components, keeping them clean and focused on rendering.

useInterfaceData: A powerful hook that subscribes to multiple Redux slices (sites, tenGigLinks, devices, favorites), combines and transforms the data into a unified "interface" format, and provides a stable handleToggleFavorite function. This single hook is the "brain" for both the AllInterfacesPage and FavoritesPage, ensuring data consistency.

useCoreSiteData: Manages the complex state for the CoreSitePage, including node layout calculations, tab management, and click handlers.

Generated javascript
// src/pages/useInterfaceData.js (Simplified)
export function useInterfaceData() {
const allSites = useSelector(selectAllSites) || [];
const allTenGigLinks = useSelector(selectAllTenGigLinks) || [];
const favoriteIds = useSelector(selectFavoriteIds) || [];

const interfaces = useMemo(() => {
// 1. Transform site connections
const siteConnections = allSites.map(/_ ... _/);
// 2. Transform core links
const tenGigCoreLinks = allTenGigLinks.map(/_ ... _/);
// 3. Combine and add favorite status
const allLinks = [...siteConnections, ...tenGigCoreLinks];
return allLinks.map(link => ({
...link,
isFavorite: favoriteIds.includes(link.id),
}));
}, [allSites, allTenGigLinks, favoriteIds]);

const handleToggleFavorite = useCallback(/_ ... _/);

return { interfaces, handleToggleFavorite };
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END 5. Performance with Virtualization

To handle potentially thousands of data rows in tables and grids, the application uses @tanstack/react-virtual.

VirtualizedTable: A reusable component that only renders the rows currently visible in the viewport, plus a small "overscan" buffer. This keeps the DOM light and ensures the UI remains fast and responsive, even with huge datasets.

AlertsPage & EndSiteIndexPage: These pages use virtualization for their card-based grid layouts, demonstrating that the technique is not limited to tables.
