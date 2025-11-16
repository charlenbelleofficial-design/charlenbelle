// app/hooks/useSnackbar.ts
'use client';

import { useState, useCallback } from 'react';
import { SnackbarType } from '../components/ui/snackbar';

interface SnackbarState {
  message: string;
  type: SnackbarType;
  isVisible: boolean;
}

export function useSnackbar() {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'info') => {
    setSnackbar({
      message,
      type,
      isVisible: true
    });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    snackbar,
    showSnackbar,
    hideSnackbar
  };
}