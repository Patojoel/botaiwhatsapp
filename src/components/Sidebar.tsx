"use client";

import React from "react";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Zap, 
  Users, 
  Smartphone, 
  Settings, 
  LogOut, 
  Megaphone,
  Package,
  BrainCircuit,
  Bot
} from 'lucide-react';
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Package, label: "Catalogue Produits", href: "/dashboard/products" },
  { icon: BrainCircuit, label: "Prompts IA", href: "/dashboard/prompts" },
  { icon: MessageSquare, label: "Conversations", href: "/dashboard/chat" },
  { icon: Zap, label: "Automatisations", href: "/dashboard/automations" },
  { icon: Megaphone, label: "Diffusions", href: "/dashboard/broadcasts" },
  { icon: Users, label: "Contacts", href: "/dashboard/contacts" },
  { icon: Smartphone, label: "Instances", href: "/dashboard/instances" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
          <Bot size={32} strokeWidth={2.5} />
          <span className="text-xl font-black tracking-tighter italic uppercase">BotAI</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
