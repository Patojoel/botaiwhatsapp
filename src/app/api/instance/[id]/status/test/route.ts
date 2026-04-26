import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import { auth } from "@/auth";
import { aiService } from "@/modules/ai/ai.service";

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
    const { mediaUrl, mediaType } = body;

    // Générer un message via l'IA
    const statusText = await aiService.generateResponse(instanceId, [
      {
        role: "user",
        content: "Génère un court message inspirant (max 150 car.) pour un statut WhatsApp.",
      },
    ]);

    await WhatsAppService.sendStatusUpdate(instanceId, statusText, mediaUrl, mediaType);

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
