
import React, { useState } from 'react';
import { Goal } from '../types';
import { Target, Plus, Trash2, CheckCircle2, Trophy, Calendar, ChevronRight, Edit3 } from 'lucide-react';

interface GoalsListProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onRemoveGoal: (id: string) => void;
  onToggleGoal: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
}

const GoalsList: React.FC<GoalsListProps> = ({ goals, onAddGoal, onRemoveGoal, onToggleGoal, onUpdateProgress }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetDate: '', category: 'personal' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    onAddGoal({
      ...newGoal,
      targetDate: new Date(newGoal.targetDate || Date.now()),
      completed: false,
      progress: 0
    });
    setNewGoal({ title: '', description: '', targetDate: '', category: 'personal' });
    setIsAdding(false);
  };

  const completedCount = goals.filter(g => g.completed).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full transition-colors duration-300">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-amber-50/30 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-100 dark:shadow-none">
            <Target size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Metas a Cumprir</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {completedCount} de {goals.length} concluídas
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-100 dark:shadow-none"
        >
          {isAdding ? <ChevronRight className="rotate-90" size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {isAdding && (
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 animate-in slide-in-from-top-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Qual sua meta?"
              value={newGoal.title}
              onChange={e => setNewGoal({...newGoal, title: e.target.value})}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={newGoal.targetDate}
                onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})}
                className="px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
              />
              <select
                value={newGoal.category}
                onChange={e => setNewGoal({...newGoal, category: e.target.value})}
                className="px-4 py-2.5 bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm"
              >
                <option value="personal">Pessoal</option>
                <option value="work">Trabalho</option>
                <option value="health">Saúde</option>
                <option value="finance">Financeiro</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all">
              Criar Meta
            </button>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {goals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 py-12">
            <Trophy size={48} className="mb-2 opacity-20" />
            <p className="text-sm font-medium">Defina seus objetivos para o futuro!</p>
          </div>
        ) : (
          goals.map(goal => (
            <div key={goal.id} className="group bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 transition-all hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onToggleGoal(goal.id)}
                    className={`p-1.5 rounded-lg transition-all ${goal.completed ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-amber-500'}`}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <div>
                    <h3 className={`font-bold text-sm ${goal.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {goal.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded uppercase font-bold">
                        {goal.category}
                      </span>
                      <span className="text-[10px] flex items-center gap-1 text-slate-400">
                        <Calendar size={10} /> {new Date(goal.targetDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveGoal(goal.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <span>Progresso</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={goal.progress} 
                  onChange={(e) => onUpdateProgress(goal.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GoalsList;
