import { MessageCircle } from "lucide-react";

import { ENCOM_TOKENS } from "@/system/designTokens";

export function FloatingWhatsAppButton() {
  return (
    <a
      className="floating-whatsapp"
      href={ENCOM_TOKENS.links.whatsapp}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir conversa no WhatsApp"
      title="Falar no WhatsApp"
    >
      <MessageCircle size={26} aria-hidden="true" />
    </a>
  );
}
