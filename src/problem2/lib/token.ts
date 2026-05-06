export function getTokenIconUrl(symbol: string) {
  return `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${symbol}.svg`;
}

export function getTokenFallback(symbol: string) {
  return symbol.slice(0, 2).toUpperCase();
}
