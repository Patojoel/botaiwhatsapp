"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function DashboardClient({ users, stats }: any) {
  const [status, setStatus] = useState("En attente...");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          if (data.qr) setQrCode(data.qr);
          else setQrCode(null);
          setStatus(data.status || "En attente");
        }
      } catch (e) {
        setStatus("Erreur");
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async () => {
    setStatus("Deconnexion...");
    setQrCode(null);
    await fetch("/api/reconnect", { method: "POST" });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      {/* Sidebar: Navigation & Stats */}
      <div className="w-1/4 min-w-[300px] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold mb-2">🤖 Dashboard AI</h1>
          <p className="text-sm text-gray-500">
            Statut: <span className="font-semibold">{status}</span>
          </p>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handleReconnect}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow text-sm transition"
            >
              Reconnexion
            </button>
          </div>
        </div>

        {qrCode && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-center bg-gray-100 dark:bg-gray-900">
            <img
              src={qrCode}
              alt="QR Code"
              className="w-48 h-48 object-contain rounded"
            />
          </div>
        )}

        <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-800">
          <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
            <div className="text-xs text-gray-500 uppercase">Utilisateurs</div>
            <div className="text-2xl font-bold">{stats.usersCount}</div>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
            <div className="text-xs text-gray-500 uppercase">Messages</div>
            <div className="text-2xl font-bold">{stats.messagesCount}</div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Conversations
          </div>
          <ul>
            {users.map((user: any) => (
              <li
                key={user.id}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <button
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                    selectedUser?.id === user.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600"
                      : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="font-medium">{user.name || "Inconnu"}</div>
                  <div className="text-sm text-gray-500">
                    {user.phone} ({user._count.messages} msgs)
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content: Chat view */}
      <div className="flex-1 bg-white dark:bg-gray-950 flex flex-col relative">
        {selectedUser ? (
          <>
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm z-10">
              <h2 className="text-xl font-bold">
                {selectedUser.name || "Utilisateur Anonyme"}
              </h2>
              <p className="text-gray-500">{selectedUser.phone}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900 flex flex-col-reverse">
              {selectedUser.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`max-w-[70%] p-4 rounded-xl shadow-sm ${
                    msg.role === "assistant"
                      ? "bg-blue-600 text-white self-start rounded-tl-none mt-2"
                      : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 self-end rounded-tr-none mb-2"
                  }`}
                >
                  <div className="text-sm font-semibold mb-1 opacity-80 uppercase tracking-wide">
                    {msg.role}
                  </div>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-xs opacity-60 text-right mt-2">
                    {format(new Date(msg.createdAt), "dd/MM HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg
              className="w-24 h-24 mb-4 text-gray-300 dark:text-gray-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
