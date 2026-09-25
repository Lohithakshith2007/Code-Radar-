import { useCallback, useEffect, useState } from 'react';
import AuthContext from './auth-context';
import { apiFetch, responseError, setAuthToken } from '../lib/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!localStorage.getItem('code_radar_token')) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await apiFetch('/auth/me/');
        if (!response.ok) {
          setAuthToken(null);
          return;
        }
        const currentUser = await response.json();
        if (active) setUser(currentUser);
      } catch {
        if (active) setAuthToken(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => { active = false; };
  }, []);

  const authenticate = async (path, credentials) => {
    const response = await apiFetch(path, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw await responseError(response, 'Unable to sign in.');
    const data = await response.json();
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const login = (credentials) => authenticate('/auth/login/', credentials);
  const register = (details) => authenticate('/auth/register/', details);

  const logout = async () => {
    try {
      await apiFetch('/auth/logout/', { method: 'POST' });
    } catch {
      // Clear the local login even if the API cannot be reached.
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  };

  const updateUser = useCallback((updatedUser) => setUser(updatedUser), []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
