/** Billing tax codes: submit `pk`; tax amount = home base × `value`. */
export const billingTaxCodeItems = Object.freeze([
  { pk: '66E7A0B9-88A3-4148-ABAD-5F4579198F5A', code: 'EXEMPT', value: 0 },
  { pk: '10985F19-1552-4A1E-9836-C78278880E41', code: 'VAT6', value: 0.06 }
] as const);

export type BillingTaxCodeItem = (typeof billingTaxCodeItems)[number];

export const BILLING_TAX_EXEMPT_PK = billingTaxCodeItems[0].pk;
export const BILLING_TAX_EXEMPT_CODE = billingTaxCodeItems[0].code;
export const BILLING_TAX_VAT6_PK = billingTaxCodeItems[1].pk;

export function findBillingTaxCodeItem(pk?: string | null) {
  const value = String(pk ?? '').trim();
  if (!value) return undefined;
  return billingTaxCodeItems.find(x => x.pk.toLowerCase() === value.toLowerCase());
}

/** Unknown pk: display as EXEMPT (legacy / other tax codes). */
export function getBillingTaxCodeLabel(pk?: string | null) {
  const value = String(pk ?? '').trim();
  if (!value) return '';
  return findBillingTaxCodeItem(value)?.code ?? BILLING_TAX_EXEMPT_CODE;
}

/** Unknown pk: calculate as tax-exempt (0%). */
export function getBillingTaxRateValue(pk?: string | null) {
  const value = String(pk ?? '').trim();
  if (!value) return null;
  return findBillingTaxCodeItem(value)?.value ?? 0;
}

/** @deprecated use getBillingTaxRateValue — kept for callers that still pass pk */
export function gstRateValueFromTaxCode(taxPk?: string | number | null) {
  return getBillingTaxRateValue(String(taxPk ?? ''));
}
