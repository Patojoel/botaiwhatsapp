import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { videoQueue } from "@/lib/queue";
import { auth } from "@/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params;
  const session = await auth();
  console.log("[GeneratePromo] Session détectée:", session?.user ? "OUI" : "NON");
  
  // Si la session échoue mais que tu es en dev, on peut laisser passer pour tester
  if (!session?.user && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { format, botInstanceId, scheduledAt } = await req.json();

  try {
    // 1. Créer l'entrée dans la DB
    const videoPromo = await (prisma as any).productVideo.create({
      data: {
        productId,
        botInstanceId,
        format: format || "9:16",
        status: "PROCESSING",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    // 2. Ajouter le job à la file d'attente
    await videoQueue.add("render-video", {
      productId,
      format: format || "9:16",
      botInstanceId,
      videoPromoId: videoPromo.id,
    });

    return NextResponse.json({
      message: "Génération de la vidéo lancée en arrière-plan",
      videoPromoId: videoPromo.id,
    });
  } catch (error: any) {
    console.error("[GeneratePromo] Erreur:", error);
    return NextResponse.json(
      { error: "Échec du lancement de la génération" },
      { status: 500 }
    );
  }
}
