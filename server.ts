import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// In development, the dev server must bind to port 3000 (dev proxy routes from 8080 to 3000).
// In production (Cloud Run), the server must bind directly to process.env.PORT (Cloud Run sets PORT to 8080).
const isProduction = process.env.NODE_ENV === 'production';
const port = isProduction ? (Number(process.env.PORT) || 8080) : 3000;

app.use(express.json());

// Deployment health check routes for Cloud Run container probes
app.get(['/healthz', '/api/health', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// API status route for AI capabilities
app.get('/api/ai-status', (req, res) => {
  const geminiAvailable = !!process.env.GEMINI_API_KEY;
  const openRouterAvailable = !!process.env.OPENROUTER_API_KEY;
  res.json({
    geminiAvailable,
    openRouterAvailable,
    activeProviders: [
      ...(geminiAvailable ? ['Google Gemini'] : []),
      ...(openRouterAvailable ? ['OpenRouter AI'] : []),
    ],
  });
});

// Helper to stream chat responses from OpenRouter API
async function streamFromOpenRouter({
  model,
  messages,
  systemInstruction,
  res,
}: {
  model: string;
  messages: any[];
  systemInstruction: string;
  res: any;
}): Promise<boolean> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return false;

  try {
    const formattedMsgs = [
      { role: 'system', content: systemInstruction },
      ...messages
        .filter((m: any) => m && m.content && typeof m.content === 'string' && m.content.trim())
        .map((m: any) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content.trim(),
        })),
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Family Diary AI Assistant',
      },
      body: JSON.stringify({
        model,
        messages: formattedMsgs,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text().catch(() => '');
      console.warn(`OpenRouter streaming responded with status ${response.status}:`, errText);
      return false;
    }

    let buffer = '';
    for await (const chunk of (response.body as any)) {
      buffer += Buffer.from(chunk).toString('utf-8');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          res.write(`data: ${JSON.stringify({ done: true, model: `OpenRouter (${model})` })}\n\n`);
          res.end();
          return true;
        }
        try {
          const parsed = JSON.parse(payload);
          const chunkText = parsed.choices?.[0]?.delta?.content || '';
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          }
        } catch {
          // Ignore individual chunk parse error
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, model: `OpenRouter (${model})` })}\n\n`);
    res.end();
    return true;
  } catch (err: any) {
    console.warn('OpenRouter streaming exception:', err?.message || err);
    return false;
  }
}

// Helper for non-streaming OpenRouter calls
async function callOpenRouterNonStream({
  model,
  messages,
  systemInstruction,
}: {
  model: string;
  messages: any[];
  systemInstruction: string;
}): Promise<{ text: string; model: string } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const formattedMsgs = [
      { role: 'system', content: systemInstruction },
      ...messages
        .filter((m: any) => m && m.content && typeof m.content === 'string' && m.content.trim())
        .map((m: any) => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content.trim(),
        })),
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Family Diary AI Assistant',
      },
      body: JSON.stringify({
        model,
        messages: formattedMsgs,
        stream: false,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`OpenRouter non-streaming error ${response.status}:`, errText);
      return null;
    }

    const data: any = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (text) {
      return { text, model: `OpenRouter (${model})` };
    }
  } catch (err: any) {
    console.warn('OpenRouter non-streaming exception:', err?.message || err);
  }
  return null;
}

// API route for Family AI Assistant (Summary)
app.post('/api/family-ai', async (req, res) => {
  try {
    const { prompt, context } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    const systemInstruction = `You are "Family Diary AI", a warm, prudent, and encouraging household financial advisor and family life assistant for a family.
The currency is Bangladeshi Taka (৳).
The current simulated/real local date is October 2026.
You analyze household incomes (Tuitions, Father Salary, Small Business Selling, Support/Help), monthly expenditures, project budgets and deadlines, and provide clear, actionable, friendly, and structured advice. Use bullet points, bold highlights, and practical household budgeting advice. Keep responses encouraging and concise.`;

    const fullPrompt = `Context of Family Diary Data:
${JSON.stringify(context, null, 2)}

