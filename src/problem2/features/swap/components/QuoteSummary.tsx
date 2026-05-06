import { useTranslation } from "react-i18next";
import { ArrowUpDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { QuoteResponse } from "@/features/swap/types";

interface QuoteSummaryProps {
  quote: QuoteResponse | null;
  fromToken?: string;
  toToken?: string;
  loading: boolean;
}

export function QuoteSummary({
  quote,
  fromToken,
  toToken,
  loading,
}: QuoteSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="font-medium">{t("swap.quoteSummary")}</p>
        </div>
        <Badge variant="secondary">{t("swap.liveQuote")}</Badge>
      </div>
      <Separator className="my-3" />
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : quote ? (
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-4">
            <span>{t("swap.exchangeRate")}</span>
            <span className="flex items-center gap-2 font-medium text-slate-950">
              <ArrowUpDown className="h-4 w-4 text-slate-500" />
              {`1 ${fromToken} = ${formatNumber(quote.rate)} ${toToken}`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>{t("swap.networkFee")}</span>
            <span className="font-medium text-slate-950">
              {formatNumber(quote.fee)} {toToken}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>{t("swap.slippage")}</span>
            <span className="font-medium text-slate-950">{quote.slippage}%</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">{t("swap.quoteHint")}</p>
      )}
    </div>
  );
}
