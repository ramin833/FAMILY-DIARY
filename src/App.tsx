/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NavSection, Worksheet, Expenditure, Project, FamilyNote, IncomeCategory } from './types/family';
import {
  auth,
  onAuthStateChanged,
  User,
  testConnection,
} from './firebase/config';
import {
  getWorksheets,
  saveWorksheet as dbSaveWorksheet,
  deleteWorksheet as dbDeleteWorksheet,
  getExpenditures,
  saveExpenditure as dbSaveExpenditure,
  deleteExpenditure as dbDeleteExpenditure,
  getProjects,
  saveProject as dbSaveProject,
  deleteProject as dbDeleteProject,
  getNotes,
  saveNote as dbSaveNote,
  deleteNote as dbDeleteNote,
  DEFAULT_WORKSHEETS,
  DEFAULT_EXPENDITURES,
  DEFAULT_PROJECTS,
  DEFAULT_NOTES,
  resetAllDatabaseData,
  getCategoryDefaultColumns,
} from './services/dbService';

import { HeaderNav } from './components/HeaderNav';
import { HomeDashboard } from './components/HomeDashboard';
import { IncomeSection } from './components/IncomeSection';
import { ExpenditureSection } from './components/ExpenditureSection';
import { ProjectSection } from './components/ProjectSection';
import { MiscellaneousSection } from './components/MiscellaneousSection';
import { AIChatbotModal } from './components/AIChatbotModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [incomeSubTab, setIncomeSubTab] = useState<'current' | 'upcoming'>('current');
  const [expenditureSubTab, setExpenditureSubTab] = useState<'current' | 'upcoming'>('current');
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // App Data States - all starting from 0
  const [worksheets, setWorksheets] = useState<Worksheet[]>(DEFAULT_WORKSHEETS);
  const [expenditures, setExpenditures] = useState<Expenditure[]>(DEFAULT_EXPENDITURES);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [notes, setNotes] = useState<FamilyNote[]>(DEFAULT_NOTES);

  // Load all data
  const loadData = useCallback(async (user: User | null) => {
    setSyncing(true);
    try {
      const uid = user ? user.uid : null;
      const [loadedWorksheets, loadedExpenditures, loadedProjects, loadedNotes] = await Promise.all([
        getWorksheets(uid),
        getExpenditures(uid),
        getProjects(uid),
        getNotes(uid),
      ]);
      setWorksheets(loadedWorksheets);
      setExpenditures(loadedExpenditures);
      setProjects(loadedProjects);
      setNotes(loadedNotes);
    } catch (err) {
      console.error('Failed to load data from database:', err);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  // Reset all data to 0
  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset all family data to 0? All worksheets, expenditures, and projects will be cleared.')) {
      setSyncing(true);
      try {
        const clean = await resetAllDatabaseData(currentUser?.uid || null);
        setWorksheets(clean.worksheets);
        setExpenditures(clean.expenditures);
        setProjects(clean.projects);
        setNotes(clean.notes);
        localStorage.setItem('family_diary_zero_reset_v3', 'true');
        if (currentUser) {
          localStorage.setItem(`family_diary_user_reset_v3_${currentUser.uid}`, 'true');
        }
      } catch (err) {
        console.error('Reset error:', err);
      } finally {
        setSyncing(false);
      }
    }
  };

  // Initialize on boot
  useEffect(() => {
    // Test initial connection as required by Firebase skill
    testConnection().catch(console.warn);

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      loadData(user);
    });

    return () => unsubscribe();
  }, []);

  // CRUD: Worksheet
  const handleSaveWorksheet = async (ws: Worksheet) => {
    setWorksheets(prev => {
      const idx = prev.findIndex(item => item.id === ws.id);
      return idx >= 0 ? [...prev.slice(0, idx), ws, ...prev.slice(idx + 1)] : [ws, ...prev];
    });
    try {
      await dbSaveWorksheet(currentUser?.uid || null, ws);
    } catch (err) {
      console.error('Save worksheet error:', err);
    }
  };

  const handleDeleteWorksheet = async (sheetId: string) => {
    setWorksheets(prev => prev.filter(w => w.id !== sheetId));
    try {
      await dbDeleteWorksheet(currentUser?.uid || null, sheetId);
    } catch (err) {
      console.error('Delete worksheet error:', err);
    }
  };

  const handleCreateWorksheet = async (category: IncomeCategory, title: string): Promise<string> => {
    const newId = `sheet_${category}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSheet: Worksheet = {
      id: newId,
      userId: currentUser?.uid || 'guest',
      category,
      title,
      columns: getCategoryDefaultColumns(category),
      rows: [],
      totalAmount: 0,
      currency: '৳',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await handleSaveWorksheet(newSheet);
    return newId;
  };

  // CRUD: Expenditure
  const handleAddExpenditure = async (exp: Expenditure) => {
    const itemWithUser: Expenditure = {
      ...exp,
      userId: currentUser?.uid || 'guest',
    };
    setExpenditures(prev => [itemWithUser, ...prev]);
    try {
      await dbSaveExpenditure(currentUser?.uid || null, itemWithUser);
    } catch (err) {
      console.error('Add expenditure error:', err);
    }
  };

  const handleDeleteExpenditure = async (id: string) => {
    setExpenditures(prev => prev.filter(e => e.id !== id));
    try {
      await dbDeleteExpenditure(currentUser?.uid || null, id);
    } catch (err) {
      console.error('Delete expenditure error:', err);
    }
  };

  const handleUpdateExpenditure = async (exp: Expenditure) => {
    const itemWithUser: Expenditure = {
      ...exp,
      userId: currentUser?.uid || 'guest',
    };
    setExpenditures(prev => prev.map(e => (e.id === exp.id ? itemWithUser : e)));
    try {
      await dbSaveExpenditure(currentUser?.uid || null, itemWithUser);
    } catch (err) {
      console.error('Update expenditure error:', err);
    }
  };

  // CRUD: Project
  const handleAddProject = async (proj: Project) => {
    setProjects(prev => [...prev, proj]);
    try {
      await dbSaveProject(currentUser?.uid || null, proj);
    } catch (err) {
      console.error('Add project error:', err);
    }
  };

  const handleUpdateProject = async (proj: Project) => {
    setProjects(prev => prev.map(p => (p.id === proj.id ? proj : p)));
    try {
      await dbSaveProject(currentUser?.uid || null, proj);
    } catch (err) {
      console.error('Update project error:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    try {
      await dbDeleteProject(currentUser?.uid || null, id);
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  // CRUD: Notes
  const handleAddNote = async (content: string, tag?: string) => {
    const newNote: FamilyNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.uid || 'guest',
      content,
      tag: tag || 'Memo',
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
    try {
      await dbSaveNote(currentUser?.uid || null, newNote);
    } catch (err) {
      console.error('Add note error:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      await dbDeleteNote(currentUser?.uid || null, id);
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Main Navigation Header */}
      <HeaderNav
        activeSection={activeSection === 'project' ? 'expenditure' : activeSection}
        onSelectSection={sec => {
          if (sec === 'project') {
            setExpenditureSubTab('upcoming');
            setActiveSection('expenditure');
          } else {
            setActiveSection(sec);
          }
        }}
        currentUser={currentUser}
        syncing={syncing}
        onRefresh={() => loadData(currentUser)}
        onResetAll={handleResetAll}
        onOpenChatbot={() => setIsChatbotOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-600">Loading Family Diary Database...</p>
          </div>
        ) : (
          <>
            {activeSection === 'home' && (
              <HomeDashboard
                worksheets={worksheets}
                expenditures={expenditures}
                projects={projects}
                onNavigate={sec => {
                  if (sec === 'project') {
                    setExpenditureSubTab('upcoming');
                    setActiveSection('expenditure');
                  } else {
                    setActiveSection(sec);
                  }
                }}
                onOpenQuickExpense={() => {
                  setExpenditureSubTab('current');
                  setActiveSection('expenditure');
                }}
                onOpenQuickProject={() => {
                  setExpenditureSubTab('upcoming');
                  setActiveSection('expenditure');
                }}
                onOpenUpcomingIncome={() => {
                  setIncomeSubTab('upcoming');
                  setActiveSection('income');
                }}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onSaveWorksheet={handleSaveWorksheet}
                onDeleteWorksheet={handleDeleteWorksheet}
                onOpenChatbot={() => setIsChatbotOpen(true)}
                onDeleteExpenditure={handleDeleteExpenditure}
                onAddExpenditure={handleAddExpenditure}
              />
            )}

            {activeSection === 'income' && (
              <IncomeSection
                worksheets={worksheets}
                initialSubSection={incomeSubTab}
                onSubSectionChange={setIncomeSubTab}
                onSaveWorksheet={handleSaveWorksheet}
                onDeleteWorksheet={handleDeleteWorksheet}
                onCreateWorksheet={handleCreateWorksheet}
              />
            )}

            {(activeSection === 'expenditure' || activeSection === 'project') && (
              <ExpenditureSection
                expenditures={expenditures}
                worksheets={worksheets}
                projects={projects}
                initialSubSection={activeSection === 'project' ? 'upcoming' : expenditureSubTab}
                onSubSectionChange={setExpenditureSubTab}
                onAddExpenditure={handleAddExpenditure}
                onUpdateExpenditure={handleUpdateExpenditure}
                onDeleteExpenditure={handleDeleteExpenditure}
                onAddProject={handleAddProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
              />
            )}

            {activeSection === 'miscellaneous' && (
              <MiscellaneousSection
                worksheets={worksheets}
                expenditures={expenditures}
                projects={projects}
                notes={notes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onResetAll={handleResetAll}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Family Diary</span>
            <span>•</span>
            <span>Secure Household Database</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">Taka (৳) Ledger</span>
          </div>
          <div>
            <span>Realtime Timezone Synced • {currentUser ? 'Synced with Google Cloud' : 'Guest Mode (Local Cache)'}</span>
          </div>
        </div>
      </footer>

      {/* Floating Gemini AI Chatbot Launcher Button */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-500/35 border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all group"
        title="Open Family Diary Gemini AI Chatbot"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Ask AI Chatbot</span>
        <span className="sm:hidden">AI Chat</span>
      </button>

      {/* Gemini AI Chatbot Modal */}
      <AIChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        worksheets={worksheets}
        expenditures={expenditures}
        projects={projects}
        onNavigateToSection={setActiveSection}
      />
    </div>
  );
}
