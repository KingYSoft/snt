import { h } from 'vue';
import { NInput, NInputNumber, NCheckbox } from 'naive-ui';
import { $t } from '@/locales';

function toInputValue(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

// --- Shared options ---
export const containerTypeItemOptions = [
  { label: '20GP', value: '20GP' },
  { label: '40GP', value: '40GP' },
  { label: '40HC', value: '40HC' }
];

export const packTypeOptions = [
  { label: 'CTN', value: 'CTN' },
  { label: 'PKG', value: 'PKG' },
  { label: 'PLT', value: 'PLT' }
];

function renderReadonlyInput(value: unknown) {
  return h(NInput, {
    value: toInputValue(value),
    size: 'small',
    readonly: true,
    placeholder: $t('common.pleaseInput')
  });
}

function renderReadonlyNumber(value: unknown) {
  return h(NInputNumber, {
    value: typeof value === 'number' ? value : value == null || value === '' ? null : Number(value),
    size: 'small',
    showButton: false,
    readonly: true,
    style: 'width:100%'
  });
}

// --- Container Table ---
export function createContainerColumns(_removeFn: (index: number) => void) {
  return [
    {
      title: $t('page.business.consolidation.container.containerType'),
      key: 'ctr_type',
      width: 130,
      render(row: any) {
        return renderReadonlyInput(row.ctr_type);
      }
    },
    {
      title: $t('page.business.consolidation.container.count'),
      key: 'ctr_count',
      width: 80,
      render(row: any) {
        return renderReadonlyNumber(row.ctr_count);
      }
    },
    {
      title: $t('page.business.consolidation.container.containerNo'),
      key: 'jc_containernum',
      width: 140,
      render(row: any) {
        return renderReadonlyInput(row.jc_containernum);
      }
    },
    {
      title: $t('page.business.consolidation.container.sealNo'),
      key: 'jc_sealnum',
      width: 120,
      render(row: any) {
        return renderReadonlyInput(row.jc_sealnum);
      }
    },
    {
      title: $t('page.business.consolidation.container.soc'),
      key: 'ctr_is_soc',
      width: 60,
      align: 'center' as const,
      render(row: any) {
        return h(NCheckbox, {
          checked: row.ctr_is_soc === 1,
          style: 'pointer-events: none'
        });
      }
    },
    {
      title: $t('page.business.consolidation.container.commodity'),
      key: 'pac_commodity',
      width: 140,
      render(row: any) {
        return renderReadonlyInput(row.pac_commodity);
      }
    },
    {
      title: $t('page.business.shipment.form.grossWeight'),
      key: 'jc_grossweight',
      width: 110,
      render(row: any) {
        return renderReadonlyNumber(row.jc_grossweight);
      }
    },
    {
      title: $t('page.business.shipment.form.volume'),
      key: 'pac_actual_volume',
      width: 90,
      render(row: any) {
        return renderReadonlyNumber(row.pac_actual_volume);
      }
    },
    {
      title: $t('page.business.shipment.form.totalPackage'),
      key: 'pac_package_count',
      width: 110,
      render(row: any) {
        return renderReadonlyNumber(row.pac_package_count);
      }
    },
    {
      title: $t('page.business.consolidation.container.packType'),
      key: 'pac_pack_type',
      width: 100,
      render(row: any) {
        return renderReadonlyInput(row.pac_pack_type);
      }
    },
    {
      title: $t('page.business.consolidation.container.description'),
      key: 'pac_description',
      width: 160,
      render(row: any) {
        return renderReadonlyInput(row.pac_description);
      }
    }
  ];
}

// --- Loose Cargo Table ---
export function createLooseColumns(_removeFn: (index: number) => void, _calcFn: (item: any) => void) {
  return [
    {
      title: $t('page.business.shipment.form.totalPackage'),
      key: 'pac_package_count',
      width: 110,
      render(row: any) {
        return renderReadonlyNumber(row.pac_package_count);
      }
    },
    {
      title: $t('page.business.consolidation.container.packType'),
      key: 'pac_pack_type',
      width: 100,
      render(row: any) {
        return renderReadonlyInput(row.pac_pack_type);
      }
    },
    {
      title: $t('page.business.shipment.form.grossWeight'),
      key: 'pac_gross_weight',
      width: 110,
      render(row: any) {
        return renderReadonlyNumber(row.pac_gross_weight);
      }
    },
    {
      title: $t('page.business.shipment.form.volume'),
      key: 'pac_actual_volume',
      width: 90,
      render(row: any) {
        return renderReadonlyNumber(row.pac_actual_volume);
      }
    },
    {
      title: $t('page.business.shipment.form.volumeWeight'),
      key: 'pac_volume_weight',
      width: 110,
      render(row: any) {
        return renderReadonlyInput(row.pac_volume_weight);
      }
    },
    {
      title: $t('page.business.shipment.form.chargeableWeight'),
      key: 'pac_chargeable_weight',
      width: 130,
      render(row: any) {
        return renderReadonlyInput(row.pac_chargeable_weight);
      }
    },
    {
      title: $t('page.business.shipment.form.length'),
      key: 'pac_length',
      width: 90,
      render(row: any) {
        return renderReadonlyNumber(row.pac_length);
      }
    },
    {
      title: $t('page.business.shipment.form.width'),
      key: 'pac_width',
      width: 90,
      render(row: any) {
        return renderReadonlyNumber(row.pac_width);
      }
    },
    {
      title: $t('page.business.shipment.form.height'),
      key: 'pac_height',
      width: 90,
      render(row: any) {
        return renderReadonlyNumber(row.pac_height);
      }
    },
    {
      title: $t('page.business.shipment.form.uom'),
      key: 'pac_uom',
      width: 80,
      render(row: any) {
        return renderReadonlyInput(row.pac_uom || 'M3');
      }
    },
    {
      title: $t('page.business.consolidation.container.description'),
      key: 'pac_description',
      width: 160,
      render(row: any) {
        return renderReadonlyInput(row.pac_description);
      }
    }
  ];
}