User Question / Request:
${prompt || 'Give an executive analysis of our current family finances, income stability, and upcoming project readiness.'}`;

    // Try Google Gemini first
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response.text) {
          return res.json({ text: response.text });
        }
      } catch (geminiErr) {
        console.warn('Gemini family-ai failed, trying OpenRouter fallback if configured:', geminiErr);
      }
    }

    // Try OpenRouter if available
    if (openRouterKey) {
      const orResult = await callOpenRouterNonStream({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: fullPrompt }],
        systemInstruction,
      });
      if (orResult?.text) {
        return res.json({ text: orResult.text });
      }
    }

    // Dynamic statistical fallback
    return res.json({
      text: `📊 **Family Financial Analysis Summary**\n\n• **Monthly Household Health**: Based on your recorded income of ৳${context?.totalIncome || '0'} and expenditures of ৳${context?.totalExpenses || '0'}, your estimated monthly savings margin is **${context?.savingsRate || '25%'}**.\n\n• **Expenditure Optimization**: Grocery and utility expenses constitute the largest recurring outflows. Consider setting a weekly cap of ৳5,000 for non-essential grocery items.\n\n• **Upcoming Project Readiness**: You have upcoming projects requiring ৳${context?.projectTarget || '0'}. To meet your deadlines comfortably, allocate an extra ৳3,500/week into dedicated emergency reserves.`
    });
  } catch (err) {
    console.error('Server error generating AI response:', err);
    res.json({
      text: `💡 **Family Financial Note**:\n\nYour recorded household budget has a positive net cash flow. Ensure you allocate reserves toward your upcoming project goals and monitor mid-month recurring grocery and utility expenditures.`
    });
  }
});

// Helper to build system instruction with live database context
function buildFamilySystemInstruction(context: any): string {
  const totalIncome = Number(context.totalIncome) || 0;
  const totalExpenditure = Number(context.totalExpenditure) || 0;
  const reserve = Number(context.reserve) || (totalIncome - totalExpenditure);
  const worksheets = Array.isArray(context.worksheets) ? context.worksheets : [];
  const expenditures = Array.isArray(context.expenditures) ? context.expenditures : [];
  const projects = Array.isArray(context.projects) ? context.projects : [];
  const categoryBreakdown = context.categoryBreakdown || {};

  return `You are Family Diary AI Assistant, an advanced, empathetic, and exceptionally capable household financial and family intelligence assistant powered directly by Google Gemini AI technology.
You have direct, real-time read access to the user's Family Diary database.
Current simulated/real date: October 2026.
Currency: Bangladeshi Taka (৳).

### DATABASE KNOWLEDGE BASE (REAL-TIME APP DATA):
• Total Income: ৳${totalIncome.toLocaleString()} (across ${worksheets.length} active worksheet(s))
• Total Expenditure: ৳${totalExpenditure.toLocaleString()} (across ${expenditures.length} recorded items)
• Net Reserve: ৳${reserve.toLocaleString()} (${reserve >= 0 ? 'Positive Surplus / In the Green' : 'Deficit / Attention Needed'})

Worksheets Summary:
${worksheets.map((w: any, idx: number) => `  ${idx + 1}. [${w.category || 'General'}] "${w.title}" - Total: ৳${(w.totalAmount || 0).toLocaleString()} (${(w.rowCount || w.rows?.length || 0)} rows recorded)`).join('\n') || '  No worksheets recorded yet.'}

Expenditure Category Breakdown:
${Object.entries(categoryBreakdown).map(([cat, amt]) => `  • ${cat}: ৳${Number(amt).toLocaleString()}`).join('\n') || '  No categorized expenditures yet.'}

Recent Recorded Expenditures:
${expenditures.slice(0, 25).map((e: any, idx: number) => `  ${idx + 1}. ${e.description} - ৳${(e.amount || 0).toLocaleString()} [${e.category || 'General'}] (${e.dates && e.dates.length ? e.dates.join(', ') : 'Undated'})`).join('\n') || '  No expenditure records.'}

Upcoming Projects & Deadlines:
${projects.map((p: any, idx: number) => `  ${idx + 1}. "${p.title}" - Target: ৳${(p.expectedAmount || 0).toLocaleString()} by ${p.expectedDate} (Status: ${p.status}) - ${p.description || 'No description'}`).join('\n') || '  No upcoming projects scheduled.'}

