export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        菜单
      </div>
      <nav className="flex-1 p-2 space-y-2">
        <button className="w-full text-left p-2 rounded hover:bg-gray-700">
          GPT 聊天
        </button>
        <button className="w-full text-left p-2 rounded hover:bg-gray-700">
          功能二
        </button>
        <button className="w-full text-left p-2 rounded hover:bg-gray-700">
          功能三
        </button>
      </nav>
    </aside>
  );
}
