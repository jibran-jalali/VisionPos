export type CurrencyConfig = {
  code: string;
  symbol: string;
  locale: string;
};

export const defaultCurrency: CurrencyConfig = {
  code: "PKR",
  symbol: "Rs",
  locale: "en-PK",
};

export const supportedCurrencies: CurrencyConfig[] = [
  defaultCurrency,
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "AED", symbol: "AED", locale: "en-AE" },
  { code: "SAR", symbol: "SAR", locale: "en-SA" },
  { code: "INR", symbol: "₹", locale: "en-IN" },
];

export function formatMoney(amount: number, currency: CurrencyConfig = defaultCurrency) {
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(amount);
}
