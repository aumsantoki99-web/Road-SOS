/**
 * AppStateContext — Global App State
 *
 * Provides a single source of truth for:
 * - Current ride session
 * - User preferences
 * - Network status
 * - App initialization state
 *
 * Extended in:
 * - feature/ride-monitoring (ride session logic)
 * - feature/offline-mode   (network state logic)
 * - feature/settings-screen (preferences persistence)
 */

import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AppState, RideSession, UserPreferences, NetworkState } from '../types';
import { DEFAULT_PREFERENCES } from '../constants';

// ─── Initial State ────────────────────────────────────────────────────────────

const initialNetworkState: NetworkState = {
  status: 'unknown',
  isConnected: true,
};

const initialState: AppState = {
  isInitialized: false,
  currentRide: null,
  networkState: initialNetworkState,
  preferences: DEFAULT_PREFERENCES,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type AppAction =
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_CURRENT_RIDE'; payload: RideSession | null }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_NETWORK_STATE'; payload: NetworkState };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };

    case 'SET_CURRENT_RIDE':
      return { ...state, currentRide: action.payload };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case 'SET_NETWORK_STATE':
      return { ...state, networkState: action.payload };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppStateContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience action creators
  setCurrentRide: (ride: RideSession | null) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setNetworkState: (network: NetworkState) => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setCurrentRide = (ride: RideSession | null): void => {
    dispatch({ type: 'SET_CURRENT_RIDE', payload: ride });
  };

  const updatePreferences = (prefs: Partial<UserPreferences>): void => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: prefs });
  };

  const setNetworkState = (network: NetworkState): void => {
    dispatch({ type: 'SET_NETWORK_STATE', payload: network });
  };

  const value: AppStateContextValue = {
    state,
    dispatch,
    setCurrentRide,
    updatePreferences,
    setNetworkState,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useAppState — access global app state from any component.
 *
 * Usage:
 *   const { state, setCurrentRide } = useAppState();
 */
export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
