import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Mail, ArrowLeft } from "lucide-react";
import { COFFEE } from "../constants/constants";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center px-4"
      style={{ backgroundColor: COFFEE.darkest }}
      dir="rtl"
    >
      {/* Background decorations */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
        style={{ backgroundColor: COFFEE.gold }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: COFFEE.gold }}
      />

      <div className="relative text-center max-w-lg">
        {/* Big 404 */}
        <div className="mb-8">
          <h1
            className="text-[120px] sm:text-[160px] font-extrabold leading-none select-none"
            style={{
              color: "transparent",
              WebkitTextStroke: `2px ${COFFEE.gold}`,
            }}
          >
            404
          </h1>
        </div>

        {/* Logo */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: COFFEE.gold }}
        >
          <span className="text-2xl font-extrabold" style={{ color: COFFEE.darkest }}>
            س
          </span>
        </div>

        <h2
          className="text-2xl sm:text-3xl font-extrabold mb-3"
          style={{ color: COFFEE.creamSoft }}
        >
          الصفحة غير موجودة
        </h2>

        <p
          className="text-sm sm:text-base leading-relaxed mb-10"
          style={{ color: COFFEE.cream }}
        >
          يبدو إن الصفحة اللي بتدور عليها مش موجودة أو اتنقلت.
          <br />
          تواصل معنا لو محتاج مساعدة.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}
          >
            <Home size={18} />
            العودة للرئيسية
          </button>

          <a
            href="mailto:info@sakani.site"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm border-2 transition-all duration-300 hover:scale-105"
            style={{ borderColor: COFFEE.gold, color: COFFEE.gold }}
          >
            <Mail size={18} />
            info@sakani.site
          </a>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 mx-auto mt-8 text-xs transition hover:opacity-80"
          style={{ color: COFFEE.cream }}
        >
          <ArrowLeft size={14} />
          العودة للصفحة السابقة
        </button>
      </div>
    </div>
  );
}

export default NotFound;
