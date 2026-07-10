import { formatBillingUnitPrice, sanitizeBillingDecimalTextInput } from './billingDecimal';

function parseBillingDecimal(raw: unknown) {
  if (raw === '' || raw == null) return null;
  const cleaned = String(raw).replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function sanitizeBillingUnitPriceInput(value: unknown) {
  if (value === '' || value == null) return '';
  return sanitizeBillingDecimalTextInput(value, { allowNegative: true });
}

export function finalizeBillingUnitPriceValue(value: unknown) {
  if (value === '' || value == null) return '';
  const d = parseBillingDecimal(value);
  if (d == null) return String(value);
  return formatBillingUnitPrice(d);
}
