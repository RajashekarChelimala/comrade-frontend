import React, { createContext, useContext, useEffect, useState } from 'react';

const FeatureFlagsContext = createContext(null);

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState({});

  useEffect(() => {
    async function loadFlags() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/config/feature-flags`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        setFlags(data);
      } catch (err) {
        // ignore for now
      }
    }

    loadFlags();
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext) || {};
}
