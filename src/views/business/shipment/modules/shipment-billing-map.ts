import type {
  AccTransactionHeader,
  BillingChargeLineItem,
  BillingChargeWriteItem
} from '@/service/api/business/billing';
import { findBillingTaxCodeItem, getBillingTaxRateValue } from '@/constants/billingTaxCodeItems';
import {
  calcBillingChargeLineHomeAmount,
  calcBillingHomeAmountBase,
  calcBillingTaxAmount,
  formatBillingAmount,
  resolveBillingExchangeRateForCalc
} from '@/utils/billing/billingDecimal';

/** UI row for charge line table; fields without API backing stay empty. */
export interface ShipmentBillingChargeRow {
  id: string | number;
  pk: string;
  /** AccChargeCode.ac_pk (jr_ac) */
  Charge_Code: string;
  /** AccChargeCode.ac_code — display label for Charge_Code */
  charge_code: string;
  Description: string;
  Branch: string;
  branch_code: string;
  Currency: string;
  JR_InvoiceType: string;
  Amount: number | string;
  /** Tax code pk (canonical casing from billingTaxCodeItems) */
  Tax_Code: string;
  Tax_Amount: string;
  Exchange_Rate: number | string;
  Home_Amount: string;
  invoice_no: string;
  invoice_pk: string;
  draft: string;
  is_locked: number;
  party_code: string;
  Debtor?: string;
  Creditor?: string;
}

function normalizeTaxCodePk(raw?: string | null) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  return findBillingTaxCodeItem(value)?.pk ?? value;
}

/** Home base = Amount × rate; Tax = home base × rate; Home = home base + Tax */
export function recalcChargeLineTaxAndHome(item: ShipmentBillingChargeRow) {
  const exRaw = resolveBillingExchangeRateForCalc(item.Exchange_Rate);
  const homeBase = calcBillingHomeAmountBase(item.Amount, exRaw);
  const taxPk = String(item.Tax_Code ?? '').trim();
  if (!taxPk) {
    item.Tax_Amount = '';
    item.Home_Amount = homeBase;
    return;
  }
  const taxRate = getBillingTaxRateValue(taxPk);
  if (taxRate === null) return;
  if (homeBase === '') {
    item.Tax_Amount = '';
    item.Home_Amount = '';
    return;
  }
  item.Tax_Amount = calcBillingTaxAmount(homeBase, taxRate);
  item.Home_Amount = calcBillingChargeLineHomeAmount(item.Amount, exRaw, item.Tax_Amount);
}

export function mapChargeLineItem(item: BillingChargeLineItem, chargeType: 'AR' | 'AP'): ShipmentBillingChargeRow {
  const locked = item.invoice_pk ? 1 : 0;
  const taxRaw = chargeType === 'AR' ? item.wht_rate : item.gst_rate;
  const row: ShipmentBillingChargeRow = {
    id: item.jr_pk,
    pk: item.jr_pk,
    Charge_Code: item.jr_ac || '',
    charge_code: item.charge_code || '',
    Description: item.jr_desc || '',
    Branch: item.jr_gb || '',
    branch_code: item.branch_code || '',
    Currency: item.currency || '',
    JR_InvoiceType: item.jr_invoicetype || '',
    Amount: item.amount ?? '',
    Tax_Code: normalizeTaxCodePk(taxRaw),
    Tax_Amount: '',
    Exchange_Rate: item.exchange_rate ?? '',
    Home_Amount: formatBillingAmount(item.os_amount),
    invoice_no: item.invoice_no || '',
    invoice_pk: item.invoice_pk || '',
    draft: item.draft || '',
    is_locked: locked,
    party_code: item.party_code || '',
    ...(chargeType === 'AR' ? { Debtor: item.party_oh || '' } : { Creditor: item.party_oh || '' })
  };
  recalcChargeLineTaxAndHome(row);
  return row;
}

export function mapChargeRowToWriteItem(
  row: ShipmentBillingChargeRow,
  chargeType: 'AR' | 'AP'
): BillingChargeWriteItem {
  const taxCode = normalizeTaxCodePk(row.Tax_Code);
  return {
    jr_pk: row.pk || undefined,
    chargeType,
    jr_ac: row.Charge_Code?.trim() || undefined,
    jr_invoicetype: row.JR_InvoiceType,
    jr_desc: row.Description,
    amount: Number(row.Amount) || 0,
    os_amount: Number(String(row.Home_Amount ?? '').replace(/,/g, '')) || 0,
    currency: row.Currency,
    party_oh: (chargeType === 'AR' ? row.Debtor : row.Creditor)?.trim() || undefined,
    exchange_rate: Number(row.Exchange_Rate) || 0,
    wht_rate: chargeType === 'AR' ? taxCode || undefined : undefined,
    gst_rate: chargeType === 'AP' ? taxCode || undefined : undefined,
    jr_gb: row.Branch?.trim() || undefined
  };
}

export function getBillingLockLabel(isLocked: number) {
  return isLocked === 0 ? 'Open' : 'Invoiced';
}

export function getBillingLockTagType(isLocked: number): 'default' | 'success' | 'warning' | 'error' | 'info' {
  return isLocked === 0 ? 'success' : 'warning';
}

export function formatInvoiceDate(value?: string | null) {
  if (!value) return '';
  return String(value).includes('T') ? String(value).split('T')[0] : String(value);
}

export function getInvoiceHeaderStatus(item: AccTransactionHeader) {
  if (item.ah_postdate && item.ah_iscancelled === 0) return 'Posted';
  if (item.ah_postdate && item.ah_iscancelled === 1) return 'Voided';
  if (!item.ah_postdate && item.ah_iscancelled === 0) return 'Draft';
  if (!item.ah_postdate && item.ah_iscancelled === 1) return 'Canceled';
  return 'Draft';
}

export function isDraftInvoiceHeader(item: AccTransactionHeader) {
  return !item.ah_postdate && item.ah_iscancelled === 0;
}

export function isPostedInvoiceHeader(item: AccTransactionHeader) {
  return Boolean(item.ah_postdate) && item.ah_iscancelled === 0;
}
