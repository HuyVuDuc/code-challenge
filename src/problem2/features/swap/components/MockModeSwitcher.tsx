import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/features/swap/store/hooks";
import { setMockMode } from "@/features/swap/store/swapUiSlice";
import type { MockMode } from "@/features/swap/types";
import { cn } from "@/lib/utils";

const mockModes: MockMode[] = ["normal", "slow", "error"];

export function MockModeSwitcher() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state) => state.swapUi.mockMode);
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 shadow-lg backdrop-blur">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{t("swap.devMode")}</p>
      </div>
      <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
        {mockModes.map((mockMode) => {
          const active = mode === mockMode;

          return (
            <Button
              key={mockMode}
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "rounded-full px-3",
                active && "bg-white text-slate-950 shadow-sm hover:bg-white",
              )}
              onClick={() => dispatch(setMockMode(mockMode))}
            >
              {t(`mockMode.${mockMode}`)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
