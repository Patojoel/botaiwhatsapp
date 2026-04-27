import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  
  // Si la session échoue mais que tu es en dev, on peut laisser passer
  if (!session?.user && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // 1. Trouver la vidéo
    const video = await (prisma as any).productVideo.findUnique({
      where: { id }
    });

    if (!video) {
      return NextResponse.json({ error: "Vidéo non trouvée" }, { status: 404 });
    }

    // 2. Supprimer le fichier physique si présent
    if (video.videoUrl && video.videoUrl.startsWith("/uploads/")) {
      try {
        const absolutePath = path.join(process.cwd(), "public", video.videoUrl);
        await fs.unlink(absolutePath);
      } catch (err) {
        console.warn("[DeleteVideo] Erreur suppression fichier physique:", err);
      }
    }

    // 3. Supprimer de la DB
    await (prisma as any).productVideo.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Vidéo supprimée avec succès" });
  } catch (error: any) {
    console.error("[DeleteVideo] Erreur:", error);
    return NextResponse.json({ error: "Échec de la suppression" }, { status: 500 });
  }
}
