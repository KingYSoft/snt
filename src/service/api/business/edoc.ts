import { request } from '@/service/request';

export interface EdocSearchInput {
  parent_table: 'SHP' | 'CON' | 'BKG' | string;
  related_key: string | number;
}

export interface EdocItem {
  id?: string | number;
  pk?: string;
  file_name?: string;
  file_type?: string;
  group_file_type?: string;
  ref_no?: string;
  remarks?: string;
  is_ebooking_visible?: number | boolean | string;
  is_publish?: number | boolean | string;
  published_by?: string;
  published_time?: string;
  received_time?: string;
  gen_edi_time?: string;
  create_user_name?: string;
  dept_code?: string;
  has_download?: number;
  has_preview?: number;
  has_gen_edi?: number;
  is_gen_edi?: number;
}

export function edocSearch(params: EdocSearchInput) {
  return request<{ list?: EdocItem[] }>({
    url: '/edoc/search',
    method: 'post',
    data: params
  });
}

export function edocSave(formData: FormData) {
  return request({
    url: '/edoc/save',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  });
}

export function edocCopy(params: { document_pk: string; file_name: string; file_type: string }) {
  return request({
    url: '/edoc/copy',
    method: 'post',
    data: params
  });
}
