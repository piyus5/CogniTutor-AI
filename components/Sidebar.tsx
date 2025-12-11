import React from 'react';
import { Brain, Calculator, Atom, Terminal, BookOpen, GraduationCap, LogOut, HelpCircle } from 'lucide-react';
import { Subject } from '../types';

interface SidebarProps {
  subjects: Subject[];
  activeSubject: Subject;
  onSelectSubject: (subject: Subject) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onOpenSupport: () => void;
  userEmail: string | undefined;
}

const IconMap: Record<string, React.ElementType> = {
  Brain,
  Calculator,
  Atom,
  Terminal,
  BookOpen
};

export const Sidebar: React.FC<SidebarProps> = ({ subjects, activeSubject, onSelectSubject, isOpen, onClose, onLogout, onOpenSupport, userEmail }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
             <GraduationCap className="text-white h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">CogniTutor</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate" title={userEmail}>
               {userEmail || 'Your AI Study Buddy'}
            </p>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Subjects</p>
          {subjects.map((subject) => {
            const Icon = IconMap[subject.icon] || Brain;
            const isActive = activeSubject.id === subject.id;
            
            return (
              <button
                key={subject.id}
                onClick={() => {
                  onSelectSubject(subject);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-md ${isActive ? 'bg-white dark:bg-slate-700 shadow-sm' : 'bg-transparent'}`}>
                  <Icon size={20} className={isActive ? subject.color.replace('bg-', 'text-') : 'text-slate-400'} />
                </div>
                <span className="font-medium">{subject.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
            <button 
                onClick={onOpenSupport}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-sm font-medium border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
                <HelpCircle size={18} />
                Support & Feedback
            </button>

            <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm font-medium"
            >
                <LogOut size={18} />
                Sign Out
            </button>
        </div>
      </aside>
    </>
  );
};