"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { BotInstance, Contact, Message } from "@prisma/client";

export type BotInstanceWithCounts = BotInstance & {
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
}

export default function DashboardClient({
  users,
  stats,
  instances,
}: DashboardClientProps) {
  const [selectedInstance, setSelectedInstance] =
    useState<BotInstanceWithCounts | null>(instances[0] || null);
  const [status, setStatus] = useState("En attente...");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] =
    useState<ContactWithMessages | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [statusMediaUrl, setStatusMediaUrl] = useState("");
  const [isTestingStatus, setIsTestingStatus] = useState(false);

  useEffect(() => {
    if (selectedContact) {
      setDisplayMessages(selectedContact.messages);
      // On assume que le serveur a envoyé les 10 derniers (cf page.tsx)
      // Si on veut être précis, il faudrait que page.tsx renvoie aussi le cursor initial
      // Mais pour simplifier, on dira que si on a 10 messages, on peut essayer d'en charger plus.
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
    // @ts-ignore - nouveaux champs prisma
    setStatusMediaUrl(selectedInstance.statusMediaUrl || "");

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
        body: JSON.stringify({ systemPrompt }),
        headers: { "Content-Type": "application/json" },
      });
      alert("Prompt sauvegardé avec succès !");
    } catch (error) {
      alert("Erreur lors de la sauvegarde du prompt.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleTestStatus = async () => {
    if (!selectedInstance) return;
    setIsTestingStatus(true);
    try {
      const res = await fetch(`/api/instance/${selectedInstance.id}/status/test`, {
        method: "POST",
        body: JSON.stringify({
          mediaUrl: statusMediaUrl || undefined,
          mediaType: "image",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Statut envoyé ! Texte généré : " + data.text);
      } else {
        alert("Erreur : " + data.error);
      }
    } catch (err) {
      alert("Erreur lors de l'envoi du statut");
    } finally {
      setIsTestingStatus(false);
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans -m-4">
      {/* Sidebar: Navigation & Instances */}
      <div className="w-1/4 min-w-[300px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold mb-4 italic">🚀 SaaS WhatsApp AI</h1>

          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
            Vos Instances
          </label>
          <select
            className="w-full p-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded mb-4"
            value={selectedInstance?.id}
            onChange={(e) => {
              const inst = instances.find(
                (i: BotInstanceWithCounts) => i.id === e.target.value,
              );
              setSelectedInstance(inst || null);
              setSelectedContact(null);
            }}
          >
            {instances.map((inst: BotInstanceWithCounts) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>

          <p className="text-sm text-gray-500">
            Instance:{" "}
            <span className="font-semibold">{selectedInstance?.name}</span>
          </p>
          <p className="text-sm text-gray-500">
            Statut:{" "}
            <span
              className={`font-semibold ${status === "Connected" ? "text-green-500" : "text-orange-500"}`}
            >
              {status}
            </span>
          </p>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleReconnect}
              className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow text-xs transition font-medium"
            >
              Relancer
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow text-xs transition font-medium"
            >
              Déconnecter
            </button>
          </div>
        </div>

        {qrCode && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col items-center bg-indigo-50 dark:bg-indigo-900/10">
            <p className="text-xs font-bold text-indigo-600 mb-2 uppercase">
              Scanner pour connecter
            </p>
            <img
              src={qrCode}
              alt="QR Code"
              className="w-48 h-48 object-contain rounded shadow-md bg-white p-2"
            />
          </div>
        )}

        <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-800">
          <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
            <div className="text-[10px] text-gray-400 uppercase font-bold">
              Contacts
            </div>
            <div className="text-xl font-bold">
              {selectedInstance?._count?.contacts || 0}
            </div>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
            <div className="text-[10px] text-gray-400 uppercase font-bold">
              Messages
            </div>
            <div className="text-xl font-bold">
              {selectedInstance?._count?.messages || 0}
            </div>
          </div>
        </div>

        {/* Section Automatisations */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-indigo-50/30 dark:bg-indigo-900/5">
          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold mb-3 tracking-wider">
            Automatisations
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase block mb-1">URL Image/Vidéo pour Statut</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={statusMediaUrl}
                  onChange={(e) => setStatusMediaUrl(e.target.value)}
                  placeholder="https://exemple.com/image.jpg"
                  className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={async () => {
                    if (!selectedInstance) return;
                    await fetch(`/api/instance/${selectedInstance.id}/prompt`, {
                      method: "PATCH",
                      body: JSON.stringify({ statusMediaUrl }),
                      headers: { "Content-Type": "application/json" },
                    });
                    alert("Paramètres sauvegardés !");
                  }}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px]"
                >
                  💾
                </button>
              </div>
            </div>
            <button
              onClick={handleTestStatus}
              disabled={isTestingStatus || status !== "Connected"}
              className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded shadow text-xs transition font-medium flex items-center justify-center gap-2"
            >
              {isTestingStatus ? "Envoi..." : "🚀 Publier un statut test (IA)"}
            </button>
            <p className="text-[10px] text-gray-400 italic">
              * L'IA générera un texte court automatiquement.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
            Conversations de l'instance
          </div>
          <ul>
            {users
              .filter(
                (u: ContactWithMessages) =>
                  u.botInstanceId === selectedInstance?.id,
              )
              .map((user: ContactWithMessages) => (
                <li
                  key={user.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <button
                    onClick={() => setSelectedContact(user)}
                    className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                      selectedContact?.id === user.id
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600"
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="font-medium">{user.name || "Inconnu"}</div>
                    <div className="text-xs text-gray-500">{user.phone}</div>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* Main Content: Chat view */}
      <div className="flex-1 bg-white dark:bg-gray-950 flex flex-col relative">
        {selectedContact ? (
          <>
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm z-10 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  {selectedContact.name || "Utilisateur Anonyme"}
                </h2>
                <p className="text-gray-500 text-sm">{selectedContact.phone}</p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
                Instance: {selectedInstance?.name}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900 flex flex-col-reverse">
              <div className="flex flex-col space-y-4">
                {displayMessages.map((msg: Message) => (
                  <div
                    key={msg.id}
                    className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                      msg.role === "assistant"
                        ? "bg-indigo-600 text-white self-start rounded-tl-none border-indigo-700"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 self-end rounded-tr-none text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="text-[10px] font-bold mb-1 opacity-70 uppercase tracking-widest">
                      {msg.role === "assistant" ? "🤖 AI Bot" : "👤 Client"}
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <div className="text-[10px] opacity-60 text-right mt-2 font-mono">
                      {format(new Date(msg.createdAt), "HH:mm:ss")}
                    </div>
                  </div>
                ))}
                
                {nextCursor && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={loadMoreMessages}
                      disabled={isLoadingMore}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
                    >
                      {isLoadingMore ? "Chargement..." : "Charger plus de messages"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900 p-8 overflow-y-auto">
            <div className="max-w-xl w-full">
              <div className="flex flex-col items-center mb-12">
                <div className="p-6 bg-white dark:bg-gray-950 rounded-full shadow-inner mb-6">
                  <svg
                    className="w-16 h-16 text-indigo-200 dark:text-indigo-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    />
                  </svg>
                </div>
                <p className="text-xl font-medium text-gray-500 dark:text-gray-400 text-center">
                  Sélectionnez une conversation pour voir l'historique
                </p>
              </div>

              {selectedInstance && (
                <div className="bg-white dark:bg-gray-950 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Configuration de l'IA (Prompt Système)
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Définissez le comportement et la personnalité de l'IA pour cette instance WhatsApp.
                  </p>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={5}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                    placeholder="Ex: Tu es un assistant commercial amical..."
                  />
                  <button
                    onClick={handleSavePrompt}
                    disabled={isSavingPrompt}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded shadow text-sm transition font-medium"
                  >
                    {isSavingPrompt ? "Sauvegarde..." : "Sauvegarder le Prompt"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