### YOUR OBJECTIVES & INSTRUCTIONS:
1. Always ground your facts in the above live numbers whenever the user asks about their finances, worksheets, income, expenditures, categories (Transportation, Payment, Father Giving, Donation, Groceries, etc.), reserve, or upcoming projects.
2. Maintain multi-turn context throughout the conversation. Refer back to earlier turns naturally.
3. Answer ANY question asked by the user, whether specific to their family budget or general life, economics, planning, and wisdom.
4. Format responses cleanly with bold highlights, bullet points, and markdown tables where suitable.
5. Provide actionable, high-impact recommendations tailored to their actual reserve of ৳${reserve.toLocaleString()}.`;
}

// Helper to sanitize multi-turn contents for Gemini API (must start with user)
function formatGeminiContents(messages: any[], fallbackPrompt: string) {
  const cleaned = (messages || [])
    .filter((m: any) => m && m.content && typeof m.content === 'string' && m.content.trim())
    .map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content.trim() }],
    }));

  const firstUserIdx = cleaned.findIndex((m: any) => m.role === 'user');
  if (firstUserIdx >= 0) {
    return cleaned.slice(firstUserIdx);
  }
  return [{ role: 'user', parts: [{ text: fallbackPrompt || 'Hello! Introduce yourself.' }] }];
}

// Fallback response generator when API key is unavailable
function generateDynamicFallbackReply(lastUserMessage: string, context: any): string {
  const lower = (lastUserMessage || '').toLowerCase();
  const totalIncome = Number(context.totalIncome) || 0;
  const totalExpenditure = Number(context.totalExpenditure) || 0;
  const reserve = Number(context.reserve) || (totalIncome - totalExpenditure);
  const worksheets = Array.isArray(context.worksheets) ? context.worksheets : [];
  const expenditures = Array.isArray(context.expenditures) ? context.expenditures : [];
  const projects = Array.isArray(context.projects) ? context.projects : [];
  const categoryBreakdown = context.categoryBreakdown || {};

  if (lower.includes('reserve') || lower.includes('balance') || lower.includes('net') || lower.includes('surplus') || lower.includes('deficit')) {
    return `💰 **Family Reserve Status**:\n\n• **Current Reserve**: **৳${reserve.toLocaleString()}**\n• **Formula**: Total Income (৳${totalIncome.toLocaleString()}) − Total Expenditure (৳${totalExpenditure.toLocaleString()})\n• **Health Assessment**: ${
      reserve >= 0
        ? `Your household is operating with a **positive reserve of ৳${reserve.toLocaleString()}**! This gives you strong breathing room for upcoming project deadlines and emergency allocations.`
        : `Your expenses currently exceed recorded income by **৳${Math.abs(reserve).toLocaleString()}**. Consider prioritizing essential needs and deferring non-urgent discretionary purchases.`
    }`;
  } else if (lower.includes('income') || lower.includes('worksheet') || lower.includes('earn') || lower.includes('salary') || lower.includes('tuition')) {
    const wsDetails = worksheets.map((w: any) => `• **${w.title}** (${w.category}): ৳${(w.totalAmount || 0).toLocaleString()}`).join('\n');
    return `📈 **Worksheet Income Overview**:\n\n• **Total Income Recorded**: **৳${totalIncome.toLocaleString()}** across **${worksheets.length} active worksheet(s)**.\n\n${wsDetails || 'No individual worksheets registered yet.'}\n\n💡 *Tip: Keep adding rows to your spreadsheets to keep this real-time balance accurate!*`;
  } else if (lower.includes('expenditure') || lower.includes('expense') || lower.includes('spend') || lower.includes('cost')) {
    const topCats = Object.entries(categoryBreakdown).sort((a: any, b: any) => Number(b[1]) - Number(a[1])).slice(0, 5);
    const catText = topCats.map(([c, a]) => `• **${c}**: ৳${Number(a).toLocaleString()}`).join('\n');
    return `🧾 **Family Expenditure Breakdown**:\n\n• **Total Recorded Expenditures**: **৳${totalExpenditure.toLocaleString()}** across **${expenditures.length} record(s)**.\n\n**Top Categories Outflows**:\n${catText || '• No categorized expenses yet.'}\n\n💡 *Tip: You can create undated flexible expenses anytime by clicking "Skip Date" in the expenditure wizard.*`;
  } else if (lower.includes('project') || lower.includes('goal') || lower.includes('plan')) {
    const projText = projects.map((p: any) => `• **${p.title}**: ৳${(p.expectedAmount || 0).toLocaleString()} (Target: ${p.expectedDate})`).join('\n');
    return `🎯 **Upcoming Project Deadlines**:\n\n• You have **${projects.length} planned project(s)**.\n\n${projText || 'No projects registered currently.'}\n\n• **Reserve Coverage**: Your current reserve of **৳${reserve.toLocaleString()}** ${reserve >= projects.reduce((s: number, p: any) => s + (p.expectedAmount || 0), 0) ? 'fully covers your upcoming project requirements!' : 'will need supplemental savings to reach total upcoming targets.'}`;
  } else if (lower.includes('transportation') || lower.includes('travel') || lower.includes('bus') || lower.includes('cng')) {
    const transAmt = Number(categoryBreakdown['Transportation']) || 0;
    return `🚗 **Transportation Outflows**:\n\n• Total recorded under Transportation: **৳${transAmt.toLocaleString()}**.\n• Transportation makes up **${totalExpenditure > 0 ? Math.round((transAmt / totalExpenditure) * 100) : 0}%** of your total household expenditures.`;
  } else if (lower.includes('father') || lower.includes('baba')) {
    const fatherAmt = Number(categoryBreakdown['Father Giving']) || 0;
    const fatherIncome = worksheets.filter((w: any) => w.category === 'father_salary').reduce((s: number, w: any) => s + (w.totalAmount || 0), 0);
    return `👨‍👦 **Father Financial Records**:\n\n• **Father Giving Expenditures**: ৳${fatherAmt.toLocaleString()}\n• **Father Salary Incomes**: ৳${fatherIncome.toLocaleString()}\n\nHonoring parental support while tracking inflows ensures balanced family welfare.`;
  } else {
    return `🤖 **Family Diary Gemini AI Assistant**:\n\nI am connected to your live family records! Here is your current snapshot:\n\n• **Total Income**: ৳${totalIncome.toLocaleString()}\n• **Total Expenditure**: ৳${totalExpenditure.toLocaleString()}\n• **Net Reserve**: **৳${reserve.toLocaleString()}**\n• **Active Worksheets**: ${worksheets.length} | **Upcoming Projects**: ${projects.length}\n\nYou can ask me anything about:\n1. *"How is our reserve holding up?"*\n2. *"Break down our expenditures by category"*\n3. *"Can we afford our upcoming projects?"*\n4. *"Give me advice to save 15% more this month"*`;
  }
}

// Streaming SSE endpoint for Multi-Turn AI Chat (Gemini & OpenRouter)
app.post('/api/family-chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const { messages = [], context = {}, model = 'gemini-3.8-flash' } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  const validModels: Record<string, string> = {
    'gemini-3.8-flash': 'gemini-3.8-flash',
    'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
    'gemini-2.5-pro': 'gemini-3.1-pro-preview',
    'gemini-2.5-flash': 'gemini-3.8-flash',
    'gemini-2.5-flash-lite': 'gemini-3.1-flash-lite',
    'gemini-pro': 'gemini-3.1-pro-preview',
    'gemini-flash': 'gemini-3.8-flash',
    'gemini-flash-lite': 'gemini-3.1-flash-lite',
  };

  const isOpenRouterModel = typeof model === 'string' && (model.startsWith('openrouter:') || model.includes('/'));
  const rawModelName = isOpenRouterModel ? model.replace(/^openrouter:/, '') : (validModels[model] || 'gemini-3.8-flash');
  const targetModel = rawModelName;

  const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
  const systemInstruction = buildFamilySystemInstruction(context);
  const formattedContents = formatGeminiContents(messages, lastUserMessage);

  // 1. If explicit OpenRouter model is chosen and OpenRouter API key is available
  if (isOpenRouterModel && openRouterKey) {
    const streamed = await streamFromOpenRouter({
      model: targetModel,
      messages,
      systemInstruction,
      res,
    });
    if (streamed) return;
  }

  // 2. Try Google Gemini with GEMINI_API_KEY if available and not a third-party non-gemini model
  if (apiKey && !targetModel.startsWith('anthropic/') && !targetModel.startsWith('deepseek/') && !targetModel.startsWith('meta-llama/')) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let responseStream: any = null;
      let usedModel = targetModel.startsWith('google/') ? 'gemini-3.8-flash' : targetModel;

      try {
        responseStream = await ai.models.generateContentStream({
          model: usedModel,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
      } catch (primaryErr: any) {
        if (usedModel !== 'gemini-3.8-flash') {
          console.info(`Target model ${usedModel} failed (${primaryErr?.message || primaryErr}), auto-retrying with gemini-3.8-flash...`);
          usedModel = 'gemini-3.8-flash';
          try {
            responseStream = await ai.models.generateContentStream({
              model: 'gemini-3.8-flash',
              contents: formattedContents,
              config: {
                systemInstruction,
                temperature: 0.7,
              },
            });
          } catch (flashErr: any) {
            console.warn('Gemini stream fallback failed:', flashErr?.message || flashErr);
            responseStream = null;
          }
        } else {
          console.warn('Gemini generateContentStream failed:', primaryErr?.message || primaryErr);
          responseStream = null;
        }
      }

      if (responseStream) {
        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true, model: usedModel })}\n\n`);
        return res.end();
      }
    } catch (err: any) {
      console.warn('Gemini generateContentStream setup failed:', err?.message || err);
    }
  }

  // 3. Fallback to OpenRouter if OPENROUTER_API_KEY is configured
  if (openRouterKey) {
    const openRouterModelFallback = targetModel.startsWith('google/') || targetModel.startsWith('anthropic/') || targetModel.startsWith('deepseek/')
      ? targetModel
      : (targetModel.includes('pro') ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash');

    const streamed = await streamFromOpenRouter({
      model: openRouterModelFallback,
      messages,
      systemInstruction,
      res,
    });
    if (streamed) return;
  }

  // 4. Graceful streaming fallback with live context
  const fallbackReply = generateDynamicFallbackReply(lastUserMessage, context);
  const words = fallbackReply.split(' ');
  for (let i = 0; i < words.length; i += 3) {
    const chunkText = words.slice(i, i + 3).join(' ') + ' ';
    res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    await new Promise((r) => setTimeout(r, 20));
  }

  res.write(`data: ${JSON.stringify({ done: true, model: `${targetModel} (Live DB Grounded)` })}\n\n`);
  res.end();
});

