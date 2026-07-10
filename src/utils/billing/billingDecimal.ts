export const BILLING_AMOUNT_DP = 2;
export const BILLING_UNIT_PRICE_DP = 2;
export const BILLING_EXCHANGE_RATE_DP = 4;
export const BILLING_QTY_DP = 3;

function parseNumber(raw: unknown) {
  if (raw === '' || raw == null) return null;
  const cleaned = String(raw).replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function roundTo(n: number, dp: number) {
  const factor = 10 ** dp;
  return Math.round(n * factor) / factor;
}

export function sanitizeBillingDecimalTextInput(value: unknown, options: { allowNegative?: boolean } = {}) {
  const { allowNegative = false } = options;
  if (value === '' || value == null) return '';
  let str = String(value).replace(/,/g, '');
  let negative = false;
  if (allowNegative && str.startsWith('-')) {
    negative = true;
    str = str.slice(1);
  }
  if (str === '.') return negative ? '-0.' : '0.';
  str = str.replace(/[^\d.]/g, '');
  const dotIndex = str.indexOf('.');
  if (dotIndex >= 0) {
    str = `${str.slice(0, dotIndex + 1)}${str.slice(dotIndex + 1).replace(/\./g, '')}`;
  }
  if (negative) return str === '' ? '-' : `-${str}`;
  return str;
}

export function formatBillingDecimal(raw: unknown, dp: number) {
  const n = parseNumber(raw);
  if (n == null) return '';
  return roundTo(n, dp).toFixed(dp);
}

export function formatBillingAmount(raw: unknown) {
  return formatBillingDecimal(raw, BILLING_AMOUNT_DP);
}

export function formatBillingUnitPrice(raw: unknown) {
  return formatBillingDecimal(raw, BILLING_UNIT_PRICE_DP);
}

export function formatBillingExchangeRate(raw: unknown) {
  return formatBillingDecimal(raw, BILLING_EXCHANGE_RATE_DP);
}

export function formatBillingQty(raw: unknown) {
  return formatBillingDecimal(raw, BILLING_QTY_DP);
}

export function parseBillingQtyDecimal(raw: unknown) {
  const n = parseNumber(raw);
  return n == null ? null : roundTo(n, BILLING_QTY_DP);
}

export function resolveBillingExchangeRateForCalc(raw: unknown) {
  const n = parseNumber(raw);
  if (n == null || n <= 0) return roundTo(1, BILLING_EXCHANGE_RATE_DP);
  return roundTo(n, BILLING_EXCHANGE_RATE_DP);
}

export function normalizeBillingExchangeRate(raw: unknown) {
  return formatBillingExchangeRate(resolveBillingExchangeRateForCalc(raw));
}

export function calcBillingLineAmount(unitPriceRaw: unknown, qtyRaw: unknown) {
  const unitPrice = parseNumber(unitPriceRaw);
  const qty = parseNumber(qtyRaw);
  if (unitPrice == null || qty == null) return '';
  return formatBillingAmount(roundTo(unitPrice, BILLING_UNIT_PRICE_DP) * roundTo(qty, BILLING_QTY_DP));
}

export function calcBillingTaxAmount(amountRaw: unknown, taxRateRaw: unknown) {
  const amount = parseNumber(amountRaw);
  const rate = parseNumber(taxRateRaw);
  if (amount == null || rate == null) return '';
  return formatBillingAmount(amount * rate);
}

export function calcBillingHomeAmountBase(amountRaw: unknown, exchangeRateRaw: unknown) {
  const amount = parseNumber(amountRaw);
  if (amount == null) return '';
  const ex = resolveBillingExchangeRateForCalc(exchangeRateRaw);
  return formatBillingAmount(roundTo(amount, BILLING_AMOUNT_DP) * ex);
}

export function calcBillingChargeLineHomeAmount(amountRaw: unknown, exchangeRateRaw: unknown, taxAmountRaw: unknown) {
  const amount = parseNumber(amountRaw);
  if (amount == null) return '';
  const ex = resolveBillingExchangeRateForCalc(exchangeRateRaw);
  let home = roundTo(amount, BILLING_AMOUNT_DP) * ex;
  const tax = parseNumber(taxAmountRaw);
  if (tax != null) home += tax;
  return formatBillingAmount(home);
}
