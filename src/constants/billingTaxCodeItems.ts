/** Billing tax codes: submit `code`; tax amount = home base × `value`. */
export const billingTaxCodeItems = Object.freeze([
  { code: 'EXEMPT', value: 0 },
  { code: 'VAT1', value: 0.01 },
  { code: 'VAT3', value: 0.03 },
  { code: 'VAT6', value: 0.06 },
  { code: 'VAT9', value: 0.09 }
] as const);

export function gstRateValueFromTaxCode(taxCode?: string | number | null) {
  const code = String(taxCode ?? '').trim();
  if (!code) return null;
  const row = billingTaxCodeItems.find(x => x.code === code);
  return row ? row.value : null;
}
