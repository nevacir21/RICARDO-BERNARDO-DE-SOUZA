
import React, { useState } from 'react';
import { AgendaEvent } from '../types';
import { ChevronLeft, ChevronRight, Plus, Trash2, Repeat, Clock, Flag } from 'lucide-react';

interface CalendarProps {
  events: AgendaEvent[];
  onAddEvent: (date: Date) => void;
  onSelectEvent: (event: AgendaEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const BRAZILIAN_HOLIDAYS = [
  { day: 1, month: 0, title: 'Confraternização Universal' },
  { day: 21, month: 3, title: 'Tiradentes' },
  { day: 1, month: 4, title: 'Dia do Trabalho' },
  { day: 7, month: 8, title: 'Independência do Brasil' },
  { day: 12, month: 9, title: 'Nossa Sra. Aparecida' },
  { day: 2, month: 10, title: 'Finados' },
  { day: 15, month: 10, title: 'Proclamação da República' },
  { day: 20, month: 10, title: 'Consciência Negra' },
  { day: 25, month: 11, title: 'Natal' },
];

const Calendar: React.FC<CalendarProps> = ({ events, onAddEvent, onSelectEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });

  const totalDays = daysInMonth(year, month);
  const startingDay = firstDayOfMonth(year, month);
  
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - startingDay + 1;
    if (day > 0 && day <= totalDays) return day;
    return null;
  });

  const getEventsForDay = (day: number) => {
    return events.filter(e => {
      if (e.recurrence === 'daily') return true;
      const d = e.start;
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const getHolidayForDay = (day: number) => {
    return BRAZILIAN_HOLIDAYS.find(h => h.day === day && h.month === month);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const priorityColors = {
    high: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    medium: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
      <header className="p-4 sm:p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 capitalize leading-none mb-1 truncate max-w-[150px] sm:max-w-none">{monthName}</h2>
          <p className="text-[10px] sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">{year}</p>
        </div>
        <div className="flex gap-1.5 sm:gap-3">
          <button onClick={prevMonth} className="p-2 sm:p-3 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl sm:rounded-2xl transition-all border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 shadow-sm active:scale-95">
            <ChevronLeft size={16} sm:size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 sm:p-3 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl sm:rounded-2xl transition-all border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 shadow-sm active:scale-95">
            <ChevronRight size={16} sm:size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 bg-slate-100/30 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, idx) => (
          <div key={idx} className="py-2 sm:py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-slate-50/20 dark:bg-slate-900/20">
        {calendarDays.map((day, i) => {
          const holiday = day ? getHolidayForDay(day) : null;
          return (
            <div key={i} className={`min-h-[80px] sm:min-h-[150px] border-r border-b border-slate-100 dark:border-slate-700 p-1.5 sm:p-3 group transition-all relative ${!day ? 'bg-slate-50/40 dark:bg-slate-800/20' : holiday ? 'bg-indigo-50/20 dark:bg-indigo-900/5' : 'hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'}`}>
              {day && (
                <>
                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                    <span className={`text-[10px] sm:text-sm font-black w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl transition-all ${isToday(day) ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>
                      {day}
                    </span>
                    <button 
                      onClick={() => onAddEvent(new Date(year, month, day))}
                      className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 sm:p-1.5 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg transition-all"
                    >
                      <Plus size={14} sm:size={16} />
                    </button>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[50px] sm:max-h-[100px] pr-0 sm:pr-1 custom-scrollbar">
                    {holiday && (
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[8px] sm:text-[10px] font-bold">
                        <Flag size={8} sm:size={10} className="text-red-500 shrink-0" />
                        <span className="truncate hidden sm:inline">{holiday.title}</span>
                      </div>
                    )}
                    {getEventsForDay(day).map(event => (
                      <div
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className={`group/event flex items-center justify-between w-full p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all cursor-pointer ${priorityColors[event.priority]}`}
                      >
                        <div className="flex-1 text-left truncate font-bold text-[8px] sm:text-[10px] flex items-center gap-1 sm:gap-1.5">
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
