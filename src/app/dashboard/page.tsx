import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { 
  Users, 
  MessageSquare, 
  Activity, 
  Bot,
  Zap,
  TrendingUp
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let session = await auth();
  let userId = session?.user?.id;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) redirect("/login");
    userId = firstUser.id;
  }

  const instances = await prisma.botInstance.findMany({
    where: { ownerId: userId },
    include: {
      _count: {
        select: { contacts: true, messages: true },
      },
    },
  });

  const totalMessages = await prisma.message.count({
    where: { botInstance: { ownerId: userId } },
  });

  const totalContacts = await prisma.contact.count({
    where: { botInstance: { ownerId: userId } },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Bienvenue sur votre centre de contrôle WhatsApp AI.</p>
        </div>
        <div className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest">
          {session?.user ? "Abonnement Pro" : "Mode Invité"}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Total Contacts" value={totalContacts} color="bg-blue-500" />
        <StatCard icon={MessageSquare} label="Messages Échangés" value={totalMessages} color="bg-indigo-600" />
        <StatCard icon={Bot} label="Bots Actifs" value={instances.filter(i => i.id && i.status === "CONNECTED").length} color="bg-green-500" />
        <StatCard icon={TrendingUp} label="Taux de Réponse" value="98%" color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des instances */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <Zap className="text-yellow-500" size={24} />
            Vos Instances WhatsApp
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instances.map(instance => (
              <div key={instance.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Bot size={24} />
                  </div>
                  <StatusBadge status={instance.status} />
                </div>
                <h3 className="font-bold text-lg dark:text-white">{instance.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{instance.phone || "Non connecté"}</p>
                <div className="flex gap-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                   <div className="text-xs font-medium text-gray-400">
                     <span className="font-bold text-gray-900 dark:text-gray-100">{instance._count.contacts}</span> Contacts
                   </div>
                   <div className="text-xs font-medium text-gray-400">
                     <span className="font-bold text-gray-900 dark:text-gray-100">{instance._count.messages}</span> Msgs
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dernières Activités ou Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold dark:text-white">Quick Actions</h2>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-2 rounded-3xl overflow-hidden shadow-sm">
             <ActionLink label="Nouvelle Instance" icon={Bot} color="text-green-500" />
             <ActionLink label="Gérer les statuts" icon={Activity} color="text-blue-500" />
             <ActionLink label="Paramètres IA" icon={Zap} color="text-yellow-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
      <div className={`w-10 h-10 ${color} bg-opacity-10 rounded-xl flex items-center justify-center ${color.replace('bg-', 'text-')} mb-4`}>
        <Icon size={20} />
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black mt-1 dark:text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: any = {
    CONNECTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CONNECTING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    QR_READY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    DISCONNECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colors[status] || "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

function ActionLink({ label, icon: Icon, color }: any) {
  return (
    <button className="flex items-center justify-between w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
      <div className="flex items-center gap-3">
        <Icon size={18} className={color} />
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="text-gray-300 group-hover:translate-x-1 transition-transform">→</div>
    </button>
  );
}
