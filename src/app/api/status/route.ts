import { NextResponse } from "next/server";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import QRCode from "qrcode";

export async function GET() {
  try {
    // Initialiser Baileys si ce n'est pas déjà fait
    WhatsAppService.initialize();

    const status = WhatsAppService.status;
    let qrDataUrl = null;

    if (WhatsAppService.qrCode) {
      qrDataUrl = await QRCode.toDataURL(WhatsAppService.qrCode);
    }

    return NextResponse.json({
      status,
      qr: qrDataUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 },
    );
  }
}
