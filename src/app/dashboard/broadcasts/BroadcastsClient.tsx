"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Megaphone, 
  Users, 
  Calendar, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Play, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { DeleteModal } from "@/components/modals/DeleteModal";

interface Broadcast {
  id: string;
  name: string;
  content: string;
  status: string;
  mediaType: string;
  cronPattern: string | null;
  botInstance: { name: string };
  _count: { recipients: number, logs: number };
  createdAt: string;
}

export default function BroadcastsClient({ instances }: { instances: any[] }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State pour la suppression
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch("/api/broadcasts");
      const data = await res.json();
      setBroadcasts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/broadcasts/${deleteId}`, { method: "DELETE" });
      setBroadcasts(broadcasts.filter(b => b.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBroadcasts = broadcasts.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white uppercase italic">Diffusions Broadcast</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Envoyez des messages massifs à vos contacts de manière ciblée.</p>
        </div>
        <Link 
          href="/dashboard/broadcasts/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] active:scale-95"
        >
          <Plus size={20} /> Nouvelle Diffusion
        </Link>
      </header>

      {/* Barre d'outils */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Rechercher une diffusion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>
        <button className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">
          <Filter size={20} /> Filtres
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-[32px]" />
          ))}
        </div>
      ) : filteredBroadcasts.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-[40px] p-20 text-center border border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 mx-auto rounded-3xl flex items-center justify-center mb-6">
            <Megaphone size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Aucune diffusion trouvée</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">Commencez par créer votre première campagne de diffusion pour toucher vos clients.</p>
          <Link href="/dashboard/broadcasts/new" className="text-indigo-600 font-bold hover:underline">Créer maintenant →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBroadcasts.map(broadcast => (
            <div key={broadcast.id} className="bg-white dark:bg-gray-900 rounded-[32px] p-6 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              {/* Badge de statut */}
              <div className="absolute top-0 right-0 p-4">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                   broadcast.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                   broadcast.status === 'PROCESSING' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                   'bg-gray-100 text-gray-500'
                 }`}>
                   {broadcast.status}
                 </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                  <Megaphone size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg truncate uppercase italic tracking-tight">{broadcast.name}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={12} /> {broadcast._count.recipients} destinataires
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-black/50 rounded-2xl p-4 mb-6 h-24 overflow-hidden relative group-hover:bg-indigo-50/30 transition-colors">
                 <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                   {broadcast.content}
                 </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Link 
                    href={`/dashboard/broadcasts/${broadcast.id}`}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors"
                  >
                    <Edit2 size={18} />
                  </Link>
                  <button 
                    onClick={() => setDeleteId(broadcast.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de suppression réutilisable */}
      <DeleteModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Supprimer la diffusion"
        description="Êtes-vous sûr de vouloir supprimer cette campagne de diffusion ? Cette action supprimera également tout l'historique d'envoi associé."
      />
    </div>
  );
}
