import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const languages = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
      {languages.map((language) => {
        const active = i18n.language === language.code;

        return (
          <Button
            key={language.code}
            type="button"
            size="sm"
            variant="ghost"
            className={cn(
              "rounded-full px-3",
              active && "bg-white text-slate-950 shadow-sm hover:bg-white",
            )}
            onClick={() => void i18n.changeLanguage(language.code)}
          >
            {language.label}
          </Button>
        );
      })}
    </div>
  );
}
