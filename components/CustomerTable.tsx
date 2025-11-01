"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { FiArrowLeft } from "react-icons/fi";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  company: string;
  description: string;
};

const defaultData: Customer[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  phone: `123-456-${(1000 + i).toString().padStart(4, "0")}`,
  city: `City ${i + 1}`,
  company: `Company ${i + 1}`,
  description: `这是一个非常长的描述文本，用于测试表格的横向滚动效果。第 ${i + 1} 条数据，包含很多细节信息，可能会超出表格宽度，需要点击查看完整内容。`,
}));

export default function CustomerTable() {
  const [data] = useState(defaultData);
  const [pageSize, setPageSize] = useState(10);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const cellRefs = useRef<{ [key: string]: HTMLTableCellElement | null }>({});

  const columnHelper = createColumnHelper<Customer>();
  const columns = [
    columnHelper.accessor("id", { header: "ID", cell: (info) => info.getValue() }),
    columnHelper.accessor("name", { header: "姓名", cell: (info) => info.getValue() }),
    columnHelper.accessor("email", { header: "邮箱", cell: (info) => info.getValue() }),
    columnHelper.accessor("phone", { header: "电话", cell: (info) => info.getValue() }),
    columnHelper.accessor("city", { header: "城市", cell: (info) => info.getValue() }),
    columnHelper.accessor("company", { header: "公司", cell: (info) => info.getValue() }),
    columnHelper.accessor("description", { header: "描述", cell: (info) => info.getValue() }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const handleCellClick = (cellId: string) => {
    const cellEl = cellRefs.current[cellId];
    if (cellEl) {
      const rect = cellEl.getBoundingClientRect();
      let top = rect.bottom + window.scrollY;
      let left = rect.left + window.scrollX;

      // 避免 tooltip 超出屏幕右边
      const tooltipWidth = 256;
      if (left + tooltipWidth > window.scrollX + window.innerWidth) {
        left = window.scrollX + window.innerWidth - tooltipWidth - 8;
      }

      // 避免 tooltip 超出屏幕底部
      const tooltipHeight = 100;
      if (top + tooltipHeight > window.scrollY + window.innerHeight) {
        top = rect.top + window.scrollY - tooltipHeight - 8;
      }

      setTooltipPos({ top, left });
    }
    setActiveTooltip(activeTooltip === cellId ? null : cellId);
  };

  return (
    <div className="h-screen w-full flex flex-col p-2 bg-gray-50">
      {/* 顶部退出箭头 */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 mr-2 rounded-full hover:bg-gray-200 cursor-pointer transition"
        >
          <FiArrowLeft className="text-lg text-gray-700" />
        </button>
        <h1 className="text-lg font-medium">返回聊天</h1>
      </div>

      {/* 表格区 */}
      <div className="flex-1 w-full p-2 rounded-lg shadow-md bg-white border border-gray-200 overflow-auto">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, idx) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-gray-700 text-sm font-normal border-b border-gray-200`}
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
              <tr key={row.id} className="transition-colors duration-150 hover:bg-gray-50">
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
                      className={`px-4 py-3 text-gray-800 text-sm border-b border-gray-100 relative cursor-pointer transition-all duration-150
                        hover:bg-gray-100 hover:scale-105
                        ${activeTooltip === cellId ? "bg-blue-50 border-blue-300" : ""}
                        ${idx === arr.length - 1 ? "w-full" : "min-w-[150px]"}`}
                    >
                      <div className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                        {cellValue}
                      </div>

                      {/* Tooltip */}
                      {activeTooltip === cellId && tooltipPos &&
                        createPortal(
                          <div
                            className="absolute bg-white text-black text-sm p-2 rounded shadow-lg z-50 whitespace-pre-wrap break-words border border-gray-200"
                            style={{ top: tooltipPos.top, left: tooltipPos.left, width: 256 }}
                          >
                            <div>{cellValue}</div>
                            <div className="mt-2 flex space-x-2">
                              <button
                                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 active:scale-95 active:bg-blue-700 rounded text-white text-xs transition"
                                onClick={() => navigator.clipboard.writeText(cellValue.toString())}
                              >
                                复制
                              </button>
                            </div>
                          </div>,
                          document.body
                        )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页栏 */}
      <div className="mt-4 flex items-center justify-between">
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
