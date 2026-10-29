import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Custom hook to poll and manage live menu item availability.
 * Revalidates on mount, on window focus/tab visibility change, and periodically every 30 seconds.
 */
export function useMenuAvailability() {
  const [unavailableKeys, setUnavailableKeys] = useState([]);
  const [unavailableItems, setUnavailableItems] = useState([]);

  const refreshAvailability = useCallback(async () => {
    try {
      const res = await api.get('/menu/availability', {
        headers: { 'Cache-Control': 'no-cache' },
        params: { _t: Date.now() },
      });
      if (res.data && Array.isArray(res.data.unavailableKeys)) {
        setUnavailableKeys(res.data.unavailableKeys);
        setUnavailableItems(res.data.unavailableItems || []);
      }
    } catch (err) {
      // Non-blocking background fetch failure
      console.warn('Failed to refresh menu availability:', err.message);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount
    refreshAvailability();

    // Revalidate when tab becomes active / window gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAvailability();
      }
    };

    const handleFocus = () => {
      refreshAvailability();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic polling every 30 seconds while the page is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshAvailability();
      }
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [refreshAvailability]);

  const isUnavailable = useCallback(
    (name) => {
      if (!name) return false;
      const key = String(name).trim().toLowerCase();
      return unavailableKeys.includes(key);
    },
    [unavailableKeys]
  );

  return {
    unavailableKeys,
    unavailableItems,
    refreshAvailability,
    isUnavailable,
  };
}

export default useMenuAvailability;
