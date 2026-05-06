import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MockMode, SwapResponse } from "@/features/swap/types";

interface SwapUiState {
  mockMode: MockMode;
  lastSwap: SwapResponse | null;
}

const initialState: SwapUiState = {
  mockMode: "normal",
  lastSwap: null,
};

const swapUiSlice = createSlice({
  name: "swapUi",
  initialState,
  reducers: {
    setMockMode(state, action: PayloadAction<MockMode>) {
      state.mockMode = action.payload;
    },
    setLastSwap(state, action: PayloadAction<SwapResponse | null>) {
      state.lastSwap = action.payload;
    },
  },
});

export const { setMockMode, setLastSwap } = swapUiSlice.actions;
export const swapUiReducer = swapUiSlice.reducer;
