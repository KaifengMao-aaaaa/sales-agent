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
import RightPanelWrapper from "./RightPanelWrapper";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  company: string;
  description: string;
};

interface CustomerTableProps {
  data: Customer[];
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
      style={{ top: position.top, left: position.left, maxWidth: 400 }}
      onClick={onClose}
    >
      <div>{content}</div>
      <div className="mt-2 flex space-x-2">
        <button
          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 active:scale-95 active:bg-blue-700 rounded text-white text-xs transition"
          onClick={() => navigator.clipboard.writeText(String(content))}
        >
          复制
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function CustomerTable({ data }: CustomerTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const cellRefs = useRef<{ [key: string]: HTMLTableCellElement | null }>({});

  const columnHelper = createColumnHelper<Customer>();
  const columns = data[0]
    ? Object.keys(data[0]).map((key) =>
        columnHelper.accessor(key as keyof Customer, {
          header: key,
          cell: (info) => info.getValue(),
        })
      )
    : [];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const handleCellClick = useCallback(
    (cellId: string) => {
      const cellEl = cellRefs.current[cellId];
      if (!cellEl) return;

      const rect = cellEl.getBoundingClientRect();
      const top = rect.bottom + window.scrollY;
      const left = rect.left + window.scrollX;

      setTooltipPos({ top, left });
      setActiveTooltip(activeTooltip === cellId ? null : cellId);
    },
    [activeTooltip]
  );

  const exportToCSV = useCallback(() => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => `"${String(row[h as keyof Customer] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "customer_data.csv";
    link.click();
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <RightPanelWrapper title="信息">
      <div className="h-full flex flex-col p-4 bg-white border border-gray-200 rounded-lg shadow-md">
        <div className="h-full overflow-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, idx) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-gray-700 text-sm font-medium border-b border-gray-200"
                      style={{ width: idx === headerGroup.headers.length - 1 ? "auto" : 150 }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors duration-150 hover:bg-gray-50"
                    style={{ height: "48px" }}
                  >
                    {row.getVisibleCells().map((cell) => {
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
                          className={`px-4 py-3 text-gray-800 text-sm border-b border-gray-100 relative cursor-pointer transition-all duration-150 
                            hover:bg-gray-100 hover:scale-105
                            ${activeTooltip === cellId ? "bg-blue-50 border-blue-300" : ""}`}
                          style={{
                            height: "48px",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={typeof cellValue === "string" ? cellValue : ""}
                        >
                          <div className="truncate">{cellValue}</div>

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
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center text-gray-400 py-12 border-t">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex-1" />

        {/* 分页 + 导出 */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 active:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              上一页
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 active:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              下一页
            </button>

            <button
              className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 active:bg-green-300 transition"
              onClick={exportToCSV}
            >
              导出 CSV
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
    </RightPanelWrapper>
  );
}
