"use client";

import React from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isLoading?: boolean;
}

export function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description,
  isLoading = false
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-950 w-full max-w-md rounded-[32px] shadow-2xl border border-red-100 dark:border-red-900/20 overflow-hidden animate-in fade-in zoom-in duration-200">
        <header className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-red-50/30 dark:bg-red-900/10">
          <div className="flex items-center gap-3 text-red-600">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="p-8">
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {description}
          </p>
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
            <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-widest">
              Attention : Cette action est irréversible.
            </p>
          </div>
        </div>

        <footer className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex gap-4">
          <button 
            disabled={isLoading}
            onClick={onClose}
            className="flex-1 py-4 px-6 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            Annuler
          </button>
          <button 
            disabled={isLoading}
            onClick={onConfirm}
            className="flex-1 py-4 px-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
            {isLoading ? "Suppression..." : "Supprimer"}
          </button>
        </footer>
      </div>
    </div>
  );
}
