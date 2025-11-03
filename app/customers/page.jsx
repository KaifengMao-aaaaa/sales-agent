import CustomerTable from "@/components/CustomerTable";

export default function CustomersPage() {
  return (
    <div className="flex">
      {/* 侧边栏如果想一直显示，可直接导入 */}
      <div className="flex-1 bg-white w-full h-full">
        <CustomerTable />
      </div>
    </div>
  );
}
