export async function POST(req: Request) {
  const { message } = await req.json();
  const COZE_TOKEN = process.env.COZE_API_KEY!;
  const BOT_ID = process.env.COZE_BOT_ID!;
  const BASE_URL = 'https://api.coze.cn/v3';

  // 直接返回一个流式 Response
  const cozeRes = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${COZE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bot_id: BOT_ID,
      user_id: 'user-123',
      stream: true,
      additional_messages: [
        {
          role: 'user',
          content: message,
          type: 'question',
          content_type: 'text',
        },
      ],
    }),
  });
  console.log(cozeRes)
  // 创建一个可读流，逐行转发 Coze 的输出
  const stream = new ReadableStream({
    async start(controller) {
      const reader = cozeRes.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        controller.error('No stream found in response');
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          controller.enqueue(chunk);
        }
      } catch (err) {
        console.error('读取流失败', err);
      } finally {
        controller.close();
      }
    },
  });

  // 设置返回头，告诉前端这是一个流式事件流
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
