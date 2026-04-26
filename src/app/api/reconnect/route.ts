import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";

export async function POST(req: NextRequest) {
  try {
    const { instanceId } = await req.json();

    if (!instanceId) {
      return NextResponse.json(
        { error: "Missing instanceId" },
        { status: 400 },
      );
    }

    // On utilise logoutInstance puis initializeInstance pour forcer un nouveau démarrage
    await WhatsAppService.logoutInstance(instanceId);

    // Attendre un peu et relancer
    setTimeout(() => {
      WhatsAppService.initializeInstance(instanceId);
    }, 1000);

    return NextResponse.json({
      success: true,
      message: "Redémarrage de l'instance en cours",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la reconnexion" },
      { status: 500 },
    );
  }
}
