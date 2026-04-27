"use client";

import { useState } from "react";
import { Video, Calendar, Layout, Play, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface VideoPromoGeneratorProps {
  productId: string;
  botInstances: { id: string; name: string }[];
}

export default function VideoPromoGenerator({ productId, botInstances }: VideoPromoGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState("9:16");
  const [botInstanceId, setBotInstanceId] = useState(botInstances[0]?.id || "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    if (!botInstanceId) {
      toast.error("Veuillez sélectionner une instance WhatsApp");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/generate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, botInstanceId, scheduledAt }),
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("La génération de la vidéo a été lancée !");
      } else {
        throw new Error("Erreur lors du lancement");
      }
    } catch (err) {
      toast.error("Échec du lancement de la génération");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-xl">
          <Video className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Générer une Vidéo Promo</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Format */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400 flex items-center gap-2">
            <Layout className="w-4 h-4" /> Format de la vidéo
          </label>
          <div className="flex gap-2">
            {["9:16", "16:9", "1:1"].map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 p-3 rounded-xl border transition-all ${
                  format === f 
                    ? "bg-indigo-500/20 border-indigo-500 text-white" 
                    : "bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                {f === "9:16" ? "Portrait" : f === "16:9" ? "Paysage" : "Carré"}
              </button>
            ))}
          </div>
        </div>

        {/* Bot Instance */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400 flex items-center gap-2">
            Instance WhatsApp (pour le statut)
          </label>
          <select
            value={botInstanceId}
            onChange={(e) => setBotInstanceId(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl p-3 outline-none focus:border-indigo-500"
          >
            {botInstances.map((bi) => (
              <option key={bi.id} value={bi.id}>{bi.name}</option>
            ))}
          </select>
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Planifier la publication (Optionnel)
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl p-3 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || success}
        className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-bold transition-all ${
          success 
            ? "bg-green-500/20 border border-green-500/50 text-green-400"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
        }`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : success ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        {loading ? "Génération en cours..." : success ? "Vidéo en cours de création !" : "Générer la vidéo promo"}
      </button>

      {success && (
        <p className="text-center text-sm text-gray-500">
          La vidéo sera générée en arrière-plan. Elle apparaîtra bientôt dans vos médias.
        </p>
      )}
    </div>
  );
}
