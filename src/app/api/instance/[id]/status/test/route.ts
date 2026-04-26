import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import { auth } from "@/auth";
import { aiService } from "@/modules/ai/ai.service";
import fs from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  
  // On laisse passer pour le test si désactivé
  /*
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  */

  const { id: instanceId } = await params;

  try {
    const body = await req.json();
    const { mediaUrl, mediaType, customText } = body;

    // Si c'est un fichier local (upload), on le convertit en Base64 pour l'IA
    let aiMediaUrl = mediaUrl;
    if (mediaUrl && mediaUrl.includes("/uploads/")) {
      try {
        const fileName = mediaUrl.split("/uploads/")[1];
        const filePath = path.join(process.cwd(), "public", "uploads", fileName);
        console.log(`[TestRoute] Lecture du fichier: ${filePath}`);
        
        const fileBuffer = await fs.readFile(filePath);
        const base64Image = fileBuffer.toString("base64");
        const ext = path.extname(fileName).toLowerCase().replace(".", "");
        const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
        aiMediaUrl = `data:${mimeType};base64,${base64Image}`;
      } catch (err) {
        console.error(`[TestRoute] Erreur lecture fichier (${mediaUrl}):`, err);
      }
    }

    // Utiliser le texte personnalisé ou générer via l'IA (avec analyse d'image si dispo)
    const statusText = customText || await aiService.generateResponse(
      instanceId, 
      [
        {
          role: "user",
          content: aiMediaUrl && mediaType === "image" 
            ? "Analyse cette image et génère un court message inspirant ou une légende adaptée (max 150 car.) pour mon statut WhatsApp."
            : "Génère un court message inspirant (max 150 car.) pour un statut WhatsApp.",
        },
      ],
      aiMediaUrl && mediaType === "image" ? aiMediaUrl : undefined
    );

    await WhatsAppService.sendStatusUpdate(instanceId, statusText, aiMediaUrl, mediaType);

    return NextResponse.json({ 
      success: true, 
      message: "Statut envoyé avec succès",
      text: statusText 
    });
  } catch (error: any) {
    console.error("Test Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send test status" },
      { status: 500 },
    );
  }
}
