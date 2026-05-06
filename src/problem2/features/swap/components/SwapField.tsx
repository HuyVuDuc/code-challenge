import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TokenSelector } from "@/features/swap/components/TokenSelector";
import type { TokenOption } from "@/features/swap/types";
import { cn } from "@/lib/utils";

interface SwapFieldProps {
  id: string;
  label: string;
  value: string;
  tokenValue: string;
  placeholder: string;
  tokens: TokenOption[];
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
  onAmountChange: (value: string) => void;
  onAmountBlur?: () => void;
  onTokenChange: (value: string) => void;
}

export function SwapField({
  id,
  label,
  value,
  tokenValue,
  placeholder,
  tokens,
  readOnly = false,
  disabled = false,
  error,
  onAmountChange,
  onAmountBlur,
  onTokenChange,
}: SwapFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
          {readOnly ? t("swap.autoQuote") : t("swap.liveMarket")}
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(event) => onAmountChange(event.target.value)}
          onBlur={onAmountBlur}
          placeholder={placeholder}
          className={cn(
            "h-12 flex-1 border-0 bg-slate-50 text-lg font-semibold shadow-none placeholder:text-slate-300 focus-visible:bg-white",
            readOnly && "text-slate-700",
            error && "ring-2 ring-rose-300 ring-offset-0",
          )}
        />
        <TokenSelector
          value={tokenValue}
          tokens={tokens}
          onChange={onTokenChange}
          disabled={disabled}
        />
      </div>
      {error ? <p className="mt-1.5 text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
