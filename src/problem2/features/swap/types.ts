export type LocaleCode = "en" | "vi";
export type MockMode = "normal" | "slow" | "error";

export interface RawPriceRecord {
  currency?: string;
  date?: string;
  price?: number;
  [key: string]: unknown;
}

export interface TokenOption {
  symbol: string;
  price: number;
  iconUrl: string;
}

export interface QuoteRequest {
  fromToken: string;
  toToken: string;
  fromAmount: number;
}

export interface QuoteResponse {
  toAmount: number;
  rate: number;
  fee: number;
  slippage: number;
}

export interface SwapRequest extends QuoteRequest {
  toAmount: number;
}

export interface SwapResponse {
  transactionId: string;
  status: "success" | "failed";
  submittedAt: string;
}

export interface SwapFormValues {
  fromAmount: string;
  toAmount: string;
  fromToken: string;
  toToken: string;
}
