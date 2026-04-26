import { NextRequest } from "next/server";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import { auth } from "@/auth";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  /*
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  */

  const { searchParams } = new URL(req.url);
  const instanceId = searchParams.get("instanceId");

  if (!instanceId) {
    return new Response("Missing instanceId", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async (data: any) => {
        let qrDataUrl = null;
        if (data.qrCode) {
          qrDataUrl = await QRCode.toDataURL(data.qrCode);
        }
        const payload = JSON.stringify({
          status: data.status,
          qr: qrDataUrl,
        });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      // Envoyer l'état initial
      const initialStatus = WhatsAppService.getInstanceStatus(instanceId);
      await sendUpdate(initialStatus);

      // S'abonner aux mises à jour
      const listener = async (data: any) => {
        await sendUpdate(data);
      };

      WhatsAppService.events.on(`update:${instanceId}`, listener);

      // Fermer proprement
      req.signal.addEventListener("abort", () => {
        WhatsAppService.events.off(`update:${instanceId}`, listener);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
