import type { PaginationData } from "@sa/hooks";

/**
 * Transform sjc paginated response to soybean-admin PaginationData format.
 * sjc returns { items, totalCount }, useNaivePaginatedTable expects { data, pageNum, pageSize, total }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sjcTransform(
  response: any,
  params?: { pageSize: number; page?: number },
): PaginationData<any> {
  const { data, error } = response;

  if (!error && data) {
    return {
      data: data.items || [],
      pageNum: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
      total: data.totalCount || 0,
    };
  }

  return {
    data: [],
    pageNum: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
    total: 0,
  };
}

/**
 * Build sjc-style pagination params from soybean-admin page/pageSize.
 * sjc uses 0-based offset (skipCount), soybean uses 1-based page.
 */
export function buildSjcPaginationParams(page: number, pageSize: number) {
  return {
    skipCount: (page - 1) * pageSize,
    maxResultCount: pageSize,
  };
}
