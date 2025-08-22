import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { ReactNode } from "react";
import { apiSlice } from "./apiSlice";
import workflowReducer from "./features/workflowSlice";


// Configure the Redux store with proper typing
export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    workflow: workflowReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

setupListeners(store.dispatch);

// store.dispatch(apiSlice.util.resetApiState());
// Define RootState type based on the store
export type RootState = ReturnType<typeof store.getState>;
// Define AppDispatch type
export type AppDispatch = typeof store.dispatch;

// Redux provider component for Next.js with typed props
export interface ReduxProviderProps {
  children: ReactNode;
}
