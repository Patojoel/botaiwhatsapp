"use client";

import React, { useState, useEffect } from "react";
import { Clock, Plus, X, Calendar, Check } from "lucide-react";

interface DaySchedule {
  day: number; // 0-6 (Dimanche-Samedi)
  times: string[]; // ["08:00", "14:00"]
}

interface ModularSchedulerProps {
  value: any; // Le JSON stocké en base
  onChange: (newValue: any) => void;
}

const DAYS = [
  { id: 1, label: "Lundi", short: "Lun" },
  { id: 2, label: "Mardi", short: "Mar" },
  { id: 3, label: "Mercredi", short: "Mer" },
  { id: 4, label: "Jeudi", short: "Jeu" },
  { id: 5, label: "Vendredi", short: "Ven" },
  { id: 6, label: "Samedi", short: "Sam" },
  { id: 0, label: "Dimanche", short: "Dim" },
];

export function ModularScheduler({ value, onChange }: ModularSchedulerProps) {
  // Structure par défaut : tous les jours avec un horaire vide
  const initialSchedule: DaySchedule[] = value || DAYS.map(d => ({ day: d.id, times: [] }));
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule);
  const [selectedDayId, setSelectedDayId] = useState<number>(1);

  useEffect(() => {
    onChange(schedule);
  }, [schedule]);

  const addTime = (dayId: number) => {
    setSchedule(prev => prev.map(s => 
      s.day === dayId ? { ...s, times: [...s.times, "09:00"] } : s
    ));
  };

  const updateTime = (dayId: number, index: number, newTime: string) => {
    setSchedule(prev => prev.map(s => 
      s.day === dayId ? { 
        ...s, 
        times: s.times.map((t, i) => i === index ? newTime : t) 
      } : s
    ));
  };

  const removeTime = (dayId: number, index: number) => {
    setSchedule(prev => prev.map(s => 
      s.day === dayId ? { 
        ...s, 
        times: s.times.filter((_, i) => i !== index) 
      } : s
    ));
  };

  const currentDaySchedule = schedule.find(s => s.day === selectedDayId);

  return (
    <div className="bg-gray-50 dark:bg-black/50 rounded-[32px] p-6 border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
          <Calendar size={18} />
        </div>
        <h3 className="font-bold uppercase text-sm tracking-widest text-gray-400">Planification Hebdomadaire</h3>
      </div>

      {/* Sélecteur de jours style "Tabs" */}
      <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl overflow-x-auto scrollbar-none">
        {DAYS.map(day => {
          const s = schedule.find(item => item.day === day.id);
          const hasTimes = s && s.times.length > 0;
          
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDayId(day.id)}
              className={`flex-1 min-w-[70px] py-3 rounded-xl text-xs font-bold transition-all relative ${
                selectedDayId === day.id 
                  ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {day.short}
              {hasTimes && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
              )}
            </button>
          );
        })}
      </div>

      {/* Configuration du jour sélectionné */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-lg italic uppercase tracking-tight text-gray-700 dark:text-gray-300">
            {DAYS.find(d => d.id === selectedDayId)?.label}
          </h4>
          <button 
            onClick={() => addTime(selectedDayId)}
            className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-4 py-2 rounded-xl transition-all"
          >
            <Plus size={14} /> Ajouter un horaire
          </button>
        </div>

        {currentDaySchedule?.times.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
            <Clock className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-xs text-gray-400">Aucun envoi prévu ce jour.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentDaySchedule?.times.map((time, idx) => (
              <div key={idx} className="flex items-center gap-2 group animate-in zoom-in duration-200">
                <div className="flex-1 flex items-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm group-hover:border-indigo-200 transition-all">
                  <Clock size={14} className="text-gray-400 mr-3" />
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => updateTime(selectedDayId, idx, e.target.value)}
                    className="bg-transparent outline-none text-sm font-bold w-full"
                  />
                </div>
                <button 
                  onClick={() => removeTime(selectedDayId, idx)}
                  className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-2">
          <Check size={12} className="text-green-500" /> Vos modifications sont enregistrées localement
        </p>
      </div>
    </div>
  );
}
