export function useBillingDraftTaxCode() {
  function assertSelectedSameTaxCode(
    items: Array<{ Tax_Code?: string }>,
    message = 'Selected lines must have the same Tax Code to generate draft.'
  ) {
    const taxCodes = new Set(items.map(item => String(item?.Tax_Code ?? '').trim()));
    if (taxCodes.size > 1) {
      window.$message?.warning(message);
      return false;
    }
    return true;
  }

  return { assertSelectedSameTaxCode };
}
