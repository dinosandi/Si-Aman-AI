import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';

// Global stylesheet imports
import './index.css';

// Import the auto-generated route tree.
// Note: This file is generated automatically by @tanstack/router-plugin during build/dev
// @ts-ignore (Will be generated dynamically)
import { routeTree } from './routeTree.gen';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Initialize TanStack Router and inject queryClient as context
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent', // Preload routes on hover for ultra-snappy navigation
});

// Register the router instance for type safety across Link/Navigate hooks
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
