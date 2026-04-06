/** Configuration for bidirectional field mapping between frontend and backend */
export interface FieldMappingConfig {
  /** Record<frontendKey, backendKey> for renamed fields */
  fieldMap?: Record<string, string>;
  /** Set of frontend field names that need Y/N <-> boolean conversion */
  booleanFields?: string[];
  /** Set of frontend field names that use 0/1 (is_active etc.) instead of Y/N */
  zeroOneFields?: string[];
}

/**
 * Convert backend Y/N string to frontend boolean.
 */
export function ynToBool(value: string | undefined | null): boolean {
  return value === 'Y';
}

/**
 * Convert frontend boolean to backend Y/N string.
 */
export function boolToYn(value: boolean): string {
  return value ? 'Y' : 'N';
}

/**
 * Convert backend 0/1 to frontend boolean.
 */
export function zeroOneToBool(value: number | string | undefined | null): boolean {
  return value === 1 || value === '1';
}

/**
 * Convert frontend boolean to backend 0/1.
 */
export function boolToZeroOne(value: boolean): number {
  return value ? 1 : 0;
}

/**
 * Map backend item to frontend format.
 * - Renames fields according to fieldMap (backend key -> frontend key)
 * - Converts Y/N strings to boolean for booleanFields
 */
export function mapBackendToFrontend<T = Record<string, any>>(
  item: Record<string, any>,
  config: FieldMappingConfig = {}
): T {
  const { fieldMap = {}, booleanFields = [], zeroOneFields = [] } = config;
  const reverseMap = Object.fromEntries(Object.entries(fieldMap).map(([front, back]) => [back, front]));

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(item)) {
    const frontendKey = reverseMap[key] || key;
    if (zeroOneFields.includes(frontendKey)) {
      result[frontendKey] = zeroOneToBool(value);
    } else if (booleanFields.includes(frontendKey)) {
      result[frontendKey] = ynToBool(value as string);
    } else {
      result[frontendKey] = value;
    }
  }

  return result as T;
}

/**
 * Map frontend data to backend format.
 * - Renames fields according to fieldMap (frontend key -> backend key)
 * - Converts boolean to Y/N strings for booleanFields
 */
export function mapFrontendToBackend(data: Record<string, any>, config: FieldMappingConfig = {}): Record<string, any> {
  const { fieldMap = {}, booleanFields = [], zeroOneFields = [] } = config;

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const backendKey = fieldMap[key] || key;
    if (zeroOneFields.includes(key)) {
      result[backendKey] = boolToZeroOne(value as boolean);
    } else if (booleanFields.includes(key)) {
      result[backendKey] = boolToYn(value as boolean);
    } else {
      result[backendKey] = value;
    }
  }

  return result;
}

/** Filter item for sjc API */
export interface FilterItem {
  key: string;
  op: string;
  val: string;
}

/**
 * Build filter array for sjc API.
 * Filters out items with empty val.
 */
export function buildFilterArray(filters: FilterItem[]): FilterItem[] {
  return filters.filter(f => f.val !== '' && f.val !== undefined && f.val !== null);
}
