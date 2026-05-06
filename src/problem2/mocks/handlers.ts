import { http, HttpResponse, delay } from "msw";
import type { QuoteRequest, RawPriceRecord, SwapRequest } from "@/features/swap/types";

const QUOTE_FEE_RATE = 0.0035;

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

async function getLatestPrices() {
  const response = await fetch("https://interview.switcheo.com/prices.json");

  if (!response.ok) {
    throw new Error("Unable to load prices for quote generation.");
  }

  const records = (await response.json()) as RawPriceRecord[];
  const latest = new Map<string, number>();

  for (const record of records) {
    if (!record.currency || typeof record.price !== "number" || record.price <= 0) {
      continue;
    }

    latest.set(record.currency, record.price);
  }

  return latest;
}

export const handlers = [
  http.post("*/api/quote", async ({ request }) => {
    const mode = getMode(request);
    await applyModeDelay(mode);

    if (mode === "error") {
      return HttpResponse.json({ message: "Quote engine is temporarily unavailable." }, { status: 503 });
    }

    const body = (await request.json()) as QuoteRequest;
    const prices = await getLatestPrices();
    const fromPrice = prices.get(body.fromToken);
    const toPrice = prices.get(body.toToken);

    if (!fromPrice || !toPrice || !body.fromAmount || body.fromAmount <= 0) {
      return HttpResponse.json({ message: "Quote input is invalid." }, { status: 400 });
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
  http.post("*/api/swap", async ({ request }) => {
    const mode = getMode(request);
    await applyModeDelay(mode);

    if (mode === "error") {
      return HttpResponse.json({ message: "Swap confirmation failed on the mocked backend." }, { status: 500 });
    }

    const body = (await request.json()) as SwapRequest;

    if (!body.fromToken || !body.toToken || body.fromAmount <= 0 || body.toAmount <= 0) {
      return HttpResponse.json({ message: "Swap payload is invalid." }, { status: 400 });
    }

    return HttpResponse.json({
      transactionId: `MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      status: "success",
      submittedAt: new Date().toISOString(),
    });
  }),
];
