"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import { useEffect, useState } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

const spec = {
  openapi: "3.0.0",
  info: {
    title: "WhatsApp AI Bot API",
    version: "1.0.0",
    description: "Documentation de l'API Phase 5",
  },
  paths: {
    "/api/status": {
      get: {
        summary: "Obtenir le statut WhatsApp",
        responses: {
          "200": {
            description: "Statut et QR Code",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    qr: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/reconnect": {
      post: {
        summary: "Forcer la reconnexion WhatsApp",
        responses: {
          "200": { description: "Reconnexion démarrée" },
        },
      },
    },
  },
};

export default function ApiDocs() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="bg-white min-h-screen">
      <SwaggerUI spec={spec} />
    </div>
  );
}
