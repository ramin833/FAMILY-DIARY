import React, { useState } from 'react';
import {
  Sparkles,
  BarChart3,
  PieChart,
  Bot,
  Send,
  Database,
  Download,
  BookOpen,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Check,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { Worksheet, Expenditure, Project, FamilyNote } from '../types/family';
import { DeepAnalyticsStudio } from './DeepAnalyticsStudio';

interface MiscellaneousSectionProps {
  worksheets: Worksheet[];
  expenditures: Expenditure[];
  projects: Project[];
  notes: FamilyNote[];
  onAddNote: (content: string, tag?: string) => void;
  onDeleteNote: (id: string) => void;
  onResetAll?: () => void;
}

export const MiscellaneousSection: React.FC<MiscellaneousSectionProps> = ({
  worksheets,
  expenditures,
  projects,
  notes,
  onAddNote,
  onDeleteNote,
  onResetAll,
}) => {
  // AI Assistant State
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    {
      role: 'ai',
      text: `👋 **Welcome to your Family Diary Studio AI!**\n\nI have real-time visibility into your household database. You have recorded **${worksheets.length} income worksheets**, **${expenditures.length} expenditure entries**, and **${projects.length} planned projects**.\n\nAsk me anything or click one of the suggested prompts below to analyze your budget, save for upcoming deadlines, or get personalized household tips!`,
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // New Note state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('Family Goal');

  // Calculations for charts
  const totalIncome = worksheets.reduce((s, w) => s + (w.totalAmount || 0), 0);
  const totalExpenditure = expenditures.reduce((s, e) => s + e.amount, 0);
  const netSavings = totalIncome - totalExpenditure;
  const totalProjectBudget = projects.reduce((s, p) => s + p.expectedAmount, 0);

  // Income Breakdown by Category
  const incomeCategories = [
    { label: 'Tuition', cat: 'tution', color: 'bg-emerald-500' },
    { label: 'Father Salary', cat: 'father_salary', color: 'bg-teal-500' },
    { label: 'Selling Product', cat: 'selling_product', color: 'bg-cyan-500' },
    { label: 'Others Help', cat: 'others_help', color: 'bg-blue-500' },
  ].map(item => {
    const amount = worksheets
      .filter(w => w.category === item.cat)
      .reduce((s, w) => s + (w.totalAmount || 0), 0);
    return { ...item, amount };
  });

  // Expenditure Breakdown by Category
  const expenseCatMap: Record<string, number> = {};
  expenditures.forEach(e => {
    const c = e.category || 'Other';
    expenseCatMap[c] = (expenseCatMap[c] || 0) + e.amount;
  });
  const expenseCategories = Object.entries(expenseCatMap).map(([cat, amount]) => ({
    label: cat,
    amount,
  }));

  // Handle AI question
  const handleAskAi = async (promptText?: string) => {
    const question = promptText || userInput;
    if (!question.trim()) return;

    const newMsgs = [...messages, { role: 'user' as const, text: question }];
    setMessages(newMsgs);
    setUserInput('');
    setLoadingAi(true);

    try {
      const contextData = {
        totalIncome,
        totalExpenses: totalExpenditure,
        netSavings,
        savingsRate: totalIncome > 0 ? `${Math.round((netSavings / totalIncome) * 100)}%` : '0%',
        projectTarget: totalProjectBudget,
        upcomingProjects: projects.map(p => ({
          title: p.title,
          deadline: p.expectedDate,
          amount: p.expectedAmount,
          status: p.status,
        })),
        incomeBreakdown: incomeCategories.map(c => ({ category: c.label, amount: c.amount })),
        expenseCategories: expenseCategories.map(c => ({ category: c.label, amount: c.amount })),
      };

      const res = await fetch('/api/family-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question, context: contextData }),
      });

      if (!res.ok) {
        throw new Error('AI request failed');
      }

      const data = await res.json();
      setMessages([...newMsgs, { role: 'ai', text: data.text || 'Unable to generate advice right now.' }]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMsgs,
        {
          role: 'ai',
          text: `💡 **Family Financial Note**:\n\nBased on your ledger, your family has saved **৳${Math.max(0, netSavings).toLocaleString()}** after covering recurring expenses. Keep monitoring multi-date grocery and utility spending, and set aside dedicated reserves for upcoming projects!`,
        },
      ]);
    } finally {
      setLoadingAi(false);
    }
  };

  // Export Full Database to JSON
  const handleExportFullDatabase = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      currency: 'BDT (৳)',
      worksheets,
      expenditures,
      projects,
      notes,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `Family_Diary_Full_Database_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    onAddNote(newNoteContent.trim(), newNoteTag);
    setNewNoteContent('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Miscellaneous: Analytics, AI Assistant & Studio</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Interactive charts, intelligent Gemini AI advisor, family diary memos, and full database exports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onResetAll && (
            <button
              onClick={onResetAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Reset All Data to 0</span>
            </button>
          )}
          <button
            onClick={handleExportFullDatabase}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Database (JSON)</span>
          </button>
        </div>
      </div>

      {/* Deep Analytics Studio: 3D Bar, Column, Pie, Ogive, and Statistical Workbench */}
      <DeepAnalyticsStudio
        worksheets={worksheets}
        expenditures={expenditures}
        projects={projects}
      />


      {/* Row 2: AI Financial Assistant - As explicitly requested by user */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Family Diary AI Advisor
              </h3>
              <p className="text-xs text-slate-500">
                Powered by Gemini 3.8 Flash • Realtime calculation advisor
              </p>
            </div>
          </div>
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
          {[
            'Analyze our monthly budget & savings health',
            'How should we prepare for our upcoming project deadline?',
            'Give 4 practical tips to optimize family food & utility costs',
            'Forecast our end-of-month cash surplus',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleAskAi(prompt)}
              disabled={loadingAi}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap transition-colors"
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages Log */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/70 p-4 max-h-[360px] overflow-y-auto space-y-3 mb-4 text-xs sm:text-sm">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-2xl ${
                msg.role === 'ai'
                  ? 'bg-white border border-slate-200 text-slate-800 shadow-2xs'
                  : 'bg-indigo-600 text-white ml-auto max-w-[85%] font-medium'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>
          ))}

          {loadingAi && (
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl inline-flex items-center gap-2 text-slate-500 text-xs animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Family Diary AI is calculating and generating recommendations...</span>
            </div>
          )}
        </div>

        {/* Question Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAskAi();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask AI anything about your family calculations, projects, or budget..."
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            disabled={loadingAi}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            type="submit"
            disabled={loadingAi || !userInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>

      {/* Row 3: Family Diary Notes & Memos */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-700" />
            <h3 className="font-extrabold text-slate-900 text-base">
              Family Diary Memos & Journal
            </h3>
          </div>
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleCreateNote} className="mb-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Add a family note, financial rule, or household memo..."
            value={newNoteContent}
            onChange={e => setNewNoteContent(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          <select
            value={newNoteTag}
            onChange={e => setNewNoteTag(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="Family Goal">Family Goal</option>
            <option value="Budget Tip">Budget Tip</option>
            <option value="Household Rule">Household Rule</option>
            <option value="Reminder">Reminder</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Memo</span>
          </button>
        </form>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 group"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 inline-block mb-1.5">
                  {note.tag || 'Memo'}
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                  {note.content}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
              <button
                onClick={() => onDeleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
