# Problem 2: Fancy Form

## Overview

This project is a frontend-focused token swap prototype. It lets a user:

- load the latest token prices
- choose source and destination assets
- receive an auto-generated quote
- review the quote before submission
- submit the swap through a mocked backend

The goal is to model a realistic swap flow while keeping the backend fully controllable in local development.

## Business Flow

1. The application loads the latest market prices and derives one latest valid record per token.
2. The user selects a token pair and enters the amount to send.
3. The UI automatically requests a quote when the form becomes valid.
4. The backend mock returns `toAmount`, `rate`, `fee`, and `slippage`.
5. The user reviews the quote summary in the main form and again in the confirmation modal.
6. On confirmation, the client submits the swap request to the mocked settlement endpoint.
7. The UI shows success or error feedback depending on the selected mock mode.

## Tech Stack

### React 19

Used for the UI layer and component composition.

Why:

- fits an interactive form-heavy workflow
- supports modern concurrent UX patterns used in the swap form
- keeps component boundaries clear for review and extension

### TypeScript

Used across UI, service, and mock layers.

Why:

- makes API contracts explicit
- reduces ambiguity in form, quote, and swap payloads
- improves maintainability for mock-driven development

### Redux Toolkit + RTK Query

Used for client state and API orchestration.

Why:

- separates UI state from server state
- RTK Query provides structured fetching, caching, and request lifecycle handling
- integrates cleanly with the mock API layer

### Formik + Yup

Used for swap form state and validation.

Why:

- keeps validation rules centralized
- makes field-level error handling predictable
- works well for dependent form fields and submit gating

### MSW

Used to mock `/api/latest-price`, `/api/quote`, and `/api/swap`.

Why:

- preserves a real network boundary from the browser perspective
- allows simulation of normal, slow, and error backend modes
- keeps frontend behavior close to production request flows

### i18next

Used for bilingual UI content.

Why:

- keeps copy externalized from components
- makes English and Vietnamese variants easy to maintain

### Vite + Tailwind CSS

Used for build tooling and styling.

Why:

- Vite gives a fast local development loop
- Tailwind keeps styling co-located and consistent in component code

## Data Flow

### Price Loading

`SwapCard` calls `useGetPricesQuery()` from `swapApi`.

`swapApi` requests `/api/latest-price`.

MSW intercepts the request, loads the upstream price source, normalizes the latest valid record per token, and returns a JSON array.

The client transforms that array into `TokenOption[]` for UI rendering.

### Quote Generation

When `fromAmount`, `fromToken`, and `toToken` are valid, `SwapCard` triggers `getQuote`.

The request goes to `/api/quote`, where MSW calculates:

- output amount
- exchange rate
- fee
- slippage

The quote response updates the receive amount field and the quote summary panel.

### Swap Submission

When the user confirms the modal, `submitSwap` sends a request to `/api/swap`.

MSW validates the payload and returns a mocked transaction result.

The UI then resets the transient quote state and shows a success toast.

## State Model

- RTK Query stores server-facing state for prices, quotes, and swap submission.
- Redux slice `swapUi` stores frontend UI state such as mock mode.
- Formik stores transient form input state inside the swap form.

This split avoids mixing long-lived server data with view-local form interactions.

## Mocking Notes

- Mocking is enabled in development through `startMockWorker()`.
- Unhandled requests are bypassed intentionally.
- The price mock includes caching and in-flight deduplication to avoid redundant upstream fetches during rapid or concurrent requests.

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```
