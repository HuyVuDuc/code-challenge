import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TokenBadge } from "@/features/swap/components/TokenBadge";
import type { TokenOption } from "@/features/swap/types";
import { cn } from "@/lib/utils";

interface TokenSelectorProps {
  value: string;
  tokens: TokenOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TokenSelector({
  value,
  tokens,
  onChange,
  disabled = false,
}: TokenSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedToken = tokens.find((token) => token.symbol === value);

  const filteredTokens = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tokens;
    }

    return tokens.filter((token) => token.symbol.toLowerCase().includes(query));
  }, [search, tokens]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-12 min-w-[132px] justify-between rounded-2xl border-slate-200 px-3"
          disabled={disabled}
        >
          {selectedToken ? (
            <span className="flex items-center gap-2">
              <TokenBadge iconUrl={selectedToken.iconUrl} symbol={selectedToken.symbol} />
              <span className="font-semibold text-slate-950">{selectedToken.symbol}</span>
            </span>
          ) : (
            <span className="text-slate-400">{t("swap.selectToken")}</span>
          )}
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2" align="end">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3">
          <div className="flex items-center gap-2 py-2 text-slate-500">
            <Search className="h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("swap.searchToken")}
              className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="mt-2 max-h-72 overflow-y-auto">
          {filteredTokens.length ? (
            filteredTokens.map((token) => (
              <button
                key={token.symbol}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition-colors hover:bg-slate-50",
                  token.symbol === value && "bg-sky-50",
                )}
                onClick={() => {
                  onChange(token.symbol);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span className="flex items-center gap-3">
                  <TokenBadge iconUrl={token.iconUrl} symbol={token.symbol} />
                  <span>
                    <span className="block font-medium text-slate-950">{token.symbol}</span>
                    <span className="text-xs text-slate-500">
                      ${token.price.toFixed(token.price > 1 ? 2 : 4)}
                    </span>
                  </span>
                </span>
                {token.symbol === value ? <Check className="h-4 w-4 text-sky-600" /> : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-slate-500">{t("swap.noToken")}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
