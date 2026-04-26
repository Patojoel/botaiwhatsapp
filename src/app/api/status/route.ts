import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instanceId = searchParams.get("instanceId");

  if (!instanceId) {
    return NextResponse.json({ error: "Missing instanceId" }, { status: 400 });
  }

  try {
    // Tenter d'initialiser l'instance si elle n'est pas active
    await WhatsAppService.initializeInstance(instanceId);

    const { status, qrCode } = WhatsAppService.getInstanceStatus(instanceId);
    let qrDataUrl = null;

    if (qrCode) {
      qrDataUrl = await QRCode.toDataURL(qrCode);
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
