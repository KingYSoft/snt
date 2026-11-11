import { request } from '@/service/request';

export interface EdiGenerateDocJsonInput {
  shipment_pk: string;
  doc_pks: string[];
}

export interface EdiGenerateDocJsonOutput {
  file_name?: string;
  doc_pks?: string[];
}

export function ediGenerateDocJson(data: EdiGenerateDocJsonInput) {
  return request<EdiGenerateDocJsonOutput>({
    url: '/edi/generate-doc-json',
    method: 'post',
    data
  });
}