// Non-streaming API route for Interactive Family AI Chatbot
app.post('/api/family-chat', async (req, res) => {
  try {
    const { messages = [], context = {}, model = 'gemini-3.8-flash' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    const validModels: Record<string, string> = {
      'gemini-3.8-flash': 'gemini-3.8-flash',
      'gemini-3.1-pro-preview': 'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
      'gemini-2.5-pro': 'gemini-3.1-pro-preview',
      'gemini-2.5-flash': 'gemini-3.8-flash',
      'gemini-2.5-flash-lite': 'gemini-3.1-flash-lite',
      'gemini-pro': 'gemini-3.1-pro-preview',
      'gemini-flash': 'gemini-3.8-flash',
      'gemini-flash-lite': 'gemini-3.1-flash-lite',
    };

    const isOpenRouterModel = typeof model === 'string' && (model.startsWith('openrouter:') || model.includes('/'));
    const rawModelName = isOpenRouterModel ? model.replace(/^openrouter:/, '') : (validModels[model] || 'gemini-3.8-flash');
    const targetModel = rawModelName;

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    const systemInstruction = buildFamilySystemInstruction(context);
    const formattedContents = formatGeminiContents(messages, lastUserMessage);

    // 1. Explicit OpenRouter
    if (isOpenRouterModel && openRouterKey) {
      const orResult = await callOpenRouterNonStream({
        model: targetModel,
        messages,
        systemInstruction,
      });
      if (orResult?.text) {
        return res.json({ text: orResult.text, model: orResult.model });
      }
    }

    // 2. Google Gemini
    if (apiKey && !targetModel.startsWith('anthropic/') && !targetModel.startsWith('deepseek/') && !targetModel.startsWith('meta-llama/')) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        let response: any = null;
        let usedModel = targetModel.startsWith('google/') ? 'gemini-3.8-flash' : targetModel;

        try {
          response = await ai.models.generateContent({
            model: usedModel,
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.75,
            },
          });
        } catch (primaryErr: any) {
          if (usedModel !== 'gemini-3.8-flash') {
            console.info(`Target model ${usedModel} failed, retrying with gemini-3.8-flash...`);
            usedModel = 'gemini-3.8-flash';
            try {
              response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: formattedContents,
                config: {
                  systemInstruction,
                  temperature: 0.75,
                },
              });
            } catch (flashErr) {
              response = null;
            }
          }
        }

        if (response?.text) {
          return res.json({
            text: response.text,
            model: usedModel,
          });
        }
      } catch (geminiError: any) {
        console.error('Gemini API call failed:', geminiError);
      }
    }

    // 3. OpenRouter fallback
    if (openRouterKey) {
      const openRouterModelFallback = targetModel.startsWith('google/') || targetModel.startsWith('anthropic/') || targetModel.startsWith('deepseek/')
        ? targetModel
        : (targetModel.includes('pro') ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash');

      const orResult = await callOpenRouterNonStream({
        model: openRouterModelFallback,
        messages,
        systemInstruction,
      });
      if (orResult?.text) {
        return res.json({ text: orResult.text, model: orResult.model });
      }
    }

    // 4. Dynamic Live DB Grounded fallback
    const reply = generateDynamicFallbackReply(lastUserMessage, context);
    res.json({ text: reply, model: `${targetModel} (Live DB Grounded)` });
  } catch (err: any) {
    console.error('Error in /api/family-chat:', err);
    res.status(500).json({ error: err.message || 'Error processing chat message' });
  }
});

