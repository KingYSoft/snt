import type {
  AccTransactionHeader,
  BillingChargeLineItem,
  BillingChargeWriteItem
} from '@/service/api/business/billing';
import { billingTaxCodeItems } from '@/constants/billingTaxCodeItems';
import {
  calcBillingChargeLineHomeAmount,
  calcBillingHomeAmountBase,
  calcBillingTaxAmount,
  resolveBillingExchangeRateForCalc
} from '@/utils/billing/billingDecimal';

/** UI row for charge line table; fields without API backing stay empty. */
export interface ShipmentBillingChargeRow {
  id: string | number;
  pk: string;
  Charge_Code: string;
  Description: string;
  Branch: string;
  Currency: string;
  Type: string;
  Amount: number | string;
  Tax_Code: string;
  Tax_Amount: string;
  Estimated_Cost: number | string;
  Exchange_Rate: number | string;
  Home_Amount: string;
  invoice_no: string;
  invoice_pk: string;
  draft: string;
  is_locked: number;
  Debtor?: string;
  Creditor?: string;
}

/** Home base = Amount × rate; Tax = home base × rate; Home = home base + Tax */
export function recalcChargeLineTaxAndHome(item: ShipmentBillingChargeRow) {
  const exRaw = resolveBillingExchangeRateForCalc(item.Exchange_Rate);
  const homeBase = calcBillingHomeAmountBase(item.Amount, exRaw);
  const code = String(item.Tax_Code ?? '').trim();
  if (!code) {
    item.Tax_Amount = '';
    item.Home_Amount = homeBase;
    return;
  }
  const taxRow = billingTaxCodeItems.find(x => x.code === code);
  if (!taxRow) return;
  if (homeBase === '') {
    item.Tax_Amount = '';
    item.Home_Amount = '';
    return;
  }
  item.Tax_Amount = calcBillingTaxAmount(homeBase, taxRow.value);
  item.Home_Amount = calcBillingChargeLineHomeAmount(item.Amount, exRaw, item.Tax_Amount);
}

export function mapChargeLineItem(item: BillingChargeLineItem, chargeType: 'AR' | 'AP'): ShipmentBillingChargeRow {
  const locked = item.invoice_pk ? 1 : 0;
  const row: ShipmentBillingChargeRow = {
    id: item.jr_pk || item.line_pk,
    pk: item.jr_pk,
    Charge_Code: item.jr_jh || '',
    Description: item.jr_desc || '',
    Branch: '',
    Currency: item.currency || '',
    Type: item.jr_chargetype || '',
    Amount: item.amount ?? '',
    Tax_Code: item.vat_class || '',
    Tax_Amount: item.wht_rate || '',
    Estimated_Cost: item.os_amount ?? '',
    Exchange_Rate: item.exchange_rate ?? '',
    Home_Amount: '',
    invoice_no: item.invoice_no || '',
    invoice_pk: item.invoice_pk || '',
    draft: item.draft || '',
    is_locked: locked,
    ...(chargeType === 'AR' ? { Debtor: item.party_oh || '' } : { Creditor: item.party_oh || '' })
  };
  recalcChargeLineTaxAndHome(row);
  return row;
}

export function mapChargeRowToWriteItem(
  row: ShipmentBillingChargeRow,
  chargeType: 'AR' | 'AP'
): BillingChargeWriteItem {
  return {
    jr_pk: row.pk || undefined,
    chargeType,
    jr_chargetype: row.Type,
    jr_desc: row.Description,
    amount: Number(row.Amount) || 0,
    os_amount: Number(row.Estimated_Cost) || 0,
    currency: row.Currency,
    party_oh: chargeType === 'AR' ? row.Debtor : row.Creditor,
    exchange_rate: Number(row.Exchange_Rate) || 0,
    gst_rate: '',
    wht_rate: String(row.Tax_Amount ?? ''),
    vat_class: row.Tax_Code
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
