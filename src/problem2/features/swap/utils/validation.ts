import * as Yup from "yup";
import type { SwapFormValues } from "@/features/swap/types";

const amountRegex = /^\d+(\.\d{1,6})?$/;

export function createSwapValidationSchema() {
  return Yup.object({
    fromAmount: Yup.string()
      .required("validation.amountRequired")
      .test("is-valid-number", "validation.amountInvalid", (value) =>
        Boolean(value && amountRegex.test(value)),
      )
      .test("is-positive", "validation.amountPositive", (value) =>
        Boolean(value && Number(value) > 0),
      ),
    fromToken: Yup.string().required("validation.fromTokenRequired"),
    toToken: Yup.string()
      .required("validation.toTokenRequired")
      .test("not-same", "validation.sameToken", function test(value) {
        return value !== this.parent.fromToken;
      }),
    toAmount: Yup.string(),
  });
}

export function hasQuotePrerequisites(values: SwapFormValues) {
  return (
    amountRegex.test(values.fromAmount) &&
    Number(values.fromAmount) > 0 &&
    Boolean(values.fromToken) &&
    Boolean(values.toToken) &&
    values.fromToken !== values.toToken
  );
}
