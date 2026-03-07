"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("En attente...");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          if (data.qr) {
            setQrCode(data.qr);
          }
          setStatus(data.status || "En attente");
        }
      } catch (error) {
        console.error("Failed to fetch status:", error);
        setStatus("Erreur de connexion");
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50 dark:bg-gray-900 border">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        WhatsApp AI Bot
      </h1>
      <p className="text-lg mb-8 text-gray-700 dark:text-gray-300">
        Statut: <span className="font-semibold">{status}</span>
      </p>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-80 h-80 flex flex-col items-center justify-center">
        {qrCode ? (
          <img
            src={qrCode}
            alt="WhatsApp QR Code"
            className="w-64 h-64 object-contain"
          />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            QR Code en attente...
          </p>
        )}
      </div>
    </div>
  );
}
