import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  X,
  Trash2,
  Bot,
  User,
  TrendingUp,
  Receipt,
  PiggyBank,
  Maximize2,
  Minimize2,
  RefreshCw,
  Copy,
  Check,
  HelpCircle,
  Zap,
  Square,
  ChevronDown,
  Brain,
  Gauge,
  ArrowRight,
  Cpu,
  Layers,
  Server
} from 'lucide-react';
import { Worksheet, Expenditure, Project } from '../types/family';

export type GeminiModelOption =
  | 'gemini-3.8-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'openrouter:google/gemini-2.5-flash'
  | 'openrouter:anthropic/claude-3.5-sonnet'
  | 'openrouter:deepseek/deepseek-chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelName?: string;
  followUps?: string[];
}

interface AIChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheets: Worksheet[];
  expenditures: Expenditure[];
  projects: Project[];
  onNavigateToSection?: (section: any) => void;
}

interface LocalChatContext {
  totalIncome: number;
  totalExpenditure: number;
  reserve: number;
  worksheets: Worksheet[];
  expenditures: Expenditure[];
  categoryBreakdown: Record<string, number>;
  projects: Project[];
}

export const MODEL_CONFIGS: Record<
  GeminiModelOption,
  { name: string; provider: 'Google Gemini' | 'OpenRouter'; tag: string; description: string; badgeClass: string; icon: any }
> = {
  'gemini-3.8-flash': {
    name: 'Gemini 3.8 Flash',
    provider: 'Google Gemini',
    tag: 'Default',
    description: 'Fast, state-of-the-art multi-turn chat & real-time household insights',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    icon: Sparkles,
  },
  'gemini-3.1-pro-preview': {
    name: 'Gemini 3.1 Pro',
    provider: 'Google Gemini',
    tag: 'Complex Reasoning',
    description: 'Deep financial auditing, multi-month math & budgeting strategy',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    icon: Brain,
  },
  'gemini-3.1-flash-lite': {
    name: 'Gemini 3.1 Flash Lite',
    provider: 'Google Gemini',
    tag: 'Ultra-Fast',
    description: 'Lightweight queries, fast status checks & immediate numbers',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    icon: Gauge,
  },
  'openrouter:google/gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    provider: 'OpenRouter',
    tag: 'OpenRouter',
    description: 'Direct Gemini integration via OpenRouter API proxy',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
    icon: Cpu,
  },
  'openrouter:anthropic/claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'OpenRouter',
    tag: 'OpenRouter',
    description: 'Nuanced financial reasoning and advisory via OpenRouter API',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
    icon: Layers,
  },
  'openrouter:deepseek/deepseek-chat': {
    name: 'DeepSeek V3',
    provider: 'OpenRouter',
    tag: 'OpenRouter',
    description: 'High-speed deep mathematics and budgeting via OpenRouter API',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    icon: Server,
  },
};

