"use client";

import { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  ShieldCheck,
  Package,
  Activity
} from "lucide-react";
import Link from "next/link";
import { DeleteModal } from "@/components/modals/DeleteModal";

export default function PromptsClient() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/prompts");
      const data = await res.json();
      setPrompts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/prompts/${deleteId}`, { method: "DELETE" });
      setPrompts(prompts.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPrompts = prompts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Contextes & Prompts IA
          </h1>
          <p className="text-gray-400 mt-1">Définissez la personnalité et les règles métier de votre assistant.</p>
        </div>
        <Link 
          href="/dashboard/prompts/new"
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouveau Contexte
        </Link>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher un contexte..."
          className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-gray-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-gray-900/50 animate-pulse rounded-3xl border border-gray-800" />
          ))}
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
          <BrainCircuit className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300">Aucun contexte configuré</h3>
          <p className="text-gray-500 mt-2">Créez votre premier prompt pour donner vie à votre IA.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <div 
              key={prompt.id}
              className="group bg-gray-900/50 border border-gray-800 rounded-3xl p-6 hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="flex justify-between items-start mb-4 relative">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex gap-2">
                  <Link 
                    href={`/dashboard/prompts/${prompt.id}`}
                    className="p-2 text-gray-500 hover:text-purple-400 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button 
                    onClick={() => setDeleteId(prompt.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 relative">
                <div>
                  <h3 className="text-xl font-bold text-gray-100 group-hover:text-purple-400 transition-colors line-clamp-1">
                    {prompt.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-2 italic">
                    "{prompt.content}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-400">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {prompt.rules?.length || 0} règles
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-400">
                    <Package className="w-3 h-3 text-blue-400" />
                    {prompt.products?.length || 0} produits
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le contexte"
        description="Attention, supprimer ce contexte obligera les instances liées à utiliser le prompt par défaut."
      />
    </div>
  );
}
