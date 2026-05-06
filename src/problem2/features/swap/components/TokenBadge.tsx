import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getTokenFallback } from "@/lib/token";

interface TokenBadgeProps {
  iconUrl: string;
  symbol: string;
}

export function TokenBadge({ iconUrl, symbol }: TokenBadgeProps) {
  return (
    <Avatar className="h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white">
      <AvatarImage src={iconUrl} alt={symbol} className="h-full w-full object-cover" />
      <AvatarFallback>{getTokenFallback(symbol)}</AvatarFallback>
    </Avatar>
  );
}
