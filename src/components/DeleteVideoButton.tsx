"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DeleteVideoButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cette vidéo promo ?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/video-promos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Vidéo supprimée");
        router.refresh(); // Rafraîchir la liste
      } else {
        throw new Error("Erreur");
      }
    } catch (err) {
      toast.error("Échec de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
