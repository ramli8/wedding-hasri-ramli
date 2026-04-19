'use client';

import { createContext, useContext, ReactNode } from 'react';
import { MOCK_USER } from './mock-data';
import { mockAuthService, mockUserService, mockRbacService, resetDemoData } from './mock-services';
import type { User } from '@/src/domain/services/auth.service';

interface DemoContextType {
  isDemoMode: true;
  user: User;
  authService: typeof mockAuthService;
  userService: typeof mockUserService;
  rbacService: typeof mockRbacService;
  resetData: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const value: DemoContextType = {
    isDemoMode: true,
    user: MOCK_USER,
    authService: mockAuthService,
    userService: mockUserService,
    rbacService: mockRbacService,
    resetData: resetDemoData,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return ctx;
}

/**
 * Safe hook that returns demo context if available, null otherwise.
 * Useful for components that may render in both demo and production mode.
 */
export function useDemoContextSafe() {
  return useContext(DemoContext);
}
