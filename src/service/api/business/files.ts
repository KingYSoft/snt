import { request } from '@/service/request';

export const FILE_DOCUMENT_SOURCE = {
  job: 'JOB_DOC',
  warehouse: 'WHS_DOC',
  generatedEdi: 'GEN_EDI'
} as const;

export type FileDocumentSource = (typeof FILE_DOCUMENT_SOURCE)[keyof typeof FILE_DOCUMENT_SOURCE];

export interface FileDocumentReference {
  document_source: FileDocumentSource | string;
  document_pk: string;
}

export async function downloadFile(params: FileDocumentReference, signal?: AbortSignal) {
  const response = await request<Blob, 'blob'>({
    url: '/files/download',
    method: 'post',
    data: params,
    responseType: 'blob',
    signal
  });
  if (response.error || !response.data) throw response.error || new Error('Download failed');
  return response.data;
}

export async function previewFile(params: FileDocumentReference, signal?: AbortSignal) {
  const response = await request<Blob, 'blob'>({
    url: '/files/preview',
    method: 'get',
    params,
    responseType: 'blob',
    signal
  });
  if (response.error || !response.data) throw response.error || new Error('Preview failed');
  return response.data;
}
