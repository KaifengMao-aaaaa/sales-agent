import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata = {
  title: "聊天应用",
  description: "左侧导航 + GPT 聊天",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex h-screen">
          {/* 左侧导航 */}
          <Sidebar />

          {/* 右侧内容 */}
          <main className="flex-1 p-4 bg-gray-50 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
