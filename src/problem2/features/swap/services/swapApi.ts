import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import type {RootState} from "@/app/store";
import {getTokenIconUrl} from "@/lib/token";
import type {
    QuoteRequest,
    QuoteResponse,
    RawPriceRecord,
    SwapRequest,
    SwapResponse,
    TokenOption,
} from "@/features/swap/types";

function normalizeTokens(records: RawPriceRecord[]): TokenOption[] {
    const latest = new Map<string, RawPriceRecord>();

    for (const record of records) {
        if (!record.currency || typeof record.price !== "number" || record.price <= 0) {
            continue;
        }

        const existing = latest.get(record.currency);

        if (!existing) {
            latest.set(record.currency, record);
            continue;
        }

        const currentDate = new Date(record.date ?? 0).getTime();
        const existingDate = new Date(existing.date ?? 0).getTime();

        if (currentDate >= existingDate) {
            latest.set(record.currency, record);
        }
    }

    return Array.from(latest.values())
        .map((record) => ({
            symbol: record.currency!,
            price: Number(record.price),
            iconUrl: getTokenIconUrl(record.currency!),
        }))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export const swapApi = createApi({
    reducerPath: "swapApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "/",
        prepareHeaders: (headers, {getState}) => {
            const state = getState() as RootState;
            headers.set("x-mock-mode", state.swapUi.mockMode);
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getPrices: builder.query<TokenOption[], void>({
            query: () => "/api/latest-price",
            transformResponse: (response: RawPriceRecord[]) => normalizeTokens(response),
        }),
        getQuote: builder.mutation<QuoteResponse, QuoteRequest>({
            query: (body) => ({
                url: "api/quote",
                method: "POST",
                body,
            }),
        }),
        submitSwap: builder.mutation<SwapResponse, SwapRequest>({
            query: (body) => ({
                url: "api/swap",
                method: "POST",
                body,
            }),
        }),
    }),
});

export const {
    useGetPricesQuery,
    useGetQuoteMutation,
    useSubmitSwapMutation,
} = swapApi;
