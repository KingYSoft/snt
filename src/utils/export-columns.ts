export interface ExportColumn {
  key: string;
  title: string;
}

export function getExportColumns(columns: readonly any[]): ExportColumn[] {
  return columns
    .filter(column => typeof column?.key === 'string' && column.key !== 'actions' && column.type !== 'selection')
    .map(column => ({
      key: String(column.key),
      title: typeof column.title === 'string' && column.title.trim() ? column.title : String(column.key)
    }));
}
