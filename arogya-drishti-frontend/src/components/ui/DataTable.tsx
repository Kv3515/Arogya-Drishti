'use client';

import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => ReactNode;    // slide-in on row hover
  emptyMessage?: string;
  loading?: boolean;
  loadingRows?: number;                  // number of skeleton rows, default 5
  className?: string;
  /** Optional: highlight row based on condition */
  rowClassName?: (row: T) => string;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="table-td">
          <div
            className="skeleton h-3 rounded"
            style={{ width: `${55 + (i * 17) % 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  rowActions,
  emptyMessage = 'No records found.',
  loading = false,
  loadingRows = 5,
  className = '',
  rowClassName,
}: DataTableProps<T>) {
  const totalCols = columns.length + (rowActions ? 1 : 0);

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="table-th"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
            {rowActions && (
              <th className="table-th w-24 text-right">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <SkeletonRow key={i} cols={totalCols} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={totalCols}
                className="table-td text-center text-slate-400 py-12"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = String(row[keyField]);
              const extraClass = rowClassName?.(row) ?? '';

              return (
                <tr
                  key={rowKey}
                  className={`table-row group ${extraClass} ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="table-td">
                      {col.render(row, rowIndex)}
                    </td>
                  ))}

                  {rowActions && (
                    <td className="table-td text-right">
                      {/* Slide in from right on row hover — uses Tailwind group-hover */}
                      <div
                        className="
                          flex items-center justify-end gap-1
                          opacity-0 translate-x-2
                          group-hover:opacity-100 group-hover:translate-x-0
                          transition-all duration-200
                        "
                      >
                        {rowActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
