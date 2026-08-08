import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, Perfume, FilterOptions, User } from '../types';

interface AppState {
  cart: CartItem[];
  user: User | null;
  filters: FilterOptions;
  searchQuery: string;
  currentView: 'home' | 'catalog' | 'product' | 'cart' | 'checkout' | 'quiz' | 'comparator' | 'guide' | 'login' | 'gift' | 'reviews';
  selectedPerfume: Perfume | null;
  isLoading: boolean;
}

type AppAction = 
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_FILTERS'; payload: FilterOptions }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_CURRENT_VIEW'; payload: AppState['currentView'] }
  | { type: 'SET_SELECTED_PERFUME'; payload: Perfume | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  cart: [],
  user: null,
  filters: {},
  searchQuery: '',
  currentView: 'home',
  selectedPerfume: null,
  isLoading: false
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.perfume.id === action.payload.perfume.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.perfume.id === action.payload.perfume.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        };
      }
      return {
        ...state,
        cart: [...state.cart, action.payload]
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.perfume.id !== action.payload)
      };
    
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.perfume.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        cart: []
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload
      };
    
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload
      };
    
    case 'SET_CURRENT_VIEW':
      return {
        ...state,
        currentView: action.payload
      };
    
    case 'SET_SELECTED_PERFUME':
      return {
        ...state,
        selectedPerfume: action.payload
      };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}