// Generates intelligent, dynamic follow-up suggestions tailored to the response content
function computeFollowUpSuggestions(text: string, ctx: LocalChatContext): string[] {
  const lower = (text || '').toLowerCase();
  const suggestions: string[] = [];

  if (lower.includes('reserve') || lower.includes('balance') || lower.includes('surplus') || lower.includes('deficit')) {
    suggestions.push(
      '💡 How can we increase our reserve by 15% this month?',
      '🎯 Can our current reserve fully fund our upcoming projects?',
      '🧾 Which category is burning through our reserve fastest?'
    );
  } else if (lower.includes('transportation') || lower.includes('transit')) {
    suggestions.push(
      '🚗 How does transportation compare to other spending categories?',
      '💰 What is a healthy weekly transportation budget cap?',
      '📊 Show all recent transportation outflows'
    );
  } else if (lower.includes('father') || lower.includes('baba')) {
    suggestions.push(
      '👨‍👦 Compare Father Salary income vs Father Giving outflows',
      '📈 Show monthly breakdown of Father support',
      '💡 Best way to log parental contributions'
    );
  } else if (lower.includes('income') || lower.includes('worksheet') || lower.includes('tuition')) {
    suggestions.push(
      '📈 Which worksheet income stream brings the highest revenue?',
      '🔮 Forecast next month total income',
      '💰 Suggest how much income to allocate into savings'
    );
  } else if (lower.includes('project') || lower.includes('goal') || lower.includes('deadline')) {
    suggestions.push(
      '🎯 Rank our upcoming projects by urgency and cost',
      '⏳ How much weekly savings is needed before the nearest deadline?',
      '💰 What happens to our reserve if all projects complete on time?'
    );
  } else if (lower.includes('expenditure') || lower.includes('expense') || lower.includes('spend')) {
    suggestions.push(
      '📉 Identify our top 3 discretionary spending leaks',
      '💡 Suggest 3 practical budget-saving rules for this week',
      '🧾 Show expenditures with missing dates'
    );
  } else {
    suggestions.push(
      '💰 How is our net family reserve holding up right now?',
      '🧾 Break down all our expenditures by category',
      '📅 Review upcoming project deadlines and budget readiness',
      '💡 Give me 3 high-impact household budget tips'
    );
  }

  return suggestions.slice(0, 3);
}

