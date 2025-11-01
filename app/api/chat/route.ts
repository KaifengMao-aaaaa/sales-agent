// // app/api/chat/route.js
// import { CozeAPI, COZE_CN_BASE_URL,RoleType,ChatEventType } from '@coze/api';

// export async function POST(req) {
//   const { message } = await req.json();

//   // 初始化 SDK 客户端
//   const client = new CozeAPI({
//     baseURL: COZE_CN_BASE_URL,
//     token: process.env.COZE_API_KEY, // 你的 pat_xxx
//   });

//   const stream = await client.chat.stream({
//       bot_id: process.env.COZE_BOT_ID,
//       additional_messages: [
//         {
//           role: RoleType.User,
//           content: '你好',
//           content_type: 'text',
//         },
//       ],
//   });
//   for await (const part of stream) {
//   if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
//       process.stdout.write(part.data.content);
//     }
//   }
//   return Response.json({ messages: [{ content: '' }] });
// }

export async function POST(req: Request) {
  const { message } = await req.json();

  // 这里你可以调用 Coze SDK 或 GPT API
  const reply = `你发送了: ${message}`; // 临时模拟 AI 回复

  return new Response(
    JSON.stringify({ messages: [{ role: "assistant", content: reply }] }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
