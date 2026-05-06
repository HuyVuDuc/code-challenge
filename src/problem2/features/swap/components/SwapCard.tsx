import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { ArrowDownUp, CheckCircle2, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QuoteSummary } from "@/features/swap/components/QuoteSummary";
import { SwapField } from "@/features/swap/components/SwapField";
import {
  useGetPricesQuery,
  useGetQuoteMutation,
  useSubmitSwapMutation,
} from "@/features/swap/services/swapApi";
import { createSwapValidationSchema, hasQuotePrerequisites } from "@/features/swap/utils/validation";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { QuoteResponse, TokenOption } from "@/features/swap/types";

function getFriendlyError(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const errorData = error.data;
    const message =
      typeof errorData === "object" && errorData && "message" in errorData
        ? errorData.message
        : null;

    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

function getTokenPrice(symbol: string, tokens: TokenOption[]) {
  return tokens.find((token) => token.symbol === symbol)?.price ?? null;
}

export function SwapCard() {
  const { t } = useTranslation();
  const {
    data: tokens = [],
    isLoading: pricesLoading,
    isFetching: pricesFetching,
    isError: pricesError,
    error: pricesErrorValue,
    refetch,
  } = useGetPricesQuery();
  const [getQuote, quoteMutation] = useGetQuoteMutation();
  const [submitSwap, submitMutation] = useSubmitSwapMutation();
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteResponse | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<{
    amount: string;
    token: string;
  } | null>(null);
  const lastQuotedKeyRef = useRef<string>("");

  const validationSchema = useMemo(() => createSwapValidationSchema(), []);

  const formik = useFormik({
    initialValues: {
      fromAmount: "",
      toAmount: "",
      fromToken: "",
      toToken: "",
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: true,
    validateOnMount: true,
    onSubmit: async () => {
      setConfirmOpen(true);
    },
  });

  const {
    values,
    touched,
    errors,
    setFieldValue,
    setValues,
    setFieldTouched,
    handleSubmit,
    resetForm,
  } = formik;
  const deferredFromAmount = useDeferredValue(values.fromAmount);
  const deferredFromToken = useDeferredValue(values.fromToken);
  const deferredToToken = useDeferredValue(values.toToken);

  useEffect(() => {
    if (!tokens.length || values.fromToken || values.toToken) {
      return;
    }

    const [first, second] = tokens;
    if (!first) {
      return;
    }

    startTransition(() => {
      void setValues((currentValues) => ({
        ...currentValues,
        fromToken: first.symbol,
        toToken: second?.symbol ?? first.symbol,
      }));
    });
  }, [setValues, tokens, values.fromToken, values.toToken]);

  useEffect(() => {
    const quoteValues = {
      ...values,
      fromAmount: deferredFromAmount,
      fromToken: deferredFromToken,
      toToken: deferredToToken,
    };

    if (!hasQuotePrerequisites(quoteValues)) {
      setQuoteResult(null);
      setQuoteError(null);
      if (values.toAmount) {
        startTransition(() => {
          void setFieldValue("toAmount", "", false);
        });
      }
      return;
    }

    const quoteKey = `${quoteValues.fromToken}:${quoteValues.toToken}:${quoteValues.fromAmount}`;

    const timer = window.setTimeout(async () => {
      if (lastQuotedKeyRef.current === quoteKey) {
        return;
      }

      setQuoteError(null);

      try {
        const response = await getQuote({
          fromAmount: Number(quoteValues.fromAmount),
          fromToken: quoteValues.fromToken,
          toToken: quoteValues.toToken,
        }).unwrap();

        lastQuotedKeyRef.current = quoteKey;
        setQuoteResult(response);
        startTransition(() => {
          void setFieldValue("toAmount", String(response.toAmount), false);
        });
      } catch (error) {
        lastQuotedKeyRef.current = "";
        setQuoteResult(null);
        startTransition(() => {
          void setFieldValue("toAmount", "", false);
        });
        setQuoteError(getFriendlyError(error, t("swap.quoteError")));
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    deferredFromAmount,
    deferredFromToken,
    deferredToToken,
    getQuote,
    setFieldValue,
    t,
    values,
  ]);

  useEffect(() => {
    if (!successToast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessToast(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [successToast]);

  const fromTokenPrice = getTokenPrice(values.fromToken, tokens);
  const toTokenPrice = getTokenPrice(values.toToken, tokens);

  const sendFiatValue =
    fromTokenPrice && values.fromAmount ? Number(values.fromAmount || 0) * fromTokenPrice : 0;
  const receiveFiatValue =
    toTokenPrice && values.toAmount ? Number(values.toAmount || 0) * toTokenPrice : 0;

  const submitError = submitMutation.error
    ? getFriendlyError(submitMutation.error, t("swap.submitError"))
    : null;

  const priceErrorMessage = pricesError
    ? getFriendlyError(pricesErrorValue, t("swap.loadPriceError"))
    : null;

  const isQuoting = quoteMutation.isLoading;
  const isSubmitting = submitMutation.isLoading;
  const disableSubmit =
    !quoteResult || isQuoting || isSubmitting || !formik.isValid || !values.toAmount;

  const sendError =
    touched.fromAmount && errors.fromAmount ? t(errors.fromAmount) : undefined;
  const fromTokenError =
    touched.fromToken && errors.fromToken ? t(errors.fromToken) : undefined;
  const toTokenError = touched.toToken && errors.toToken ? t(errors.toToken) : undefined;
  const mergedSendError = sendError || fromTokenError;
  const receiveError = toTokenError;

  async function confirmSwap() {
    if (!quoteResult) {
      return;
    }

    try {
      await submitSwap({
        fromAmount: Number(values.fromAmount),
        fromToken: values.fromToken,
        toAmount: Number(values.toAmount),
        toToken: values.toToken,
      }).unwrap();

      setConfirmOpen(false);
      setQuoteError(null);
      setQuoteResult(null);
      lastQuotedKeyRef.current = "";
      setSuccessToast({
        amount: formatNumber(Number(values.toAmount || 0)),
        token: values.toToken,
      });
      resetForm({
        values: {
          fromAmount: "",
          toAmount: "",
          fromToken: values.fromToken,
          toToken: values.toToken,
        },
      });
    } catch (error) {
      setConfirmOpen(false);
      setQuoteError(getFriendlyError(error, t("swap.submitError")));
    }
  }

  return (
    <>
      <Card className="w-full max-w-xl">
        <CardContent className="space-y-4 p-4 pt-4 sm:p-5 sm:pt-4">
        {pricesError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("swap.loadPriceTitle")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{priceErrorMessage}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("common.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3">
          <SwapField
            id="fromAmount"
            label={t("swap.amountToSend")}
            value={values.fromAmount}
            tokenValue={values.fromToken}
            placeholder="0.00"
            tokens={tokens}
            disabled={pricesLoading}
            error={mergedSendError}
            onAmountChange={(value) => {
              lastQuotedKeyRef.current = "";
              void setFieldValue("fromAmount", value.replace(/[^0-9.]/g, ""), false);
            }}
            onAmountBlur={() => {
              void setFieldTouched("fromAmount", true, true);
            }}
            onTokenChange={(value) => {
              lastQuotedKeyRef.current = "";
              void setFieldValue("fromToken", value, false);
              void setFieldTouched("fromToken", true, true);
            }}
          />

          <div className="flex items-center justify-between px-1 text-sm text-slate-500">
            <span>{sendFiatValue > 0 ? formatCurrency(sendFiatValue) : t("swap.awaitingInput")}</span>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full"
              onClick={() => {
                lastQuotedKeyRef.current = "";
                const nextFromToken = values.toToken;
                const nextToToken = values.fromToken;
                startTransition(() => {
                  void setValues({
                    ...values,
                    fromToken: nextFromToken,
                    toToken: nextToToken,
                    fromAmount: values.toAmount || values.fromAmount,
                    toAmount: "",
                  });
                });
                setQuoteResult(null);
                setQuoteError(null);
              }}
              disabled={!values.fromToken || !values.toToken}
              aria-label={t("swap.switchDirection")}
            >
              <ArrowDownUp className="h-4 w-4" />
            </Button>
            <span>
              {pricesFetching && !pricesLoading ? t("swap.refreshingPrices") : t("swap.marketReady")}
            </span>
          </div>

          <SwapField
            id="toAmount"
            label={t("swap.amountToReceive")}
            value={quoteResult ? formatNumber(Number(values.toAmount || 0)) : values.toAmount}
            tokenValue={values.toToken}
            placeholder="0.00"
            tokens={tokens}
            readOnly
            disabled={pricesLoading}
            error={receiveError}
            onAmountChange={() => undefined}
            onTokenChange={(value) => {
              lastQuotedKeyRef.current = "";
              void setFieldValue("toToken", value, false);
              void setFieldTouched("toToken", true, true);
            }}
          />

          <div className="flex items-center justify-between px-1 text-sm text-slate-500">
            <span>
              {receiveFiatValue > 0 ? formatCurrency(receiveFiatValue) : t("swap.quoteHint")}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              {t("swap.secureRoute")}
            </span>
          </div>

          <QuoteSummary
            quote={quoteResult}
            fromToken={values.fromToken}
            toToken={values.toToken}
            loading={isQuoting}
          />

          {quoteError ? (
            <Alert variant="destructive">
              <TriangleAlert className="mb-2 h-4 w-4" />
              <AlertTitle>{t("swap.quoteFailedTitle")}</AlertTitle>
              <AlertDescription>{quoteError}</AlertDescription>
            </Alert>
          ) : null}

          {submitError ? (
            <Alert variant="destructive">
              <AlertTitle>{t("swap.submitFailedTitle")}</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" size="lg" className="h-12 w-full rounded-2xl text-base" disabled={disableSubmit}>
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t("swap.submitting")}
              </>
            ) : (
              t("swap.confirm")
            )}
          </Button>
        </form>
        </CardContent>
      </Card>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-950">{t("swap.confirmTitle")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {t("swap.confirmDescription", {
                fromAmount: formatNumber(Number(values.fromAmount || 0)),
                fromToken: values.fromToken,
                toAmount: formatNumber(Number(values.toAmount || 0)),
                toToken: values.toToken,
              })}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={isSubmitting}
              >
                {t("swap.cancel")}
              </Button>
              <Button type="button" onClick={() => void confirmSwap()} disabled={isSubmitting}>
                {isSubmitting ? t("swap.submitting") : t("swap.confirmAction")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {successToast ? (
        <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
          <Alert variant="success" className="border-emerald-200 bg-white/95 shadow-2xl backdrop-blur">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <AlertTitle>{t("swap.successToastTitle")}</AlertTitle>
                <AlertDescription>
                  {t("swap.successToastDescription", {
                    amount: successToast.amount,
                    token: successToast.token,
                  })}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      ) : null}
    </>
  );
}
