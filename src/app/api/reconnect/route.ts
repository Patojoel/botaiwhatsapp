import { NextResponse } from "next/server";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";

export async function POST() {
  try {
    await WhatsAppService.reconnect();
    return NextResponse.json({
      success: true,
      message: "Reconnexion en cours",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de la reconnexion" },
      { status: 500 },
    );
  }
}
