
import React from "react";
import { MessageCircle } from "lucide-react";

/* -------------------------------------------------------------------- */
/*  مكون: زر واتساب عائم                                                 */
/* -------------------------------------------------------------------- */
function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/201067725976"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl animate-whatsapp hover:scale-110 transition-transform"
      style={{ backgroundColor: "#25D366" }}
      title="تواصل عبر واتساب"
    >
      <span className="absolute inset-0 rounded-full animate-pulseRing" style={{ backgroundColor: "#25D366" }} />
      <MessageCircle className="w-7 h-7 text-white relative z-10" />
    </a>
  );
}


export default FloatingWhatsApp;