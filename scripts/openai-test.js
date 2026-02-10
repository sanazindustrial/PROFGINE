const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 10000
});

(async () => {
  const start = Date.now();
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages: [{
      role: "user",
      content: "Test response: say OK"
    }],
    max_tokens: 10,
  });

  const text = res.choices?. [0]?.message?.content?.trim();
  console.log("OpenAI_OK", Date.now() - start, "ms", text || "");
})().catch((err) => {
  console.error("OpenAI_FAIL", err?.message || err);
  process.exit(1);
});
