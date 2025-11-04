// app/api/buttons/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "buttons.json");

interface ButtonsData {
  [token: string]: any[]; // token => 按钮数组
}

/** 确保 buttons.json 存在 */
async function ensureFile() {
  try {
    await fs.access(filePath); // 文件存在就啥也不做
  } catch {
    // 文件不存在，创建目录和文件
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({}, null, 2), "utf-8");
  }
}

// ✅ 读取当前按钮配置
export async function GET(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "");
    if (!token) return NextResponse.json([], { status: 400 });

    await ensureFile();
    const data = await fs.readFile(filePath, "utf-8");
    const buttonsData: ButtonsData = JSON.parse(data);

    const buttons = buttonsData[token] || [];
    return NextResponse.json(buttons);
  } catch (err) {
    console.error("❌ 读取按钮失败：", err);
    return NextResponse.json([], { status: 200 });
  }
}

// ✅ 更新按钮配置
export async function POST(req: Request) {
  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "");
    console.log(token)
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const body = await req.json();
    if (!body || !Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid body, expected an array" }, { status: 400 });
    }

    await ensureFile();
    let buttonsData: ButtonsData = {};
    try {
      const existing = await fs.readFile(filePath, "utf-8");
      buttonsData = JSON.parse(existing);
    } catch {} // 文件为空或解析失败就当空对象

    buttonsData[token] = body;

    await fs.writeFile(filePath, JSON.stringify(buttonsData, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ 更新按钮失败：", err);
    return NextResponse.json({ error: "Failed to update buttons" }, { status: 500 });
  }
}
