import { formatBillingQty, parseBillingQtyDecimal, sanitizeBillingDecimalTextInput } from './billingDecimal';

export function billingQtyNonNegativeRule(value: unknown) {
  const d = parseBillingQtyDecimal(value);
  if (d == null) return true;
  return d >= 0 || 'Qty cannot be negative';
}

export function sanitizeBillingQtyInput(value: unknown) {
  if (value === '' || value == null) return '';
  return sanitizeBillingDecimalTextInput(value);
}

export function finalizeBillingQtyValue(value: unknown) {
  if (value === '' || value == null) return '';
  const d = parseBillingQtyDecimal(value);
  if (d == null) return String(value);
  return formatBillingQty(Math.max(0, d));
}

export function billingQtyForCalculation(value: unknown) {
  const d = parseBillingQtyDecimal(value);
  if (d == null) return formatBillingQty(0);
  return formatBillingQty(Math.max(0, d));
}

export function isBillingQtyNegative(value: unknown) {
  const d = parseBillingQtyDecimal(value);
  return d != null && d < 0;
}