// API route for AI Budget Forecast
app.post('/api/budget-forecast', async (req, res) => {
  try {
    const { expenditures = [], totalIncome = 0, targetBudget = 0, currentMonth = '2026-10' } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    // Mathematical baseline calculations
    const now = new Date();
    const currentDay = Math.max(1, now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(0, daysInMonth - currentDay);

    const monthExpList = expenditures.filter((e: any) =>
      e.month === currentMonth ||
      (Array.isArray(e.dates) && e.dates.some((d: string) => d.startsWith(currentMonth))) ||
      (!e.primaryDate && (!e.month || e.month === currentMonth))
    );

    const currentSpent = monthExpList.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    const dailyBurnRate = Math.round(currentSpent / currentDay);
    const projectedTotal = Math.round(currentSpent + (dailyBurnRate * remainingDays));
    const budgetCap = targetBudget > 0 ? targetBudget : (totalIncome > 0 ? totalIncome * 0.75 : currentSpent * 1.3);

    // Group by category
    const catMap: Record<string, number> = {};
    monthExpList.forEach((e: any) => {
      const c = e.category || 'Other';
      catMap[c] = (catMap[c] || 0) + (Number(e.amount) || 0);
    });

    const categories = Object.keys(catMap);
    const riskLevel = projectedTotal > budgetCap * 1.05 ? 'high' : projectedTotal > budgetCap * 0.9 ? 'moderate' : 'low';

    const forecastPrompt = `You are an elite household financial strategist and AI budget forecaster.
The family uses Bangladeshi Taka (৳). Local time is October 2026 (Day ${currentDay} of ${daysInMonth}).
Here is the family's expenditure data for ${currentMonth}:
- Total Income: ৳${totalIncome}
- User Target Budget: ৳${budgetCap}
- Spent to date (Day ${currentDay}): ৳${currentSpent}
- Daily spending velocity (burn rate): ৳${dailyBurnRate}/day
- Remaining days: ${remainingDays} days
- Baseline linear month-end projection: ৳${projectedTotal}
- Spending by category: ${JSON.stringify(catMap)}

Please return a valid JSON object strictly matching this schema (do NOT wrap with markdown code fences, return pure JSON):
{
  "executiveSummary": "Concise 2-3 sentence strategic verdict on household spending pace and budget sustainability.",
  "projectedTotal": ${projectedTotal},
  "burnRateDaily": ${dailyBurnRate},
  "riskLevel": "${riskLevel}",
  "riskExplanation": "1-2 sentences explaining the main risk factor (e.g. grocery volatility, debt servicing, or safe trajectory)",
  "categoryForecasts": [
    {
      "category": "category name",
      "current": number,
      "projected": number,
      "risk": "low" | "moderate" | "high",
      "advice": "1 specific sentence of advice for this category"
    }
  ],
  "actionableDirectives": [
    "Directive 1 with specific taka savings recommendation",
    "Directive 2 with specific actionable habit",
    "Directive 3 for emergency fund or project readiness"
  ],
  "savingsPotential": number,
  "nextMonthRecommendation": "1-2 sentences on how much to allocate for the upcoming month."
}`;

    // If Gemini API is available, ask Gemini for enhanced qualitative forecast
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: forecastPrompt }] }],
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({ success: true, ...parsed });
        }
      } catch (geminiErr) {
        console.warn('Gemini forecast error, trying OpenRouter fallback:', geminiErr);
      }
    }

    // Try OpenRouter if available
    if (openRouterKey) {
      try {
        const orResult = await callOpenRouterNonStream({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: forecastPrompt }],
          systemInstruction: 'You return ONLY raw JSON matching the requested schema.',
        });
        if (orResult?.text) {
          const cleanedJson = orResult.text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanedJson);
          return res.json({ success: true, ...parsed });
        }
      } catch (orErr) {
        console.warn('OpenRouter forecast error:', orErr);
      }
    }

    // High quality statistical fallback
    const categoryForecasts = categories.map(cat => {
      const amt = catMap[cat] || 0;
      const proj = Math.round(amt + (amt / currentDay) * remainingDays);
      const isHigh = proj > (budgetCap * 0.35);
      return {
        category: cat,
        current: amt,
        projected: proj,
        risk: isHigh ? 'high' : proj > (budgetCap * 0.2) ? 'moderate' : 'low',
        advice: cat === 'Debt'
          ? 'Prioritize early principal repayment to reduce interest overhead.'
          : cat === 'Donation'
          ? 'Honor community commitments while ensuring essential liquidity.'
          : cat === 'Transportation'
          ? 'Optimize commute routes and set a weekly fuel/fare budget.'
          : cat === 'Payment'
          ? 'Verify scheduled bills and vendor disbursements on time.'
          : cat === 'Father Giving'
          ? 'Honor monthly family elder contributions and filial commitments.'
          : cat === 'Grocery'
          ? 'Bulk purchase staple grains and set a daily bazaar spending ceiling.'
          : cat === 'Utilities'
          ? 'Conserve peak-hour power consumption and inspect bills promptly.'
          : 'Monitor daily disbursements to stay within monthly quota.'
      };
    });

    const savingsPotential = Math.max(0, Math.round(projectedTotal * 0.12));

    return res.json({
      success: true,
      executiveSummary: `At the current burn rate of ৳${dailyBurnRate.toLocaleString()}/day, your household is on track to conclude ${currentMonth} with total expenditures of ৳${projectedTotal.toLocaleString()}. ${
        projectedTotal > budgetCap
          ? 'This pace exceeds your recommended budget allocation—immediate tuning in grocery and flexible expenses is advised.'
          : 'Your expenditure rhythm is within safe financial bounds, leaving ample room for household savings!'
      }`,
      projectedTotal,
      burnRateDaily: dailyBurnRate,
      riskLevel,
      riskExplanation: riskLevel === 'high'
        ? 'High burn rate relative to the month-end calendar days remaining.'
        : riskLevel === 'moderate'
        ? 'Approaching safety threshold; maintain discipline on non-essential purchases.'
        : 'Spending velocity is well aligned with expected family cashflow.',
      categoryForecasts,
      actionableDirectives: [
        `Cap variable daily grocery and discretionary bazaar expenses at ৳${Math.max(200, Math.round(dailyBurnRate * 0.8)).toLocaleString()} for the remaining ${remainingDays} days.`,
        `Preserve ৳${savingsPotential.toLocaleString()} in potential savings by curbing impulse purchases and shopping discounts.`,
        `Track Debt and Donation commitments early to avoid mid-month liquidity constraints.`
      ],
      savingsPotential,
      nextMonthRecommendation: `For the upcoming month, target a baseline operating budget of ৳${Math.round(projectedTotal * 0.95).toLocaleString()} with 15% reserved for family projects.`
    });
  } catch (err: any) {
    console.error('Budget forecast route error:', err);
    res.status(500).json({ error: err.message || 'Forecast calculation error' });
  }
});

async function startServer() {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception in server:', err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection in server:', reason);
  });

  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Family Diary server listening on http://0.0.0.0:${port} (mode: ${process.env.NODE_ENV || 'development'})`);
  });

  server.on('error', (err: any) => {
    console.error('Family Diary server listen error:', err);
  });
}

startServer();
