/**
 * Currency conversion utility
 * Converts USD to local currency based on device locale
 */
export function formatCurrency(amountUSD: number, locale?: string): string {
  const userLocale = locale || Intl.DateTimeFormat().resolvedOptions().locale;

  // Try to get currency code from locale (e.g., 'en-US' -> 'USD', 'en-GB' -> 'GBP')
  const currencyMap: Record<string, string> = {
    'en-US': 'USD',
    'en-GB': 'GBP',
    'en-CA': 'CAD',
    'en-AU': 'AUD',
    de: 'EUR',
    fr: 'EUR',
    it: 'EUR',
    es: 'EUR',
    pt: 'EUR',
    nl: 'EUR',
    pl: 'PLN',
    ru: 'RUB',
    ja: 'JPY',
    ko: 'KRW',
    zh: 'CNY',
    ar: 'SAR',
    hi: 'INR',
    tr: 'TRY',
    id: 'IDR',
    vi: 'VND',
    th: 'THB',
  };

  // Extract base language code
  const baseLang = userLocale.split('-')[0];
  const currency = currencyMap[userLocale] || currencyMap[baseLang] || 'USD';

  // Use Intl.NumberFormat for proper currency formatting
  return new Intl.NumberFormat(userLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
  }).format(amountUSD);
}
