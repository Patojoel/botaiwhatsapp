"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50 dark:bg-gray-900">
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        WhatsApp AI SaaS
      </h1>
      <p className="text-lg mb-8 text-gray-700 dark:text-gray-300 max-w-2xl">
        Gérez plusieurs instances de bots WhatsApp propulsés par l'IA depuis un seul tableau de bord. 
        Automatisez les réponses à vos clients avec un assistant commercial intelligent.
      </p>

      <div className="flex space-x-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition"
        >
          Accéder au Dashboard
        </Link>
      </div>
    </div>
  );
}
