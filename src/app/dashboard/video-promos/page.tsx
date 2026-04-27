import { prisma } from "@/lib/prisma";
import { Video, Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import DeleteVideoButton from "@/components/DeleteVideoButton";

export default async function VideoPromosPage() {
  const videos = await (prisma as any).productVideo.findMany({
    include: {
      product: true,
      botInstance: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Vidéos Promotionnelles</h1>
          <p className="text-gray-500">Gérez vos publicités automatiques et leur planification en statut.</p>
        </div>
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
          <Video className="w-8 h-8 text-indigo-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {videos.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 border border-dashed border-gray-800 rounded-3xl">
            <Video className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400">Aucune vidéo promo générée pour le moment.</p>
            <Link href="/dashboard/products" className="text-indigo-400 hover:underline mt-2 inline-block">
              Allez dans le catalogue pour en créer une
            </Link>
          </div>
        ) : (
          videos.map((video: any) => (
            <div key={video.id} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                  {video.videoUrl ? (
                    <video src={video.videoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <Video className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white">{video.product.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <LayoutDashboard className="w-3 h-3" /> {video.format}
                    </span>
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> {video.botInstance.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  video.status === "READY" ? "bg-green-500/10 text-green-400" :
                  video.status === "PROCESSING" ? "bg-amber-500/10 text-amber-400" :
                  "bg-red-500/10 text-red-400"
                }`}>
                  {video.status === "READY" ? <CheckCircle className="w-3 h-3" /> :
                   video.status === "PROCESSING" ? <Clock className="w-3 h-3 animate-spin" /> :
                   <AlertCircle className="w-3 h-3" />}
                  {video.status}
                </div>
                
                {video.scheduledAt && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {video.isPublished ? "Publié" : "Prévu pour"} : {format(new Date(video.scheduledAt), "d MMMM HH:mm", { locale: fr })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {video.videoUrl && (
                  <a 
                    href={video.videoUrl} 
                    target="_blank" 
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-xs font-medium"
                  >
                    Voir
                  </a>
                )}
                <DeleteVideoButton id={video.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Imports manquants pour les icônes
import { LayoutDashboard, Smartphone } from "lucide-react";
