"use client";

import React, { useState } from "react";
import { BotInstanceWithCounts } from "../DashboardClient";
import { Image, Video, Send, Sparkles, Save, Info } from "lucide-react";

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
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]); // 0-6 (Dim-Sam)

  const selectedInstance = instances.find(i => i.id === selectedInstanceId);

  const handlePostStatus = async () => {
    if (!selectedInstanceId) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/instance/${selectedInstanceId}/status/test`, {
        method: "POST",
        body: JSON.stringify({
          mediaUrl: mediaUrl || undefined,
          mediaType,
          // Si useAI est faux, on pourrait passer le statusText manuel
          // Mais notre route actuelle génère toujours via l'IA.
          // Je vais adapter la route après.
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
        const absoluteUrl = `${window.location.origin}${data.url}`;
        setMediaUrl(absoluteUrl);
        
        if (file.type.startsWith("video")) {
          setMediaType("video");
        } else {
          setMediaType("image");
        }
      }
    } catch (err) {
      alert("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    // Conversion jours + heure en Cron : "min hour * * days"
    const [hour, minute] = scheduleTime.split(":");
    const cron = `${minute} ${hour} * * ${selectedDays.join(",")}`;

    try {
      await fetch(`/api/instance/${selectedInstanceId}/prompt`, {
        method: "PATCH",
        body: JSON.stringify({ 
            statusMediaUrl: mediaUrl,
            statusMediaType: mediaType,
            statusSchedule: cron
        }),
        headers: { "Content-Type": "application/json" },
      });
      alert("Programmation mise à jour ! Vos statuts seront lancés à " + scheduleTime + " les jours sélectionnés.");
    } catch (err) {
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight dark:text-white">Automatisations</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Gérez vos statuts automatiques et vos publications programmées.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche : Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Send className="text-indigo-600" size={24} />
              Publier un Statut
            </h2>

            <div className="space-y-6">
              {/* Choix de l'instance */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Instance WhatsApp</label>
                <select 
                  value={selectedInstanceId}
                  onChange={(e) => setSelectedInstanceId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {instances.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name} ({inst.phone || "Non connecté"})</option>
                  ))}
                </select>
              </div>

              {/* Toggle IA vs Manuel */}
              <div className="flex bg-gray-100 dark:bg-black p-1 rounded-xl">
                <button 
                  onClick={() => setUseAI(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${useAI ? "bg-white dark:bg-gray-800 shadow-sm text-indigo-600" : "text-gray-500"}`}
                >
                  <Sparkles size={16} /> Généré par IA
                </button>
                <button 
                  onClick={() => setUseAI(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${!useAI ? "bg-white dark:bg-gray-800 shadow-sm text-indigo-600" : "text-gray-500"}`}
                >
                  Manuel
                </button>
              </div>

              {!useAI && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Message du statut</label>
                  <textarea 
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="Quoi de neuf ?"
                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-32"
                  />
                </div>
              )}

              {/* Média */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Type de média</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setMediaType("image")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl transition-all ${mediaType === "image" ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600" : "border-gray-200 dark:border-gray-800 text-gray-500"}`}
                    >
                      <Image size={18} /> Image
                    </button>
                    <button 
                      onClick={() => setMediaType("video")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl transition-all ${mediaType === "video" ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600" : "border-gray-200 dark:border-gray-800 text-gray-500"}`}
                    >
                      <Video size={18} /> Vidéo
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Source du média</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://... ou glissez un fichier"
                      className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <div className="relative">
                      <input 
                        type="file" 
                        id="status-file"
                        className="hidden" 
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                      />
                      <label 
                        htmlFor="status-file"
                        className={`flex items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl cursor-pointer hover:bg-indigo-100 transition-all ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
                        ) : (
                          <Image size={20} />
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handlePostStatus}
                  disabled={isSending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3 disabled:bg-gray-400"
                >
                  <Send size={20} />
                  {isSending ? "Envoi en cours..." : "Publier maintenant"}
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="px-6 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all"
                  title="Sauvegarder comme média par défaut"
                >
                  <Save size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne de droite : Info & Aide */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Info size={20} />
              Status Hebdo
            </h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Vos statuts automatiques sont programmés tous les jours à 9h00 du matin.
            </p>
            <div className="mt-6 pt-6 border-t border-indigo-500/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium">Prochaine publication</span>
                <span className="text-xs font-bold bg-indigo-500 px-2 py-1 rounded">Demain 09:00</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
             <h3 className="font-bold mb-4 flex items-center gap-2">
               <Save size={18} className="text-indigo-600" />
               Programmation
             </h3>
             <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Heure de lancement</label>
                  <input 
                    type="time" 
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Jours de la semaine</label>
                  <div className="grid grid-cols-7 gap-1">
                    {["D", "L", "M", "M", "J", "V", "S"].map((day, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (selectedDays.includes(i)) {
                            setSelectedDays(selectedDays.filter(d => d !== i));
                          } else {
                            setSelectedDays([...selectedDays, i]);
                          }
                        }}
                        className={`w-full aspect-square text-[10px] font-bold rounded-lg transition-all ${selectedDays.includes(i) ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleSaveSettings}
                  className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={14} /> Enregistrer le planning
                </button>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
             <h3 className="font-bold mb-4">Conseils</h3>
             <ul className="text-sm text-gray-500 space-y-3 list-disc list-inside">
               <li>Utilisez des images format portrait (9:16)</li>
               <li>L'IA s'adapte au ton de votre System Prompt</li>
               <li>Les vidéos ne doivent pas dépasser 30 secondes</li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