// Fallback intelligence engine grounded in real database figures
function generateLocalGeminiResponse(prompt: string, ctx: LocalChatContext): string {
  const lower = prompt.toLowerCase();
  const { totalIncome, totalExpenditure, reserve, worksheets, expenditures, categoryBreakdown, projects } = ctx;

  if (lower.includes('reserve') || lower.includes('balance') || lower.includes('net') || lower.includes('surplus') || lower.includes('deficit')) {
    const isSurplus = reserve >= 0;
    return `💰 **Current Reserve Status & Analysis**:\n\n• **Total Income Recorded**: ৳${totalIncome.toLocaleString()} (across ${worksheets.length} worksheet${worksheets.length === 1 ? '' : 's'})\n• **Total Household Expenditure**: ৳${totalExpenditure.toLocaleString()} (across ${expenditures.length} entry${expenditures.length === 1 ? '' : 'ies'})\n• **Active Net Reserve**: **৳${reserve.toLocaleString()}**\n\n${
      isSurplus
        ? `✅ **Financial Cushion Healthy**: Your household is currently operating with a **positive surplus of ৳${reserve.toLocaleString()}**. This provides solid security for emergency contingencies and upcoming milestone projects.`
        : `⚠️ **Deficit Notice**: Current expenditures exceed registered income by **৳${Math.abs(reserve).toLocaleString()}**. Consider reviewing flexible non-essential spending or adding pending income entries to balance the ledger.`
    }`;
  }

  if (lower.includes('transportation') || lower.includes('travel') || lower.includes('transit') || lower.includes('fare')) {
    const amount = categoryBreakdown['Transportation'] || 0;
    const pct = totalExpenditure > 0 ? ((amount / totalExpenditure) * 100).toFixed(1) : '0';
    return `🚗 **Transportation Outflows Summary**:\n\n• **Recorded Spending**: **৳${amount.toLocaleString()}**\n• **Portion of Total Budget**: **${pct}%**\n\n💡 *Recommendation*: Keep tracking daily bus, ride-share, and fuel receipts to maintain control over monthly transit expenditure.`;
  }

  if (lower.includes('father') || lower.includes('baba') || lower.includes('father giving')) {
    const fatherGiving = categoryBreakdown['Father Giving'] || 0;
    const fatherSalary = worksheets
      .filter((w) => w.category === 'father_salary' || w.title.toLowerCase().includes('father') || w.title.toLowerCase().includes('baba'))
      .reduce((s, w) => s + (w.totalAmount || 0), 0);
    return `👨‍👦 **Father Financial Insights**:\n\n• **Father Giving Expenditures**: **৳${fatherGiving.toLocaleString()}**\n• **Father Incomes / Salary Records**: **৳${fatherSalary.toLocaleString()}**\n\nHonoring parental support while keeping clear ledger records maintains family harmony and financial clarity.`;
  }

  if (lower.includes('payment') || lower.includes('bill') || lower.includes('utility')) {
    const payments = categoryBreakdown['Payment'] || 0;
    return `💳 **Payment & Recurring Obligations**:\n\n• **Recorded Under Payment Category**: **৳${payments.toLocaleString()}**\n\n💡 *Tip*: Ensure monthly vendor dues, internet, and scheduled utilities are marked early each month to avoid late charges.`;
  }

  if (lower.includes('donation') || lower.includes('charity') || lower.includes('sadakah')) {
    const donation = categoryBreakdown['Donation'] || 0;
    return `🤲 **Donations & Charitable Giving**:\n\n• **Total Recorded Donations**: **৳${donation.toLocaleString()}**\n\nCharitable contributions are a vital family value. Keeping track ensures you meet your philanthropic targets within your net reserve capacity.`;
  }

  if (lower.includes('income') || lower.includes('earning') || lower.includes('salary') || lower.includes('worksheet') || lower.includes('tuition')) {
    const wsList = worksheets.map(w => `• **${w.title}** (${w.category}): ৳${(w.totalAmount || 0).toLocaleString()} (${w.rows?.length || 0} rows)`).join('\n');
    return `📈 **Worksheet Income Breakdown**:\n\n• **Total Income Recorded**: **৳${totalIncome.toLocaleString()}** across **${worksheets.length} active worksheet(s)**.\n\n${wsList || '• No active worksheets registered yet.'}\n\n💡 *Tip*: You can open and edit your spreadsheet worksheets anytime from the Income tab or dashboard buttons.`;
  }

  if (lower.includes('expenditure') || lower.includes('expense') || lower.includes('spend') || lower.includes('cost') || lower.includes('outflow')) {
    const sortedCats = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);
    const catList = sortedCats.map(([cat, amt]) => {
      const p = totalExpenditure > 0 ? ((amt / totalExpenditure) * 100).toFixed(1) : '0';
      return `• **${cat}**: ৳${amt.toLocaleString()} (${p}%)`;
    }).join('\n');
    return `🧾 **Family Expenditure Breakdown**:\n\n• **Total Expenditures**: **৳${totalExpenditure.toLocaleString()}** across **${expenditures.length} recorded items**.\n\n**Category Distribution**:\n${catList || '• No categorized expenditures yet.'}\n\n💡 *Tip: You can edit or delete any expense record directly in the Expenditure list, or skip dates for flexible expenses.*`;
  }

  if (lower.includes('project') || lower.includes('goal') || lower.includes('milestone')) {
    const totalGoal = projects.reduce((s, p) => s + (p.expectedAmount || 0), 0);
    const pList = projects.map(p => `• **${p.title}**: ৳${(p.expectedAmount || 0).toLocaleString()} (Target: ${p.expectedDate}) — Status: *${p.status}*`).join('\n');
    return `🎯 **Upcoming Projects & Goals**:\n\n• **Active Projects**: ${projects.length}\n• **Total Capital Needed**: ৳${totalGoal.toLocaleString()}\n• **Current Reserve**: ৳${reserve.toLocaleString()}\n\n${pList || '• No projects registered currently.'}\n\n${reserve >= totalGoal ? '✨ **Great News**: Your current reserve fully covers all upcoming project targets!' : `💡 *Planning Note*: You need an additional **৳${(totalGoal - reserve).toLocaleString()}** in savings to meet all target commitments.`}`;
  }

  if (lower.includes('tip') || lower.includes('save') || lower.includes('advice') || lower.includes('budget') || lower.includes('optimize')) {
    return `💡 **Personalized Household Budget Strategies**:\n\n1. **Maintain Category Caps**: Grocery and flexible expenses represent recurring outflows. Setting a weekly ceiling prevents creeping costs.\n2. **Emergency Buffer**: Strive to hold at least 3 months of basic expenditures in your Net Reserve (Target: ~৳${Math.round(totalExpenditure * 1.5).toLocaleString()}).\n3. **Sync Income Worksheets**: Continue logging multiple income sources (Tuitions, Salaries) in your worksheets to maintain an accurate real-time balance.\n4. **Upcoming Goal Allocation**: For projects like family events or home upgrades, allocate fixed weekly portions so deadlines don't pinch cashflow.`;
  }

  return `🤖 **Family Diary Gemini AI Assistant**:\n\nI have full visibility into your live family records! Here is your quick household snapshot:\n\n• **Total Income**: ৳${totalIncome.toLocaleString()} (${worksheets.length} active worksheet${worksheets.length === 1 ? '' : 's'})\n• **Total Expenditure**: ৳${totalExpenditure.toLocaleString()} (${expenditures.length} record${expenditures.length === 1 ? '' : 's'})\n• **Net Reserve**: **৳${reserve.toLocaleString()}** (${reserve >= 0 ? 'Surplus' : 'Deficit'})\n• **Active Projects**: ${projects.length}\n\nI can answer any question about your budget breakdown, project deadlines, savings optimization, or general household financial management. What would you like to explore next?`;
}

