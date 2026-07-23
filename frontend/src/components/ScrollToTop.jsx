

import React, { useState, useEffect } from "react";

import { ArrowUp } from "lucide-react";

import { COFFEE } from "../constants/constants";

/* -------------------------------------------------------------------- */
/*  مكون: زر الرجوع لأعلى                                               */
/* -------------------------------------------------------------------- */
function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center shadow-xl border-2 transition-all duration-300 hover:scale-110 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      style={{ backgroundColor: COFFEE.darkest, borderColor: COFFEE.gold }}
      title="العودة لأعلى"
    >
      <ArrowUp className="w-5 h-5" style={{ color: COFFEE.gold }} />
    </button>
  );
}

export default ScrollToTop;
