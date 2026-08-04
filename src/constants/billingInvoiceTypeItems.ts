/** Billing charge line invoice type (JR_InvoiceType / jr_invoicetype). */
export const billingInvoiceTypeItems = Object.freeze([
  'ITC',
  'CUD',
  'DCU',
  'CUR',
  'DED',
  'FRD',
  'ITD',
  'NON',
  'FID',
  'DBD',
  'FIN',
  'DES',
  'FRT',
  'DBT',
  'SBR'
] as const);

export type BillingInvoiceType = (typeof billingInvoiceTypeItems)[number];

export const billingInvoiceTypeOptions = billingInvoiceTypeItems.map(code => ({
  label: code,
  value: code
}));

export function isBillingInvoiceType(value?: string | null): value is BillingInvoiceType {
  return billingInvoiceTypeItems.includes(value as BillingInvoiceType);
}
