import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableSkeleton } from "./feedback/TableSkeleton";
import InterfaceDetailRow from "../../pages/dashboard/InterfaceDetailRow";

export function VirtualizedTable({
  data,
  columns,
  isLoading,
  emptyMessage,
  onRowClick,
  expandedRowId,
}) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    // --- 3. Estimate size based on row type ---
    // A normal row is 64px, a detail row is taller (e.g., 128px)
    estimateSize: (index) => (data[index].isDetail ? 128 : 64),
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
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowData = data[virtualRow.index];
          const isDetailRow = rowData.isDetail;

          const isSelected = rowData.id === expandedRowId;

          if (isDetailRow) {
            // The detail row should not have a hover effect, so it remains unchanged.
            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <InterfaceDetailRow interfaceData={rowData.originalData} />
              </div>
            );
          }

          const rowClasses = [
            "flex absolute top-0 left-0 w-full items-center border-b dark:border-gray-800/50 cursor-pointer",
            "transition-colors duration-150 ease-in-out",
            isSelected
              ? "bg-sky-100 dark:bg-sky-900/60" // Selected state colors
              : "hover:bg-sky-50 dark:hover:bg-sky-900/40", // Hover state colors
          ].join(" ");

          return (
            <div
              key={virtualRow.key}
              role="row"
              onClick={() => onRowClick && onRowClick(rowData.id)}
              className={rowClasses} // <-- Use the dynamic classes
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
                  style={{ flex: `${column.size} 0 0%` }}
                >
                  {column.cell({ row: rowData })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
