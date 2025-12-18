import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Lazy load route components for better initial load performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Chores = lazy(() => import('./pages/Chores'));
const Finance = lazy(() => import('./pages/Finance'));
const ImportExport = lazy(() => import('./pages/ImportExport'));
const Rewards = lazy(() => import('./pages/Rewards'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Profile = lazy(() => import('./pages/Profile'));

// Loading fallback component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
    fontSize: '1.2rem',
    color: '#9966ff'
  }}>
    Loading...
  </div>
);

// Initialize QueryClient with optimal defaults for perceived performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: false,
    },
  },
});

/**
 * Main entry point for the SQUIRREL application.
 * Sets up the React Router v6 Data Router and opts in to v7 future flags.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const onMessage = (e) => {
      const d = e?.data;
      if (!d || d.source !== 'squirrel-backend' || d.type !== 'auth') return;
      // Navigate only after a successful login redirect to backend dashboard
      if (d.authenticated === true && typeof d.path === 'string' && d.path.indexOf('/dashboard') !== -1) {
        window.dispatchEvent(new CustomEvent('squirrel-auth-success'));
        navigate('/');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);
  return (
    <div className="auth-container">
      <iframe 
        src="/backend/login?embed=1"
        title="Login"
        width="100%"
        height="800px"
        style={{ border: 'none' }}
      />
    </div>
  );
};

const RegisterPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const onMessage = (e) => {
      const d = e?.data;
      if (!d || d.source !== 'squirrel-backend' || d.type !== 'auth') return;
      if (d.authenticated === true && typeof d.path === 'string' && d.path.indexOf('/dashboard') !== -1) {
        window.dispatchEvent(new CustomEvent('squirrel-auth-success'));
        navigate('/');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);
  return (
    <div className="auth-container">
      <iframe 
        src="/backend/register?embed=1"
        title="Register"
        width="100%"
        height="800px"
        style={{ border: 'none' }}
      />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
      { path: 'inventory', element: <Suspense fallback={<PageLoader />}><Inventory /></Suspense> },
      { path: 'chores', element: <Suspense fallback={<PageLoader />}><Chores /></Suspense> },
      { path: 'finance', element: <Suspense fallback={<PageLoader />}><Finance /></Suspense> },
      { path: 'rewards', element: <Suspense fallback={<PageLoader />}><Rewards /></Suspense> },
      { path: 'leaderboard', element: <Suspense fallback={<PageLoader />}><Leaderboard /></Suspense> },
      { path: 'import-export', element: <Suspense fallback={<PageLoader />}><ImportExport /></Suspense> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'profile', element: <Suspense fallback={<PageLoader />}><Profile /></Suspense> },
    ],
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* React Query Devtools - only in development */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  </React.StrictMode>
);
