"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Image as ImageIcon, 
  Video, 
  Sparkles, 
  Settings2,
  Play,
  CheckCircle2,
  Clock,
  ChevronRight,
  MoreVertical,
  X,
  Upload,
  Loader2
} from "lucide-react";
import { ModularScheduler } from "@/components/ModularScheduler";

interface Campaign {
  id: string;
  name: string;
  mediaUrl: string | null;
  mediaType: string;
  customText: string | null;
  useAI: boolean;
  cronPattern: string;
  isActive: boolean;
  botInstanceId: string;
  createdAt: string;
  scheduleConfig: any;
  statusLogs?: {
    status: string;
    createdAt: string;
    error?: string;
  }[];
}

export default function StatusManagerClient({ instances }: { instances: any[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [botInstanceId, setBotInstanceId] = useState(instances[0]?.id || "");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [useAI, setUseAI] = useState(true);
  const [customText, setCustomText] = useState("");
  const [scheduleConfig, setScheduleConfig] = useState<any>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/status-campaigns");
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setMediaUrl("");
    setMediaType("image");
    setUseAI(true);
    setCustomText("");
    setScheduleConfig(null);
    setEditingCampaign(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setMediaUrl(data.url);
        setMediaType(file.type.startsWith("video") ? "video" : "image");
      }
    } catch (err) {
      alert("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !botInstanceId) {
      alert("Veuillez remplir les champs obligatoires");
      return;
    }

    const payload = {
      name,
      botInstanceId,
      mediaUrl: mediaUrl || null,
      mediaType,
      useAI,
      customText: useAI ? null : customText,
      scheduleConfig,
    };

    try {
      const url = editingCampaign ? `/api/status-campaigns/${editingCampaign.id}` : "/api/status-campaigns";
      const method = editingCampaign ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchCampaigns();
        setShowModal(false);
        resetForm();
      }
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce programme ?")) return;
    try {
      await fetch(`/api/status-campaigns/${id}`, { method: "DELETE" });
      fetchCampaigns();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const toggleActive = async (campaign: Campaign) => {
    try {
      await fetch(`/api/status-campaigns/${campaign.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !campaign.isActive }),
      });
      fetchCampaigns();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight dark:text-white uppercase italic">Gestionnaire de Statuts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Créez et gérez vos campagnes de communication par statut.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          <Plus size={20} /> Nouveau Programme
        </button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${campaign.isActive ? "bg-green-50 dark:bg-green-900/20 text-green-600" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                  {campaign.mediaType === "video" ? <Video size={20} /> : <ImageIcon size={20} />}
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => { 
                      setEditingCampaign(campaign); 
                      setName(campaign.name); 
                      setMediaUrl(campaign.mediaUrl || ""); 
                      setMediaType(campaign.mediaType as any); 
                      setUseAI(campaign.useAI); 
                      setCustomText(campaign.customText || ""); 
                      setScheduleConfig(campaign.scheduleConfig);
                      setBotInstanceId(campaign.botInstanceId);
                      
                      setShowModal(true); 
                    }}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors"
                  >
                    <Settings2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(campaign.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1 truncate">{campaign.name}</h3>
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                <Clock size={12} /> {campaign.scheduleConfig ? "Planning Modulaire" : campaign.cronPattern}
              </p>

              <div className="bg-gray-50 dark:bg-black rounded-2xl p-4 mb-4 h-24 overflow-hidden relative">
                <p className="text-xs text-gray-500 line-clamp-3 italic">
                  {campaign.useAI ? "Texte généré dynamiquement par l'IA" : (campaign.customText || "Pas de texte")}
                </p>
                
                {campaign.statusLogs && campaign.statusLogs.length > 0 && (
                  <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-tighter ${campaign.statusLogs[0].status === 'SUCCESS' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    <CheckCircle2 size={10} />
                    <span>Dernier envoi: {new Date(campaign.statusLogs[0].createdAt).toLocaleDateString()} {new Date(campaign.statusLogs[0].createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${campaign.isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                     {campaign.isActive ? "Actif" : "En pause"}
                   </span>
                </div>
                <button 
                  onClick={() => toggleActive(campaign)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${campaign.isActive ? "bg-gray-100 dark:bg-gray-800 text-gray-600" : "bg-indigo-600 text-white"}`}
                >
                  {campaign.isActive ? "Pause" : "Activer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-[40px] shadow-2xl border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-2xl font-black italic uppercase tracking-tight">
                {editingCampaign ? "Modifier le programme" : "Nouveau programme"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-all">
                <X size={24} />
              </button>
            </header>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Nom de la campagne</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Promo Weekend"
                  className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Instance Bot</label>
                  <select 
                    value={botInstanceId}
                    onChange={(e) => setBotInstanceId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none appearance-none"
                  >
                    {instances.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Type de média</label>
                   <div className="flex bg-gray-100 dark:bg-black p-1 rounded-2xl">
                      <button 
                        onClick={() => setMediaType("image")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${mediaType === "image" ? "bg-white dark:bg-gray-800 shadow-sm text-indigo-600" : "text-gray-400"}`}
                      >
                        <ImageIcon size={16} /> Image
                      </button>
                      <button 
                        onClick={() => setMediaType("video")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${mediaType === "video" ? "bg-white dark:bg-gray-800 shadow-sm text-indigo-600" : "text-gray-400"}`}
                      >
                        <Video size={16} /> Vidéo
                      </button>
                   </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Média (URL ou Upload)</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none"
                  />
                  <label className="cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all">
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    <span>Upload</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*" />
                  </label>
                </div>
                {mediaUrl && (
                  <div className="mt-4 relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 aspect-video bg-black flex items-center justify-center">
                    {mediaType === "video" ? (
                      <video src={mediaUrl} controls className="max-h-full" />
                    ) : (
                      <img src={mediaUrl} alt="Preview" className="max-h-full object-contain" />
                    )}
                    <button 
                      onClick={() => setMediaUrl("")}
                      className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-[32px] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
                 <div className="flex items-center justify-between">
                    <h4 className="font-bold flex items-center gap-2"><Sparkles size={18} className="text-indigo-600" /> Contenu IA</h4>
                    <button 
                      onClick={() => setUseAI(!useAI)}
                      className={`w-12 h-6 rounded-full transition-all relative ${useAI ? "bg-indigo-600" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useAI ? "left-7" : "left-1"}`} />
                    </button>
                 </div>
                 {!useAI && (
                    <textarea 
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Votre message personnalisé..."
                      className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3 outline-none min-h-[100px]"
                    />
                 )}
              </div>

              <ModularScheduler 
                value={scheduleConfig}
                onChange={setScheduleConfig}
              />
            </div>

            <footer className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex gap-4">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 px-6 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold hover:bg-gray-100 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
              >
                {editingCampaign ? "Mettre à jour" : "Enregistrer le programme"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
