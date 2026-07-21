import React, { useState, useEffect } from 'react';
import { client } from './neonClient';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    // Load theme preference from localStorage or fallback to light
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  // Apply theme class to document body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Fetch initial session
    client.auth.getSession().then(async (result) => {
      if (result?.data?.session) {
        const user = result.data.user;
        // Better Auth returns { session, user } in data. 
        // Supabase returned session containing user.
        // We merge user inside session to keep compatibility with Dashboard.jsx
        setSession({
          ...result.data.session,
          user: user
        });

        // Ensure user exists in nutricionistas table to prevent foreign key errors
        if (user) {
          const { data, error } = await client.from('nutricionistas').select('id').eq('id', user.id);
          if (!error && data && data.length === 0) {
            await client.from('nutricionistas').insert([{
              id: user.id,
              nome: user.name || 'Nutricionista',
              email: user.email
            }]);
          }
        }
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Carregando sistema...</p>
      </div>
    );
  }

  return (
    <>
      {session ? (
        <Dashboard session={session} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <Auth theme={theme} toggleTheme={toggleTheme} />
      )}
    </>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid hsl(var(--border))',
    borderTop: '4px solid hsl(var(--primary))',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    fontWeight: '500',
    color: 'hsl(var(--muted-foreground))',
  },
};

// Add spinner keyframes globally if needed (handled or styled inline here)
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    // Fail silently if styleSheet is not ready/accessible
  }
}
