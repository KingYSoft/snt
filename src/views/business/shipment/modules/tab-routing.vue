<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { h } from 'vue';
import { NDataTable, NButton, NSelect, NInput, NDatePicker } from 'naive-ui';

const props = defineProps<{ inputData: Record<string, any> }>();

const routeTypeOptions = [
  { label: 'Main', value: 'Main' },
  { label: 'Feeder', value: 'Feeder' },
  { label: 'Direct', value: 'Direct' }
];

const columns = [
  {
    title: () => {
      return h('div', { style: 'white-space: nowrap; display: flex; justify-content: center' }, [
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            size: 'small',
            onClick: () => addRoutingLine()
          },
          { default: () => '+' }
        )
      ]);
    },
    key: 'actions',
    width: 40,
    align: 'center' as const,
    render(_: any, index: number) {
      return h(
        NButton,
        {
          text: true,
          type: 'error',
          size: 'small',
          onClick: () => deleteLine(index)
        },
        { default: () => '-' }
      );
    }
  },
  {
    title: 'Consolidation Number',
    key: 'consolidation_number',
    width: 150,
    ellipsis: { tooltip: true },
    render(row: any) {
      return h(NInput, {
        value: row.consolidation_number,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.consolidation_number = v;
        }
      });
    }
  },
  {
    title: 'Route Type',
    key: 'route_type',
    width: 120,
    align: 'center' as const,
    render(row: any) {
      return h(NSelect, {
        value: row.route_type,
        options: routeTypeOptions,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.route_type = v;
        }
      });
    }
  },
  {
    title: 'Vessel/Train/Truck',
    key: 'vessel_name',
    width: 150,
    ellipsis: { tooltip: true },
    render(row: any) {
      return h(NInput, {
        value: row.vessel_name,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.vessel_name = v;
        }
      });
    }
  },
  {
    title: 'Voyage/Flight/Truck',
    key: 'voyage_number',
    width: 120,
    ellipsis: { tooltip: true },
    render(row: any) {
      return h(NInput, {
        value: row.voyage_number,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.voyage_number = v;
        }
      });
    }
  },
  {
    title: 'Port of Loading',
    key: 'port_of_loading',
    width: 150,
    ellipsis: { tooltip: true },
    render(row: any) {
      return h(NInput, {
        value: row.port_of_loading,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.port_of_loading = v;
        }
      });
    }
  },
  {
    title: 'Port of Discharge',
    key: 'port_of_discharge',
    width: 150,
    ellipsis: { tooltip: true },
    render(row: any) {
      return h(NInput, {
        value: row.port_of_discharge,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.port_of_discharge = v;
        }
      });
    }
  },
  {
    title: 'ETD',
    key: 'etd',
    width: 140,
    align: 'center' as const,
    render(row: any) {
      return h(NDatePicker, {
        formattedValue: safeDate(row.etd),
        type: 'date',
        size: 'small',
        clearable: true,
        style: 'width:100%',
        valueFormat: 'yyyy-MM-dd',
        'onUpdate:formattedValue': (v: string) => {
          row.etd = v;
        }
      });
    }
  },
  {
    title: 'ETA',
    key: 'eta',
    width: 140,
    align: 'center' as const,
    render(row: any) {
      return h(NDatePicker, {
        formattedValue: safeDate(row.eta),
        type: 'date',
        size: 'small',
        clearable: true,
        style: 'width:100%',
        valueFormat: 'yyyy-MM-dd',
        'onUpdate:formattedValue': (v: string) => {
          row.eta = v;
        }
      });
    }
  },
  {
    title: 'ATD',
    key: 'atd',
    width: 140,
    align: 'center' as const,
    render(row: any) {
      return h(NDatePicker, {
        formattedValue: safeDate(row.atd),
        type: 'date',
        size: 'small',
        clearable: true,
        style: 'width:100%',
        valueFormat: 'yyyy-MM-dd',
        'onUpdate:formattedValue': (v: string) => {
          row.atd = v;
        }
      });
    }
  },
  {
    title: 'ATA',
    key: 'ata',
    width: 140,
    align: 'center' as const,
    render(row: any) {
      return h(NDatePicker, {
        formattedValue: safeDate(row.ata),
        type: 'date',
        size: 'small',
        clearable: true,
        style: 'width:100%',
        valueFormat: 'yyyy-MM-dd',
        'onUpdate:formattedValue': (v: string) => {
          row.ata = v;
        }
      });
    }
  },
  {
    title: 'Carrier',
    key: 'carrier',
    width: 200,
    ellipsis: { tooltip: true },
    render(row: any) {
      return h(NInput, {
        value: row.carrier,
        size: 'small',
        'onUpdate:value': (v: string) => {
          row.carrier = v;
        }
      });
    }
  }
];

function safeDate(val: string | null | undefined): string | undefined {
  return val || undefined;
}

function addRoutingLine() {
  console.log('addRoutingLine: ', addRoutingLine);
  if (!props.inputData.routing_list) {
    props.inputData.routing_list = [];
  }
  props.inputData.routing_list.push({
    id: Date.now(),
    consolidation_number: '',
    route_type: 'Main',
    vessel_name: '',
    voyage_number: '',
    port_of_loading: '',
    port_of_discharge: '',
    etd: null,
    eta: null,
    atd: null,
    ata: null,
    carrier: ''
  });
}

function deleteLine(index: number) {
  props.inputData.routing_list.splice(index, 1);
}
</script>

<template>
  <div class="p-4">
    <NDataTable
      :columns="columns"
      :data="inputData.routing_list || []"
      :bordered="true"
      size="small"
      :row-key="(row: any) => String(row.id ?? Math.random())"
      :scroll-x="1540"
      striped
    />
  </div>
</template>
