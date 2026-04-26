"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Save, 
  Megaphone, 
  MessageSquare, 
  Image as ImageIcon, 
  Video, 
  Users, 
  Clock, 
  X,
  Upload,
  Loader2,
  Check,
  Search,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModularScheduler } from "@/components/ModularScheduler";

interface Contact {
  id: string;
  phone: string;
  name: string | null;
}

interface BroadcastFormProps {
  instances: any[];
  initialData?: any;
}

export default function BroadcastForm({ instances, initialData }: BroadcastFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form states
  const [name, setName] = useState(initialData?.name || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || "");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">(initialData?.mediaType || "none");
  const [botInstanceId, setBotInstanceId] = useState(initialData?.botInstanceId || instances[0]?.id || "");
  const [isScheduled, setIsScheduled] = useState(!!initialData?.scheduleConfig || !!initialData?.cronPattern);
  const [cronPattern, setCronPattern] = useState(initialData?.cronPattern || "0 10 * * *");
  const [scheduleConfig, setScheduleConfig] = useState<any>(initialData?.scheduleConfig || null);
  
  // Contacts states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(initialData?.recipients?.map((r: any) => r.contactId) || []);
  const [contactSearch, setContactSearch] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  useEffect(() => {
    if (botInstanceId) {
      fetchContacts(botInstanceId);
    }
  }, [botInstanceId]);

  const fetchContacts = async (instanceId: string) => {
    setIsLoadingContacts(true);
    try {
      const res = await fetch(`/api/contacts?botInstanceId=${instanceId}`);
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setMediaUrl(data.url);
        setMediaType(file.type.startsWith("video") ? "video" : "image");
      }
    } catch (err) {
      alert("Erreur upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !content || selectedContactIds.length === 0) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name,
      content,
      mediaUrl: mediaUrl || null,
      mediaType,
      botInstanceId,
      cronPattern: isScheduled ? cronPattern : null,
      scheduleConfig: isScheduled ? scheduleConfig : null,
      contactIds: selectedContactIds
    };

    try {
      const url = initialData ? `/api/broadcasts/${initialData.id}` : "/api/broadcasts";
      const method = initialData ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/dashboard/broadcasts");
        router.refresh();
      }
    } catch (err) {
      alert("Erreur sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    (c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || 
     c.phone.includes(contactSearch))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/broadcasts"
            className="p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-500 hover:text-indigo-600 transition-all"
          >
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tight">
              {initialData ? "Modifier la diffusion" : "Nouvelle Diffusion"}
            </h1>
            <p className="text-gray-500 text-sm">Configurez votre message et sélectionnez vos destinataires.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {initialData ? "Enregistrer" : "Créer la diffusion"}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Gauche : Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white dark:bg-gray-900 rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
                <Megaphone size={18} />
              </div>
              <h3 className="font-bold uppercase text-sm tracking-widest text-gray-400">Informations de base</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Nom de la campagne</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Soldes Été 2024"
                  className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Instance WhatsApp</label>
                <select 
                  value={botInstanceId}
                  onChange={(e) => setBotInstanceId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none appearance-none"
                >
                  {instances.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
             <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
                <MessageSquare size={18} />
              </div>
              <h3 className="font-bold uppercase text-sm tracking-widest text-gray-400">Contenu du message</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 mb-2 block">Message</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Écrivez votre message ici... Utilisez des emojis pour plus d'impact ! 🚀"
                  rows={6}
                  className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-gray-400 block">Pièce jointe (Optionnel)</label>
                <div className="flex bg-gray-100 dark:bg-black p-1 rounded-2xl w-fit">
                   <button onClick={() => setMediaType("none")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${mediaType === 'none' ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600' : 'text-gray-400'}`}>Aucun</button>
                   <button onClick={() => setMediaType("image")} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${mediaType === 'image' ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600' : 'text-gray-400'}`}><ImageIcon size={14} /> Image</button>
                   <button onClick={() => setMediaType("video")} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${mediaType === 'video' ? 'bg-white dark:bg-gray-800 shadow-sm text-indigo-600' : 'text-gray-400'}`}><Video size={14} /> Vidéo</button>
                </div>

                {mediaType !== 'none' && (
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="URL de l'image/vidéo..."
                      className="flex-1 bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-2xl px-6 py-4 outline-none"
                    />
                    <label className="cursor-pointer bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all">
                      {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                      <input type="file" className="hidden" onChange={handleFileUpload} accept={mediaType === 'image' ? 'image/*' : 'video/*'} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
                    <Clock size={18} />
                  </div>
                  <h3 className="font-bold uppercase text-sm tracking-widest text-gray-400">Planification</h3>
                </div>
                <button 
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isScheduled ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isScheduled ? "left-7" : "left-1"}`} />
                </button>
             </div>

             {isScheduled && (
               <div className="animate-in slide-in-from-top duration-300 space-y-4">
                 <ModularScheduler 
                    value={scheduleConfig}
                    onChange={setScheduleConfig}
                 />
                 <div className="p-4 bg-gray-50 dark:bg-black/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-2 block">Format Expert (Cron)</label>
                    <input 
                      type="text" 
                      value={cronPattern}
                      onChange={(e) => setCronPattern(e.target.value)}
                      placeholder="0 10 * * *"
                      className="w-full bg-transparent border-none p-0 outline-none text-xs font-mono"
                    />
                 </div>
               </div>
             )}
          </section>
        </div>

        {/* Colonne Droite : Contacts & Aperçu */}
        <div className="space-y-8">
           {/* Sélecteur de Contacts */}
           <section className="bg-white dark:bg-gray-900 rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
                    <Users size={18} />
                  </div>
                  <h3 className="font-bold uppercase text-sm tracking-widest text-gray-400">Destinataires</h3>
                </div>
                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                  {selectedContactIds.length}
                </span>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Rechercher un contact..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {isLoadingContacts ? (
                   <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">Aucun contact trouvé</p>
                ) : (
                  filteredContacts.map(contact => {
                    const isSelected = selectedContactIds.includes(contact.id);
                    return (
                      <button 
                        key={contact.id}
                        onClick={() => isSelected ? setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id)) : setSelectedContactIds([...selectedContactIds, contact.id])}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-gray-50 dark:border-gray-800 hover:border-indigo-200'}`}
                      >
                        <div className="text-left overflow-hidden">
                          <p className="text-xs font-bold truncate">{contact.name || "Sans nom"}</p>
                          <p className="text-[10px] text-gray-400">{contact.phone}</p>
                        </div>
                        {isSelected && <div className="bg-indigo-600 text-white rounded-full p-1"><Check size={10} /></div>}
                      </button>
                    );
                  })
                )}
              </div>

              <button 
                onClick={() => selectedContactIds.length === contacts.length ? setSelectedContactIds([]) : setSelectedContactIds(contacts.map(c => c.id))}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline text-center"
              >
                {selectedContactIds.length === contacts.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
           </section>

           {/* Aperçu WhatsApp */}
           <section className="bg-[#E5DDD5] dark:bg-gray-950 rounded-[40px] p-4 border-[8px] border-black shadow-2xl relative overflow-hidden aspect-[9/16] max-w-[300px] mx-auto hidden lg:block">
              <div className="absolute top-0 left-0 w-full h-12 bg-[#075E54] flex items-center px-4 gap-3">
                 <div className="w-8 h-8 bg-gray-300 rounded-full" />
                 <div className="flex-1">
                   <div className="w-20 h-2 bg-white/30 rounded" />
                   <div className="w-12 h-1 bg-white/20 rounded mt-1" />
                 </div>
              </div>
              
              <div className="mt-16 space-y-4">
                 <div className="bg-white dark:bg-gray-900 p-2 rounded-lg rounded-tl-none shadow-sm max-w-[85%] animate-in slide-in-from-left">
                    {mediaUrl && (
                      <div className="mb-2 rounded-md overflow-hidden bg-gray-100">
                        {mediaType === 'video' ? <video src={mediaUrl} className="w-full" /> : <img src={mediaUrl} className="w-full" />}
                      </div>
                    )}
                    <p className="text-[10px] whitespace-pre-wrap">{content || "Votre message s'affichera ici..."}</p>
                    <p className="text-[8px] text-gray-400 text-right mt-1">12:00</p>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
