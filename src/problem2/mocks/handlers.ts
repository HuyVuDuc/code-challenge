import {http, HttpResponse, delay} from "msw";
import type {QuoteRequest, RawPriceRecord, SwapRequest} from "@/features/swap/types";

const QUOTE_FEE_RATE = 0.0035;
const PRICE_CACHE_TTL_MS = 30_000;

let latestPricesCache: RawPriceRecord[] | null = null;
let latestPricesFetchedAt = 0;
let latestPricesPromise: Promise<RawPriceRecord[]> | null = null;

function getMode(request: Request) {
    const mode = request.headers.get("x-mock-mode");
    return mode === "slow" || mode === "error" ? mode : "normal";
}

async function applyModeDelay(mode: string) {
    if (mode === "slow") {
        await delay(1800);
        return;
    }

    await delay(650);
}


function normalizeLatestPrices(records: RawPriceRecord[]) {
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

    return Array.from(latest.values()).sort((left, right) =>
        (left.currency ?? "").localeCompare(right.currency ?? ""),
    );
}

async function fetchLatestPrices() {
    const response = await fetch("https://interview.switcheo.com/prices.json");

    if (!response.ok) {
        throw new Error("Unable to load prices for quote generation.");
    }

    const records = (await response.json()) as RawPriceRecord[];
    return normalizeLatestPrices(records);
}

async function getLatestPrices() {
    const now = Date.now();

    if (latestPricesCache && now - latestPricesFetchedAt < PRICE_CACHE_TTL_MS) {
        return latestPricesCache;
    }

    if (!latestPricesPromise) {
        latestPricesPromise = fetchLatestPrices()
            .then((records) => {
                latestPricesCache = records;
                latestPricesFetchedAt = Date.now();
                return records;
            })
            .finally(() => {
                latestPricesPromise = null;
            });
    }

    return latestPricesPromise;
}

function getPriceMap(records: RawPriceRecord[]) {
    return new Map(
        records
            .filter((record): record is RawPriceRecord & {currency: string; price: number} =>
                Boolean(record.currency) && typeof record.price === "number" && record.price > 0,
            )
            .map((record) => [record.currency, record.price]),
    );
}

export const handlers = [

    http.get("*/api/latest-price", async ({request}) => {
        const mode = getMode(request);
        await applyModeDelay(mode);

        if (mode === "error") {
            return HttpResponse.json({message: "Price list is temporarily unavailable."}, {status: 503});
        }
        const prices = await getLatestPrices();
        return HttpResponse.json(prices);
    }),

    http.post("*/api/quote", async ({request}) => {
        const mode = getMode(request);
        await applyModeDelay(mode);

        if (mode === "error") {
            return HttpResponse.json({message: "Quote engine is temporarily unavailable."}, {status: 503});
        }

        const body = (await request.json()) as QuoteRequest;
        const prices = await getLatestPrices();
        const priceMap = getPriceMap(prices);
        const fromPrice = priceMap.get(body.fromToken);
        const toPrice = priceMap.get(body.toToken);

        if (!fromPrice || !toPrice || !body.fromAmount || body.fromAmount <= 0) {
            return HttpResponse.json({message: "Quote input is invalid."}, {status: 400});
        }

        const gross = (body.fromAmount * fromPrice) / toPrice;
        const fee = gross * QUOTE_FEE_RATE;
        const toAmount = Number((gross - fee).toFixed(6));
        const rate = Number((fromPrice / toPrice).toFixed(6));

        return HttpResponse.json({
            toAmount,
            rate,
            fee: Number(fee.toFixed(6)),
            slippage: 0.5,
        });
    }),
    http.post("*/api/swap", async ({request}) => {
        const mode = getMode(request);
        await applyModeDelay(mode);

        if (mode === "error") {
            return HttpResponse.json({message: "Swap confirmation failed on the mocked backend."}, {status: 500});
        }

        const body = (await request.json()) as SwapRequest;

        if (!body.fromToken || !body.toToken || body.fromAmount <= 0 || body.toAmount <= 0) {
            return HttpResponse.json({message: "Swap payload is invalid."}, {status: 400});
        }

        return HttpResponse.json({
            transactionId: `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            status: "success",
            submittedAt: new Date().toISOString(),
        });
    }),
];