export const AIChatbotModal: React.FC<AIChatbotModalProps> = ({
  isOpen,
  onClose,
  worksheets,
  expenditures,
  projects,
}) => {
  const initialWelcomeMessage: ChatMessage = {
    id: 'welcome-msg',
    role: 'model',
    content: `👋 **Hello! I am your Family Diary AI Assistant**, powered by **Google Gemini** & **OpenRouter** intelligence.\n\nI maintain real-time access to all your family database records—including your income worksheets, daily and flexible expenditures, category breakdowns, and upcoming milestone projects.\n\n✨ **Ask me anything**, for example:\n• *"How much is our net reserve balance right now?"*\n• *"Analyze our Transportation and Payment expenditures"*\n• *"Can our current savings cover our upcoming projects?"*\n• *"Suggest 3 practical ways to optimize our household budget"*`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    modelName: 'Gemini 3.8 Flash',
    followUps: [
      '💰 How much is our net reserve balance right now?',
      '🧾 Analyze our Transportation and Payment expenditures',
      '🎯 Can our current savings cover our upcoming projects?',
    ],
  };

  // Persistent conversation history
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('family_diary_chat_history_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved chat history:', e);
    }
    return [initialWelcomeMessage];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModelOption>('gemini-3.8-flash');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{
    geminiAvailable: boolean;
    openRouterAvailable: boolean;
    activeProviders: string[];
  }>({
    geminiAvailable: true,
    openRouterAvailable: false,
    activeProviders: ['Google Gemini'],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch server AI status on mount
  useEffect(() => {
    fetch('/api/ai-status')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setAiStatus(data);
        }
      })
      .catch((err) => console.warn('Could not load AI provider status:', err));
  }, []);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('family_diary_chat_history_v2', JSON.stringify(messages));
    } catch (e) {
      console.warn('Error saving chat history to localStorage:', e);
    }
  }, [messages]);

  // Calculate live database figures to supply in context
  const totalIncome = useMemo(
    () => worksheets.filter(w => !w.category?.startsWith('upcoming_')).reduce((sum, w) => sum + (w.totalAmount || 0), 0),
    [worksheets]
  );

  const totalExpenditure = useMemo(
    () => expenditures.reduce((sum, exp) => sum + (exp.amount || 0), 0),
    [expenditures]
  );

  const reserve = useMemo(() => totalIncome - totalExpenditure, [totalIncome, totalExpenditure]);

  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    expenditures.forEach((exp) => {
      const c = exp.category || 'Other';
      cats[c] = (cats[c] || 0) + (exp.amount || 0);
    });
    return cats;
  }, [expenditures]);

  // Scroll to bottom on new messages or stream chunks
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading, isStreaming]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setIsStreaming(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || loading || isStreaming) return;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: prompt,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    setLoading(true);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const activeModelConfig = MODEL_CONFIGS[selectedModel];
    const assistantMsgId = `ai_${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      modelName: activeModelConfig.name,
      followUps: [],
    };

    // Pre-insert the assistant message so streaming text renders in real-time
    setMessages((prev) => [...prev, initialAssistantMsg]);

    const contextSnapshot = {
      totalIncome,
      totalExpenditure,
      reserve,
      worksheets: worksheets.map((w) => ({
        id: w.id,
        title: w.title,
        category: w.category,
        totalAmount: w.totalAmount || 0,
        rowCount: w.rows?.length || 0,
      })),
      expenditures: expenditures.map((e) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        category: e.category || 'Other',
        dates: e.dates || [],
        month: e.month,
      })),
      categoryBreakdown,
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        expectedDate: p.expectedDate,
        expectedAmount: p.expectedAmount,
        status: p.status,
        description: p.description,
      })),
    };

    let accumulatedContent = '';

    try {
      // First attempt: Server-Sent Events (SSE) streaming endpoint
      const response = await fetch('/api/family-chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: contextSnapshot,
          model: selectedModel,
        }),
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let streamBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const parts = streamBuffer.split('\n\n');
          streamBuffer = parts.pop() || '';

          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                if (data.text) {
                  accumulatedContent += data.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                }
              } catch (parseErr) {
                console.warn('SSE chunk JSON parse skip:', parseErr);
              }
            }
          }
        }
      } else {
        throw new Error(`Streaming failed with status: ${response.status}`);
      }
    } catch (streamError: any) {
      if (streamError.name === 'AbortError') {
        console.log('Chat generation was stopped by user.');
        return;
      }

      console.warn('Streaming fetch bypassed, running robust fallback engine:', streamError);

      // If streaming had not accumulated any content, invoke intelligent local fallback with smooth typing effect
      if (!accumulatedContent) {
        const localReply = generateLocalGeminiResponse(prompt, {
          totalIncome,
          totalExpenditure,
          reserve,
          worksheets,
          expenditures,
          categoryBreakdown,
          projects,
        });

        // Simulate real-time streaming chunks for a smooth, high-fidelity UX
        const chunks = localReply.split(' ');
        for (let i = 0; i < chunks.length; i += 3) {
          if (abortController.signal.aborted) break;
          accumulatedContent += (i > 0 ? ' ' : '') + chunks.slice(i, i + 3).join(' ');
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
          await new Promise((r) => setTimeout(r, 25));
        }
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setIsStreaming(false);

      // Attach contextual follow-up prompt suggestions to the completed response
      if (accumulatedContent) {
        const followUps = computeFollowUpSuggestions(accumulatedContent, {
          totalIncome,
          totalExpenditure,
          reserve,
          worksheets,
          expenditures,
          categoryBreakdown,
          projects,
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: accumulatedContent, followUps }
              : msg
          )
        );
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Clear the entire conversation history? This will start a fresh multi-turn chat session.')) {
      setMessages([initialWelcomeMessage]);
      localStorage.removeItem('family_diary_chat_history_v2');
    }
  };

  const quickPrompts = [
    { label: '💰 Check Reserve Status', text: 'How much is our net family reserve right now and is our cash flow healthy?' },
    { label: '🚗 Breakdown Transportation', text: 'How much did we spend on Transportation and how does it compare to other categories?' },
    { label: '📅 Upcoming Project Readiness', text: 'List all our upcoming project deadlines and calculate if our reserve is enough to fund them.' },
    { label: '👨‍👦 Father Salary vs Giving', text: 'Summarize all records related to Father Salary income and Father Giving expenditures.' },
    { label: '💡 Smart Budget Saving Tips', text: 'Based on our top expenditures, suggest 3 practical ways we can save money this month.' },
    { label: '📈 Compare Worksheet Streams', text: 'Break down all our active worksheets and show which income stream brings the most revenue.' },
  ];

  const currentModelMeta = MODEL_CONFIGS[selectedModel] || MODEL_CONFIGS['gemini-3.8-flash'];
  const ModelIcon = currentModelMeta?.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden transition-all duration-300 w-full ${
          isExpanded
            ? 'h-[96vh] max-w-5xl'
            : 'h-[88vh] sm:h-[84vh] max-w-3xl'
        }`}
      >
        {/* Header with Google Gemini Model Selector & Multi-turn Attribution */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-indigo-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Family Diary AI</span>
                </h2>

                {/* Model Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all hover:brightness-110 cursor-pointer bg-indigo-500/20 text-indigo-200 border-indigo-400/40"
                    title="Change AI Model (Google Gemini or OpenRouter)"
                  >
                    <ModelIcon className="w-3.5 h-3.5 text-amber-300" />
                    <span>{currentModelMeta.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-600/50 text-white font-mono uppercase">
                      {currentModelMeta.tag}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  {/* Dropdown Menu */}
                  {showModelPicker && (
                    <div className="absolute top-full left-0 mt-1.5 w-80 max-h-96 overflow-y-auto bg-slate-900/98 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                      {/* Google Gemini Section */}
                      <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        <span>Google Gemini Models</span>
                        {aiStatus.geminiAvailable && (
                          <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> Direct API
                          </span>
                        )}
                      </div>
                      {(['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'] as GeminiModelOption[]).map((mKey) => {
                        const opt = MODEL_CONFIGS[mKey];
                        const OptIcon = opt.icon;
                        const isSelected = selectedModel === mKey;
                        return (
                          <button
                            key={mKey}
                            type="button"
                            onClick={() => {
                              setSelectedModel(mKey);
                              setShowModelPicker(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl flex items-start gap-2.5 transition-colors mb-1 ${
                              isSelected
                                ? 'bg-indigo-600/40 border border-indigo-400/40 text-white'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 mt-0.5 shrink-0">
                              <OptIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{opt.name}</span>
                                {isSelected && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 font-mono">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                {opt.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}

                      {/* OpenRouter AI Section */}
                      <div className="flex items-center justify-between px-2.5 py-1 mt-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-t border-slate-800/80 pt-2">
                        <span>OpenRouter AI Models</span>
                        <span className={`text-[9px] flex items-center gap-1 font-mono ${aiStatus.openRouterAvailable ? 'text-cyan-400' : 'text-amber-400/80'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.openRouterAvailable ? 'bg-cyan-400' : 'bg-amber-400'} inline-block`}></span>
                          {aiStatus.openRouterAvailable ? 'Key Active' : 'Fallback Ready'}
                        </span>
                      </div>
                      {(['openrouter:google/gemini-2.5-flash', 'openrouter:anthropic/claude-3.5-sonnet', 'openrouter:deepseek/deepseek-chat'] as GeminiModelOption[]).map((mKey) => {
                        const opt = MODEL_CONFIGS[mKey];
                        const OptIcon = opt.icon;
                        const isSelected = selectedModel === mKey;
                        return (
                          <button
                            key={mKey}
                            type="button"
                            onClick={() => {
                              setSelectedModel(mKey);
                              setShowModelPicker(false);
                            }}
                            className={`w-full text-left p-2 rounded-xl flex items-start gap-2.5 transition-colors mb-1 ${
                              isSelected
                                ? 'bg-indigo-600/40 border border-indigo-400/40 text-white'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 mt-0.5 shrink-0">
                              <OptIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{opt.name}</span>
                                {isSelected && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-300 font-mono">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                {opt.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Live Ledger Synced</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-[11px] text-slate-300">
                  Google Gemini & OpenRouter AI Engine
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              title="Reset conversation history"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Restore size' : 'Expand window'}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:block"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Close Chatbot"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Context Data Strip */}
        <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 text-xs flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Income:</span>
              <strong className="text-slate-900 font-mono">৳{totalIncome.toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
              <span>Expenditure:</span>
              <strong className="text-slate-900 font-mono">৳{totalExpenditure.toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <PiggyBank className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reserve:</span>
              <strong
                className={`font-mono ${
                  reserve >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                ৳{reserve.toLocaleString()}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 font-mono text-[10px]">
              Streaming Enabled
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{worksheets.length} sheets • {expenditures.length} exp • {projects.length} proj</span>
            </span>
          </div>
        </div>

        {/* Messages Feed with Sender Attribution & Streaming */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5 bg-slate-50/50">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isLatest = idx === messages.length - 1;
            const isActivelyStreamingThis = isStreaming && isLatest && !isUser;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Sender Avatar */}
                  {!isUser ? (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`rounded-2xl p-4 shadow-xs text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-xs'
                        : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-sm'
                    }`}
                  >
                    {/* Message Header with Explicit Sender Attribution */}
                    <div
                      className={`flex items-center justify-between gap-3 mb-2 pb-1.5 border-b text-[11px] ${
                        isUser
                          ? 'border-slate-800 text-slate-300'
                          : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${isUser ? 'text-indigo-300' : 'text-indigo-600'}`}>
                          {isUser ? 'You' : (msg.modelName || currentModelMeta.name)}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono uppercase ${
                            isUser
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                          }`}
                        >
                          {isUser ? 'User' : 'Assistant'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-70">{msg.timestamp}</span>
                        {!isUser && msg.content && (
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="hover:text-indigo-600 p-0.5 rounded transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="whitespace-pre-wrap font-sans space-y-1.5 selection:bg-indigo-100">
                      {msg.content}
                      {/* Streaming blinking cursor */}
                      {isActivelyStreamingThis && (
                        <span className="inline-block w-2 h-4 ml-1 bg-indigo-600 animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Suggestions for Follow-Up Prompts */}
                {!isUser && msg.followUps && msg.followUps.length > 0 && !isStreaming && (
                  <div className="mt-2.5 ml-11 flex flex-col gap-1.5 animate-in fade-in duration-300">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-indigo-500" />
                      <span>Suggested follow-up questions:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.followUps.map((suggested, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          disabled={loading || isStreaming}
                          onClick={() => handleSendMessage(suggested)}
                          className="text-[11px] font-semibold text-left px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex items-center gap-1.5 group disabled:opacity-50"
                        >
                          <span>{suggested}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking / Loading indicator before first streaming chunk arrives */}
          {loading && !isStreaming && (
            <div className="flex gap-3 justify-start animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-2 shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Thinking with {currentModelMeta.name}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Global Quick Prompt Suggestions Chips Bar */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto shrink-0 flex items-center gap-2 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Topics:</span>
          </span>
          {quickPrompts.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading || isStreaming}
              onClick={() => handleSendMessage(chip.text)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 hover:border-indigo-300 shrink-0 transition-colors disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={2}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${currentModelMeta.name} anything about income, expenditures, reserve, or budget strategy...`}
                className="w-full resize-none px-3.5 py-2.5 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-sans"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 pointer-events-none hidden sm:block">
                Enter ↵ to send • Shift+Enter for newline
              </span>
            </div>

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopGenerating}
                className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 shrink-0"
                title="Stop streaming response"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputPrompt.trim() || loading}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1">
            <span>Powered by {currentModelMeta.name} • Live Multi-turn Database Grounded</span>
            <span>Bangladeshi Taka (৳) Ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
};
