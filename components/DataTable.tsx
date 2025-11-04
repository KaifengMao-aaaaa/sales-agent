"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";

interface ColumnDef<T> {
  header: string;
  accessor: keyof T;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
}

interface TooltipProps {
  content: string | number;
  position: { top: number; left: number };
  onClose: () => void;
}

function CellTooltip({ content, position, onClose }: TooltipProps) {
  return createPortal(
    <div
      className="absolute bg-white text-black text-sm p-2 rounded shadow-lg z-50 whitespace-pre-wrap break-words border border-gray-200"
      style={{ top: position.top, left: position.left, width: 256 }}
      onClick={onClose}
    >
      <div>{content}</div>
      <div className="mt-2 flex space-x-2">
        <button
          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 active:scale-95 active:bg-blue-700 rounded text-white text-xs transition"
          onClick={() => navigator.clipboard.writeText(content.toString())}
        >
          复制
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
}: DataTableProps<T>) {
  const [pageSize, setPageSize] = useState(10);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const cellRefs = useRef<{ [key: string]: HTMLTableCellElement | null }>({});

  const columnHelper = createColumnHelper<T>();
  const tableColumns = columns.map((col) =>
    columnHelper.accessor(col.accessor, { header: col.header, cell: (info) => info.getValue() })
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const handleCellClick = useCallback((cellId: string) => {
    const cellEl = cellRefs.current[cellId];
    if (!cellEl) return;

    const rect = cellEl.getBoundingClientRect();
    let top = rect.bottom + window.scrollY;
    let left = rect.left + window.scrollX;

    const tooltipWidth = 256;
    const tooltipHeight = 100;

    if (left + tooltipWidth > window.scrollX + window.innerWidth) {
      left = window.scrollX + window.innerWidth - tooltipWidth - 8;
    }
    if (top + tooltipHeight > window.scrollY + window.innerHeight) {
      top = rect.top + window.scrollY - tooltipHeight - 8;
    }

    setTooltipPos({ top, left });
    setActiveTooltip(activeTooltip === cellId ? null : cellId);
  }, [activeTooltip]);

  return (
    <div className="flex-1 w-full h-full p-4 bg-white rounded-lg shadow-md overflow-auto">
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, idx) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-gray-700 text-sm font-normal border-b border-gray-200"
                  style={{ width: idx === headerGroup.headers.length - 1 ? "auto" : 150 }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
              {row.getVisibleCells().map((cell, idx, arr) => {
                const cellValue = flexRender(cell.column.columnDef.cell, cell.getContext());
                const cellId = `${row.id}-${cell.id}`;

                return (
                  <td
                    key={cell.id}
                    ref={(el) => (cellRefs.current[cellId] = el)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(cellId);
                    }}
                    className={`px-4 py-3 text-gray-800 text-sm border-b border-gray-100 relative cursor-pointer hover:bg-gray-100 hover:scale-105 ${
                      activeTooltip === cellId ? "bg-blue-50 border-blue-300" : ""
                    } ${idx === arr.length - 1 ? "w-full" : "min-w-[150px]"}`}
                  >
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                      {cellValue}
                    </div>

                    {activeTooltip === cellId && tooltipPos && (
                      <CellTooltip
                        content={cellValue}
                        position={tooltipPos}
                        onClose={() => setActiveTooltip(null)}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 分页控件 */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            上一页
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            下一页
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            页 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <select
            className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map((size) => (
              <option key={size} value={size}>
                {size} 条/页
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
