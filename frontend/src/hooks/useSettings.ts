'use client';

import { useState, useEffect } from 'react';

export interface AppSettings {
  sales: {
    allowEditSubmitted: boolean;
  };
  purchases: {
    allowEditSubmitted: boolean;
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    sales: {
      allowEditSubmitted: false,
    },
    purchases: {
      allowEditSubmitted: false,
    },
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const salesAllowEdit = localStorage.getItem('settings.sales.allowEditSubmitted');
    const purchasesAllowEdit = localStorage.getItem('settings.purchases.allowEditSubmitted');

    setSettings({
      sales: {
        allowEditSubmitted: salesAllowEdit === 'true',
      },
      purchases: {
        allowEditSubmitted: purchasesAllowEdit === 'true',
      },
    });
    setIsLoaded(true);
  }, []);

  return { settings, isLoaded };
}

// Server-side utility function
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') {
    // Server-side default
    return {
      sales: {
        allowEditSubmitted: false,
      },
      purchases: {
        allowEditSubmitted: false,
      },
    };
  }

  // Client-side
  return {
    sales: {
      allowEditSubmitted: localStorage.getItem('settings.sales.allowEditSubmitted') === 'true',
    },
    purchases: {
      allowEditSubmitted: localStorage.getItem('settings.purchases.allowEditSubmitted') === 'true',
    },
  };
}
