"use client";

import React, { useState, useEffect } from "react";
import { BotInstanceWithCounts } from "../DashboardClient";
import { 
  Image as ImageIcon, 
  Video, 
  Send, 
  Sparkles, 
  Save, 
  Info, 
  Loader2, 
  Upload, 
  X,
  Clock,
  Calendar,
  CheckCircle2
} from "lucide-react";

interface AutomationsClientProps {
  instances: BotInstanceWithCounts[];
}

export default function AutomationsClient({ instances }: AutomationsClientProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState(instances[0]?.id || "");
  const [statusText, setStatusText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  const selectedInstance = instances.find(i => i.id === selectedInstanceId);

  // Charger les paramètres actuels de l'instance
  useEffect(() => {
    if (selectedInstance) {
      setMediaUrl(selectedInstance.statusMediaUrl || "");
      setMediaType(selectedInstance.statusMediaType as any || "image");
      
      if (selectedInstance.statusSchedule) {
        const parts = selectedInstance.statusSchedule.split(" ");
        if (parts.length >= 5) {
            setScheduleTime(`${parts[1].padStart(2, '0')}:${parts[0].padStart(2, '0')}`);
            setSelectedDays(parts[4].split(",").map(Number));
        }
      }
    }
  }, [selectedInstanceId]);

  const handlePostStatus = async () => {
    if (!selectedInstanceId) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/instance/${selectedInstanceId}/status/test`, {
        method: "POST",
        body: JSON.stringify({
          mediaUrl: mediaUrl || undefined,
          mediaType,
          customText: useAI ? undefined : statusText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Statut envoyé avec succès !");
      } else {
        alert("Erreur: " + data.error);
      }
    } catch (err) {
      alert("Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
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

  const handleSaveSettings = async () => {
    const [hour, minute] = scheduleTime.split(":");
    const cron = `${minute} ${hour} * * ${selectedDays.join(",")}`;

    try {
      const res = await fetch(`/api/instance/${selectedInstanceId}/prompt`, {
        method: "PATCH",
        body: JSON.stringify({ 
            statusMediaUrl: mediaUrl,
            statusMediaType: mediaType,
            statusSchedule: cron
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        alert("Programmation mise à jour !");
      }
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter dark:text-white italic uppercase">Automatisations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Configurez vos publications automatiques et testez vos contenus.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Principale */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section Publication Rapide */}
          <section className="bg-white dark:bg-gray-900 rounded-[40px] p-10 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Send size={120} />
             </div>
             
             <h2 className="text-2xl font-black mb-8 flex items-center gap-3 italic uppercase tracking-tight">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <Send size={20} />
                </div>
                Publication Directe
             </h2>

             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Instance WhatsApp</label>
                      <select 
                        value={selectedInstanceId}
                        onChange={(e) => setSelectedInstanceId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                      >
                        {instances.map(inst => (
                          <option key={inst.id} value={inst.id}>{inst.name} ({inst.phone || "Déconnecté"})</option>
                        ))}
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Mode de contenu</label>
                      <div className="flex bg-gray-100 dark:bg-black p-1.5 rounded-2xl">
                        <button 
                          onClick={() => setUseAI(true)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${useAI ? "bg-white dark:bg-gray-800 shadow-lg text-indigo-600" : "text-gray-400"}`}
                        >
                          <Sparkles size={16} /> IA
                        </button>
                        <button 
                          onClick={() => setUseAI(false)}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${!useAI ? "bg-white dark:bg-gray-800 shadow-lg text-indigo-600" : "text-gray-400"}`}
                        >
                          Manuel
                        </button>
                      </div>
                   </div>
                </div>

                {!useAI && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Légende personnalisée</label>
                    <textarea 
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      placeholder="Quoi de neuf aujourd'hui ?"
                      className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-[32px] px-8 py-6 outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-40 text-lg italic"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Média du statut</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="URL ou glissez un fichier..."
                      className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none"
                    />
                    <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-3 transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
                      {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <span>Upload</span>
                      <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*" />
                    </label>
                  </div>

                  {mediaUrl && (
                    <div className="mt-4 relative rounded-[32px] overflow-hidden border-4 border-gray-50 dark:border-gray-800 aspect-video bg-black flex items-center justify-center group shadow-xl">
                      {mediaType === "video" ? (
                        <video src={mediaUrl} controls className="max-h-full" />
                      ) : (
                        <img src={mediaUrl} alt="Preview" className="max-h-full object-contain" />
                      )}
                      <button 
                        onClick={() => setMediaUrl("")}
                        className="absolute top-6 right-6 p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-all shadow-lg"
                      >
                        <X size={20} />
                      </button>
                      <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                        Aperçu du média
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handlePostStatus}
                    disabled={isSending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest py-6 rounded-3xl shadow-2xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-4 disabled:bg-gray-300 group"
                  >
                    {isSending ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <>
                        <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        <span>Publier sur WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
             </div>
          </section>
        </div>

        {/* Colonne Latérale : Programmation */}
        <div className="space-y-8">
           <section className="bg-white dark:bg-gray-900 rounded-[40px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-black italic uppercase mb-6 flex items-center gap-3">
                 <Calendar size={20} className="text-indigo-600" />
                 Planning Quotidien
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Heure de lancement</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-6 py-4 outline-none font-bold"
                      />
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Jours actifs</label>
                    <div className="grid grid-cols-7 gap-2">
                       {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => (
                         <button 
                           key={i}
                           onClick={() => selectedDays.includes(i) ? setSelectedDays(selectedDays.filter(day => day !== i)) : setSelectedDays([...selectedDays, i])}
                           className={`aspect-square rounded-xl text-[10px] font-black transition-all ${selectedDays.includes(i) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200"}`}
                         >
                           {d}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button 
                   onClick={handleSaveSettings}
                   className="w-full py-4 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-600 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                 >
                   <Save size={16} className="group-hover:scale-110 transition-transform" />
                   Enregistrer
                 </button>
              </div>

              <div className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                 <div className="flex items-start gap-3">
                    <Info size={16} className="text-indigo-600 mt-1 shrink-0" />
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                       Ces réglages définissent le <strong>statut par défaut</strong> de cette instance. Pour programmer plusieurs contenus différents, utilisez le <strong>Gestionnaire de Statuts</strong>.
                    </p>
                 </div>
              </div>
           </section>

           <section className="bg-black rounded-[40px] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                 <Sparkles size={80} />
              </div>
              <h3 className="font-black italic uppercase text-sm mb-4">Conseil Pro</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                 L'IA utilise votre <strong>System Prompt</strong> pour donner une personnalité unique à vos statuts. Plus votre prompt est détaillé, plus les textes seront engageants !
              </p>
           </section>
        </div>
      </div>
    </div>
  );
}
