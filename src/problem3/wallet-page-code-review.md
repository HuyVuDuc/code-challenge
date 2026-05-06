# WalletPage Code Review and Refactor

## Issues Found

### 1. Logic and Type Issues

- `WalletBalance` is missing the `blockchain` field, but the code uses `balance.blockchain`.
- `lhsPriority` is referenced but never defined.
- The filter condition is incorrect:
  - Current logic keeps balances with `amount <= 0`.
  - Expected logic should keep balances with `amount > 0`.
- The `sort()` comparator does not return `0` when priorities are equal.
- `FormattedWalletBalance` is used in the row mapping, but the mapped data actually comes from `sortedBalances`, which does not include the `formatted` field.

### 2. Computational Inefficiencies

- `prices` is included in the `useMemo` dependency array for `sortedBalances`, even though it is not used inside that computation.
- `formattedBalances` is computed but never used.
- Rows are recreated on every render without memoization.
- `getPriority()` is called multiple times during sorting, which can be avoided by computing priority once per balance.
- Sorting mutates the array returned by `filter()`. While this is safe here because `filter()` creates a new array, the intention should still be explicit and readable.

### 3. Anti-patterns

- `any` is used in `getPriority`, reducing type safety.
- Array index is used as React key, which can cause rendering bugs when list order changes.
- `children` is destructured but not rendered.
- `Props extends BoxProps`, but the component renders a plain `<div>` instead of a `Box`.
- Blockchain priorities are hardcoded inside a switch statement, making them harder to maintain.
- Formatting and rendering logic are mixed directly inside the component body.

---

## Refactored Code

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  priority: number;
}

interface Props extends BoxProps {}

const PRIORITY_BY_BLOCKCHAIN: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number => {
  return PRIORITY_BY_BLOCKCHAIN[blockchain] ?? -99;
};

const WalletPage: React.FC<Props> = (props) => {
  const { children, ...rest } = props;

  const balances = useWalletBalances();
  const prices = usePrices();

  const formattedBalances = useMemo<FormattedWalletBalance[]>(() => {
    return balances
      .map((balance) => ({
        ...balance,
        priority: getPriority(balance.blockchain),
        formatted: balance.amount.toFixed(),
      }))
      .filter((balance) => balance.priority > -99 && balance.amount > 0)
      .sort((lhs, rhs) => rhs.priority - lhs.priority);
  }, [balances]);

  const rows = useMemo(() => {
    return formattedBalances.map((balance) => {
      const usdValue = (prices[balance.currency] ?? 0) * balance.amount;

      return (
        <WalletRow
          key={`${balance.blockchain}-${balance.currency}`}
          className={classes.row}
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.formatted}
        />
      );
    });
  }, [formattedBalances, prices]);

  return (
    <Box {...rest}>
      {rows}
      {children}
    </Box>
  );
};
```

---

## What Was Improved After Refactoring

### Type Safety

- Added the missing `blockchain` field to `WalletBalance`.
- Removed `any` from `getPriority`.
- Added `priority` to `FormattedWalletBalance` to avoid recalculating priority repeatedly.

### Logic Correctness

- Replaced the undefined `lhsPriority` with a properly computed priority value.
- Fixed the filter condition to keep only valid balances:
  - Supported blockchain
  - Positive amount
- Added a deterministic sort comparator.

### Performance

- Removed `prices` from the dependency list of the balance sorting logic.
- Avoided unused `formattedBalances`.
- Memoized row rendering with `useMemo`.
- Computed priority once per balance instead of repeatedly during sorting.

### Maintainability

- Replaced the `switch` statement with a priority map.
- Separated transformation, filtering, sorting, and rendering more clearly.
- Used a stable React key instead of array index.
- Rendered `Box` instead of `div` to match `BoxProps`.

---

## Further Implementation

### 1. Extract Priority Logic

Move blockchain priority logic into a separate utility file.

```ts
export const PRIORITY_BY_BLOCKCHAIN: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

export const getPriority = (blockchain: string): number => {
  return PRIORITY_BY_BLOCKCHAIN[blockchain] ?? -99;
};
```

This makes the priority system easier to test and reuse.

---

### 2. Use Stronger Blockchain Types

Instead of using a generic `string`, define supported blockchains explicitly.

```ts
type Blockchain =
  | 'Osmosis'
  | 'Ethereum'
  | 'Arbitrum'
  | 'Zilliqa'
  | 'Neo';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain | string;
}
```

This improves type safety while still allowing unknown chains if needed.

---

### 3. Extract Balance Formatting

Formatting can be moved into a helper function.

```ts
const formatWalletBalance = (balance: WalletBalance): FormattedWalletBalance => ({
  ...balance,
  priority: getPriority(balance.blockchain),
  formatted: balance.amount.toFixed(),
});
```

This keeps the component cleaner and makes formatting behavior easier to test.

---

### 4. Handle Missing Prices Explicitly

The current fallback uses `0` when a price is missing:

```ts
const usdValue = (prices[balance.currency] ?? 0) * balance.amount;
```

A better implementation may display `"N/A"` or a loading state when price data is unavailable.

Example:

```ts
const price = prices[balance.currency];

const usdValue = price == null ? undefined : price * balance.amount;
```

This avoids silently showing `$0` for assets that simply do not have price data yet.

---

### 5. Add Unit Tests

Recommended test cases:

- Filters out balances with unsupported blockchains.
- Filters out balances with zero or negative amounts.
- Sorts balances by blockchain priority descending.
- Formats balances correctly.
- Handles missing prices safely.
- Uses stable keys for rendered rows.

---

### 6. Consider Virtualization for Large Lists

If the wallet contains many balances, rendering all rows at once may become expensive.

Use list virtualization such as:

- `react-window`
- `react-virtualized`

This reduces DOM nodes and improves rendering performance for large datasets.

---

### 7. Improve Number Formatting

Instead of using:

```ts
balance.amount.toFixed()
```

Consider using `Intl.NumberFormat` for locale-aware formatting.

```ts
const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
});

const formatted = formatter.format(balance.amount);
```

This provides better readability for large and fractional balances.

---

## Summary

The original code contains several logic errors, unnecessary recalculations, and React anti-patterns. The refactored version improves correctness, type safety, performance, and maintainability while keeping the component behavior straightforward.
