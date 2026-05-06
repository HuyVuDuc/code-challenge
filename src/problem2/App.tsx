import { useTranslation } from "react-i18next";
import { Globe2 } from "lucide-react";
import { SwapCard } from "@/features/swap/components/SwapCard";
import { LanguageSwitcher } from "@/features/swap/components/LanguageSwitcher";
import { MockModeSwitcher } from "@/features/swap/components/MockModeSwitcher";

export function App() {
  const { t } = useTranslation();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(26,95,122,0.18),transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(240,170,66,0.18),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid-soft bg-[size:36px_36px] opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[rgba(14,165,233,0.14)] blur-3xl" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-5 px-4 py-4 sm:gap-6 sm:py-6">
        <div className="flex w-full max-w-md items-center justify-between rounded-full border border-white/70 bg-white/70 px-3 py-1.5 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
              <Globe2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{t("app.badge")}</p>
              <p className="text-xs text-slate-500">{t("app.badgeHint")}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="flex items-center justify-center">
          <MockModeSwitcher />
        </div>
        <div className="text-center">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {t("app.title")}
          </h1>
        </div>
        <SwapCard />
      </section>
    </main>
  );
}
