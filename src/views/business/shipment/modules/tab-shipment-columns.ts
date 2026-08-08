import { h } from 'vue';
import { NButton, NInput, NInputNumber, NSelect, NCheckbox } from 'naive-ui';

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

// --- Container Table ---
export function createContainerColumns(_removeFn: (index: number) => void) {
  return [
    // Del temporarily hidden
    {
      title: 'Container Type',
      key: 'ctr_type',
      width: 130,
      render(row: any) {
        return h(NSelect, {
          value: row.ctr_type,
          options: containerTypeItemOptions,
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.ctr_type = v;
          }
        });
      }
    },
    {
      title: 'Count',
      key: 'ctr_count',
      width: 80,
      render(row: any) {
        return h(NInputNumber, {
          value: row.ctr_count,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.ctr_count = v ?? 0;
          }
        });
      }
    },
    {
      title: 'Container No',
      key: 'jc_containernum',
      width: 140,
      render(row: any) {
        return h(NInput, {
          value: row.jc_containernum,
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.jc_containernum = v;
          }
        });
      }
    },
    {
      title: 'Seal No',
      key: 'jc_sealnum',
      width: 120,
      render(row: any) {
        return h(NInput, {
          value: row.jc_sealnum,
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.jc_sealnum = v;
          }
        });
      }
    },
    {
      title: 'SOC',
      key: 'ctr_is_soc',
      width: 60,
      align: 'center' as const,
      render(row: any) {
        return h(NCheckbox, {
          checked: row.ctr_is_soc === 1,
          'onUpdate:checked': (v: boolean) => {
            row.ctr_is_soc = v ? 1 : 0;
          }
        });
      }
    },
    {
      title: 'Commodity',
      key: 'pac_commodity',
      width: 140,
      render(row: any) {
        return h(NInput, {
          value: row.pac_commodity,
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.pac_commodity = v;
          }
        });
      }
    },
    {
      title: 'Gross Weight',
      key: 'jc_grossweight',
      width: 110,
      render(row: any) {
        return h(NInputNumber, {
          value: row.jc_grossweight,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.jc_grossweight = v ?? 0;
          }
        });
      }
    },
    {
      title: 'CBM',
      key: 'pac_actual_volume',
      width: 90,
      render(row: any) {
        return h(NInputNumber, {
          value: row.pac_actual_volume,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.pac_actual_volume = v ?? 0;
          }
        });
      }
    },
    {
      title: 'No. of Package',
      key: 'pac_package_count',
      width: 110,
      render(row: any) {
        return h(NInputNumber, {
          value: row.pac_package_count,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.pac_package_count = v ?? 0;
          }
        });
      }
    },
    {
      title: 'Pack Type',
      key: 'pac_pack_type',
      width: 100,
      render(row: any) {
        return h(NSelect, {
          value: row.pac_pack_type,
          options: packTypeOptions,
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.pac_pack_type = v;
          }
        });
      }
    },
    {
      title: 'Description',
      key: 'pac_description',
      width: 160,
      render(row: any) {
        return h(NInput, {
          value: row.pac_description,
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.pac_description = v;
          }
        });
      }
    }
  ];
}

// --- Loose Cargo Table ---
export function createLooseColumns(removeFn: (index: number) => void, calcFn: (item: any) => void) {
  return [
    {
      title: '',
      key: 'actions',
      width: 50,
      align: 'center' as const,
      render(_: any, index: number) {
        return h(
          NButton,
          { text: true, type: 'error', size: 'small', onClick: () => removeFn(index) },
          { default: () => 'Del' }
        );
      }
    },
    {
      title: 'No. of Package',
      key: 'pac_package_count',
      width: 110,
      render(row: any) {
        return h(NInputNumber, {
          value: row.pac_package_count,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.pac_package_count = v ?? 0;
          }
        });
      }
    },
    {
      title: 'Pack Type',
      key: 'pac_pack_type',
      width: 100,
      render(row: any) {
        return h(NSelect, {
          value: row.pac_pack_type,
          options: packTypeOptions,
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.pac_pack_type = v;
          }
        });
      }
    },
    {
      title: 'Gross Weight',
      key: 'pac_gross_weight',
      width: 110,
      render(row: any) {
        return h(NInputNumber, {
          value: row.pac_gross_weight,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.pac_gross_weight = v ?? 0;
            calcFn(row);
          }
        });
      }
    },
    {
      title: 'CBM',
      key: 'pac_actual_volume',
      width: 90,
      render(row: any) {
        return h(NInputNumber, {
          value: row.pac_actual_volume,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.pac_actual_volume = v ?? 0;
            calcFn(row);
          }
        });
      }
    },
    {
      title: 'Volume Weight',
      key: 'pac_volume_weight',
      width: 110,
      render(row: any) {
        return h(NInput, {
          value: row.pac_volume_weight != null ? String(row.pac_volume_weight) : '',
          readonly: true,
          size: 'small'
        });
      }
    },
    {
      title: 'Chargeable Weight',
      key: 'pac_chargeable_weight',
      width: 130,
      render(row: any) {
        return h(NInput, {
          value: row.pac_chargeable_weight != null ? String(row.pac_chargeable_weight) : '',
          readonly: true,
          size: 'small'
        });
      }
    },
    {
      title: 'Length',
      key: 'pac_length',
      width: 90,
      render(row: any) {
        return h(NInputNumber, {
          value: row.pac_length,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.pac_length = v ?? 0;
          }
        });
      }
    },
    {
      title: 'Width',
      key: 'pac_width',
      width: 90,
      render(row: any) {
        return h(NInputNumber, {
          value: row.pac_width,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.pac_width = v ?? 0;
          }
        });
      }
    },
    {
      title: 'Height',
      key: 'pac_height',
      width: 90,
      render(row: any) {
        return h(NInputNumber, {
          value: row.pac_height,
          size: 'small',
          min: 0,
          showButton: false,
          style: 'width:100%',
          'onUpdate:value': (v: number | null) => {
            row.pac_height = v ?? 0;
          }
        });
      }
    },
    {
      title: 'UOM',
      key: 'pac_uom',
      width: 80,
      render(row: any) {
        return h(NSelect, {
          value: row.pac_uom || 'M3',
          options: [{ label: 'M3', value: 'M3' }],
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.pac_uom = v;
          }
        });
      }
    },
    {
      title: 'Description',
      key: 'pac_description',
      width: 160,
      render(row: any) {
        return h(NInput, {
          value: row.pac_description,
          size: 'small',
          'onUpdate:value': (v: string) => {
            row.pac_description = v;
          }
        });
      }
    }
  ];
}
