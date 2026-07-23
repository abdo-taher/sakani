import React from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTelegram,
  FaWhatsapp,
} from "react-icons/fa6";

import { COFFEE } from "../constants/constants";

/* -------------------------------------------------------------------- */
/*  Footer                                                               */
/* -------------------------------------------------------------------- */
function Footer() {
  const quickLinks = [
  { label: "الرئيسية", path: "/" },
  { label: "شراء", path: "/buy" },

  { label: "إيجار", path: "/rent" },
  { label: "محتاج اي؟", path: "/need" },
];
const navigate = useNavigate();
  const socialLinks = [
    { icon: FaWhatsapp, href: "https://chat.whatsapp.com/DIZms7FvL198Vb1mssASbL", label: "واتساب" },
    { icon: FaInstagram, href: "https://instagram.com", label: "إنستجرام" },
    { icon: FaFacebookF, href: "https://www.facebook.com/share/1LY2JvTmGu/", label: "فيسبوك" },
    { icon: FaTelegram, href: "https://t.me/sakani264", label: "تليجرام" },
  ];

  return (
    <footer
      className="pt-2"
      style={{ backgroundColor: COFFEE.darkest, marginTop: "24px" }}
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-6 items-start">
          {/* العلامة والوصف */}
          <div className="sm:col-span-2 lg:col-span-2 sm:pr-3">
            <div className="flex items-center gap-2 mb-2.5 sm:mb-3">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: COFFEE.gold }}
              >
                <Building2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color: COFFEE.darkest }} />
              </div>
              <span className="text-xl sm:text-2xl font-extrabold" style={{ color: COFFEE.creamSoft }}>
                سكني
              </span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed max-w-md" style={{ color: COFFEE.cream }}>
              شريكك العقاري الموثوق في دمياط ودمياط الجديدة، نقدم خدمات البيع
              والشراء والإيجار بثقة وخبرة تمتد لسنوات.
            </p>
          </div>

          {/* روابط سريعة */}
          <div>
            <h3
              className="text-xs sm:text-sm font-bold mb-2 sm:mb-3.5 tracking-[0.12em]"
              style={{ color: COFFEE.gold }}
            >
              روابط سريعة
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-sm sm:text-base hover:underline transition-colors"
                    style={{ color: COFFEE.cream }}
                    onMouseEnter={(e) => (e.target.style.color = COFFEE.gold)}
                    onMouseLeave={(e) => (e.target.style.color = COFFEE.cream)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* بيانات التواصل */}
          <div>
            <h3
              className="text-xs sm:text-sm font-bold mb-2 sm:mb-3.5 tracking-[0.12em]"
              style={{ color: COFFEE.gold }}
            >
              تواصل معنا
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: COFFEE.gold }} />
                <span className="text-sm sm:text-base" style={{ color: COFFEE.cream }}>01067725976</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: COFFEE.gold }} />
                <span className="text-sm sm:text-base break-all" style={{ color: COFFEE.cream }}>
                  sakani.eg23@gmail.com
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: COFFEE.gold }} />
                <span className="text-sm sm:text-base" style={{ color: COFFEE.cream }}>دمياط الجديدة، مصر</span>
              </li>
            </ul>
          </div>

          {/* السوشيال ميديا */}
          <div>
            <h3
              className="text-xs sm:text-sm font-bold mb-2 sm:mb-3.5 tracking-[0.12em]"
              style={{ color: COFFEE.gold }}
            >
              تابعنا
            </h3>
            <div className="flex flex-nowrap gap-1.5">
              {socialLinks.map((s, i) => {
                const Icon = s.icon;
                return (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-1"
                    style={{ backgroundColor: "rgba(176,141,87,0.15)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COFFEE.gold)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "rgba(176,141,87,0.15)")
                    }
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: COFFEE.gold }} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* شريط سفلي */}
      <div style={{ borderTop: "1px solid rgba(245,239,230,0.12)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p className="text-xs sm:text-sm" style={{ color: COFFEE.cream }}>
            © {new Date().getFullYear()} سكني. جميع الحقوق محفوظة.
          </p>
          <p className="text-xs sm:text-sm" style={{ color: COFFEE.cream }}>
            صنع بكل حب في دمياط
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;