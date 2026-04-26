"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { BotInstance, Contact, Message } from "@prisma/client";
import { 
  Send, 
  User, 
  MoreVertical, 
  RefreshCw, 
  LogOut, 
  MessageSquare,
  Search
} from "lucide-react";

export type BotInstanceWithCounts = BotInstance & {
  statusMediaUrl?: string | null;
  statusMediaType?: string | null;
  statusSchedule?: string | null;
  _count: {
    contacts: number;
    messages: number;
  };
};

export type ContactWithMessages = Contact & {
  messages: Message[];
};

interface DashboardClientProps {
  users: ContactWithMessages[];
  stats: {
    usersCount: number;
    messagesCount: number;
  };
  instances: BotInstanceWithCounts[];
  systemPrompts: any[];
}

export default function DashboardClient({
  users,
  stats,
  instances,
  systemPrompts,
}: DashboardClientProps) {
  const [selectedInstance, setSelectedInstance] =
    useState<BotInstanceWithCounts | null>(instances[0] || null);
  const [status, setStatus] = useState("En attente...");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] =
    useState<ContactWithMessages | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (selectedContact) {
      setDisplayMessages(selectedContact.messages);
      setNextCursor(
        selectedContact.messages.length >= 10
          ? selectedContact.messages[selectedContact.messages.length - 1].id
          : null,
      );
    } else {
      setDisplayMessages([]);
      setNextCursor(null);
    }
  }, [selectedContact]);

  useEffect(() => {
    if (!selectedInstance) return;
    setSystemPrompt(selectedInstance.systemPrompt || "");
    setActivePromptId((selectedInstance as any).activePromptId || null);

    const eventSource = new EventSource(
      `/api/status/stream?instanceId=${selectedInstance.id}`,
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.qr) setQrCode(data.qr);
        else setQrCode(null);
        setStatus(data.status || "En attente");
      } catch (e) {
        console.error("SSE Parse Error:", e);
      }
    };

    eventSource.onerror = () => {
      setStatus("Erreur de connexion (Stream)");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [selectedInstance]);

  const handleReconnect = async () => {
    if (!selectedInstance) return;
    setStatus("Reconnexion...");
    setQrCode(null);
    await fetch("/api/reconnect", {
      method: "POST",
      body: JSON.stringify({ instanceId: selectedInstance.id }),
      headers: { "Content-Type": "application/json" },
    });
  };

  const handleLogout = async () => {
    if (!selectedInstance) return;
    setStatus("Deconnexion...");
    setQrCode(null);
    await fetch("/api/logout", {
      method: "POST",
      body: JSON.stringify({ instanceId: selectedInstance.id }),
      headers: { "Content-Type": "application/json" },
    });
  };

  const handleSavePrompt = async () => {
    if (!selectedInstance) return;
    setIsSavingPrompt(true);
    try {
      await fetch(`/api/instance/${selectedInstance.id}/prompt`, {
        method: "PATCH",
        body: JSON.stringify({ systemPrompt, activePromptId }),
        headers: { "Content-Type": "application/json" },
      });
      alert("Configuration sauvegardée avec succès !");
    } catch (error) {
      alert("Erreur lors de la sauvegarde du prompt.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedContact || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const res = await fetch(
        `/api/messages?contactId=${selectedContact.id}&cursor=${nextCursor}&limit=20`,
      );
      if (res.ok) {
        const data = await res.json();
        setDisplayMessages((prev) => [...prev, ...data.messages]);
        setNextCursor(data.nextCursor);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-gray-950 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
      {/* Contact List Side */}
      <div className="w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-950">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold dark:text-white">Messages</h2>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <select 
            className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs font-bold uppercase tracking-wider"
            value={selectedInstance?.id}
            onChange={(e) => {
              const inst = instances.find(i => i.id === e.target.value);
              setSelectedInstance(inst || null);
              setSelectedContact(null);
            }}
          >
            {instances.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users
            .filter(u => u.botInstanceId === selectedInstance?.id)
            .map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedContact(user)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white dark:hover:bg-gray-900 ${
                  selectedContact?.id === user.id ? "bg-white dark:bg-gray-900 border-l-4 border-indigo-600" : ""
                }`}
              >
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                   <User size={24} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm dark:text-white truncate">{user.name || user.phone}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.messages[0]?.content || "Pas de message"}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <header className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-950">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm dark:text-white">{selectedContact.name || selectedContact.phone}</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">En ligne</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400">
                  <RefreshCw size={18} />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400">
                  <MoreVertical size={18} />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30 dark:bg-gray-900">
              {nextCursor && (
                <button
                  onClick={loadMoreMessages}
                  className="w-full py-2 text-xs text-indigo-600 font-bold hover:underline"
                >
                  Charger plus...
                </button>
              )}
              {displayMessages
                .slice()
                .reverse()
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${
                        msg.role === "user"
                          ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-2 opacity-50 ${msg.role === "user" ? "text-gray-500" : "text-indigo-100"}`}>
                        {format(new Date(msg.createdAt), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Input Area */}
            <footer className="p-6 bg-white dark:bg-gray-950 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-gray-100 dark:bg-gray-900 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
                  <Send size={20} />
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
             <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/10 rounded-full flex items-center justify-center text-indigo-600 mb-4">
                <MessageSquare size={48} />
             </div>
             <h3 className="text-2xl font-black dark:text-white italic uppercase tracking-tighter">Votre centre de chat</h3>
             <p className="text-gray-500 dark:text-gray-400 max-w-sm">
               Sélectionnez une conversation sur la gauche pour commencer à discuter ou gérer vos automatisations.
             </p>
          </div>
        )}
      </div>

      {/* Right Panel: Instance Config */}
      <div className="w-80 border-l border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-950">
        <div className="p-8 space-y-8">
           <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Instance Status</h3>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">{selectedInstance?.name}</span>
                    <span className={`w-3 h-3 rounded-full ${status === "CONNECTED" ? "bg-green-500" : "bg-orange-500"}`} />
                 </div>
                 <div className="flex gap-2">
                    <button onClick={handleReconnect} className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">
                      Relancer
                    </button>
                    <button onClick={handleLogout} className="flex-1 py-2 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                      Quitter
                    </button>
                 </div>
              </div>
           </div>

            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Configuration IA</h3>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 block tracking-wider">Contexte IA (Expertise)</label>
                    <select 
                      value={activePromptId || ""}
                      onChange={(e) => setActivePromptId(e.target.value || null)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">Aucun (Texte libre uniquement)</option>
                      {systemPrompts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                 </div>

                 {!activePromptId && (
                   <div className="animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block tracking-wider">System Prompt (Libre)</label>
                      <textarea 
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-40"
                        placeholder="Ex: Tu es un assistant poli..."
                      />
                   </div>
                 )}

                 {activePromptId && (
                   <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-in zoom-in-95 duration-300">
                     <p className="text-[10px] text-indigo-600 font-bold uppercase mb-1">Contexte actif :</p>
                     <p className="text-xs text-gray-500 italic line-clamp-3">
                       {systemPrompts.find(p => p.id === activePromptId)?.content}
                     </p>
                   </div>
                 )}

                 <button 
                   onClick={handleSavePrompt}
                   disabled={isSavingPrompt}
                   className="w-full py-4 bg-gray-900 dark:bg-indigo-600 text-white rounded-3xl font-bold text-sm shadow-xl hover:scale-[1.02] transition-all"
                 >
                   {isSavingPrompt ? "Sauvegarde..." : "Enregistrer la config"}
                 </button>
              </div>
            </div>

           {qrCode && (
              <div className="bg-indigo-600 p-6 rounded-3xl text-white text-center space-y-4">
                 <p className="text-xs font-bold uppercase tracking-widest">Lier WhatsApp</p>
                 <img src={qrCode} alt="QR" className="w-full rounded-2xl bg-white p-2" />
                 <p className="text-[10px] opacity-70">Scannez ce code avec votre téléphone</p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
