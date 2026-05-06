import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { swapApi } from "@/features/swap/services/swapApi";
import { swapUiReducer } from "@/features/swap/store/swapUiSlice";

export const store = configureStore({
  reducer: {
    [swapApi.reducerPath]: swapApi.reducer,
    swapUi: swapUiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(swapApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
