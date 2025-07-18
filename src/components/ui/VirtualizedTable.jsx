import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableSkeleton } from "./feedback/TableSkeleton"; // We'll reuse our skeleton loader

/**
 * A reusable, high-performance virtualized table component.
 * It uses divs with ARIA roles for maximum rendering flexibility and performance.
 *
 * @param {object[]} data - The array of data to render.
 * @param {object[]} columns - An array of column definitions.
 *   Each column object should have:
 *   - `header`: The string or JSX for the column header.
 *   - `accessorKey`: The key in the data object for this column.
 *   - `cell`: A render function for the cell: (info) => JSX.
 *   - `size`: The flex-grow proportion for the column (e.g., 1, 2, 3).
 * @param {boolean} isLoading - If true, shows a skeleton loader.
 * @param {React.ReactNode} emptyMessage - JSX to display when data is empty.
 */
export function VirtualizedTable({ data, columns, isLoading, emptyMessage }) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  if (isLoading) {
    return <TableSkeleton rows={10} cols={columns.length} />;
  }

  if (!data.length) {
    return <div className="p-4">{emptyMessage}</div>;
  }

  return (
    <div
      ref={parentRef}
      role="grid"
      className="h-full w-full overflow-auto border dark:border-gray-700/50 rounded-lg"
    >
      {/* Header */}
      <div
        role="rowheader"
        className="flex sticky top-0 z-10 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border-b dark:border-gray-700/50"
      >
        {columns.map((column) => (
          <div
            key={column.accessorKey}
            role="columnheader"
            className="px-4 py-3 font-semibold text-left text-gray-600 dark:text-gray-300"
            // 👇 CHANGE HERE: Use flex-basis: 0% to ensure columns align perfectly
            style={{ flex: `${column.size} 0 0%` }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Body */}
      <div
        className="relative w-full"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = data[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              role="row"
              className="flex absolute top-0 left-0 w-full items-center border-b dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {columns.map((column) => (
                <div
                  key={column.accessorKey}
                  role="gridcell"
                  className="px-4 py-2 truncate"
                  // 👇 CHANGE HERE: Use flex-basis: 0% to ensure columns align perfectly
                  style={{ flex: `${column.size} 0 0%` }}
                >
                  {column.cell({ row })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
