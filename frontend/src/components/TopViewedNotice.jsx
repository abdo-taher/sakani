import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getTopViewed } from "../services/propertyService";
import { COFFEE } from "../constants/constants";
import { fmtPrice } from "../utils/helpers";

const STORAGE_KEY = "sakani_random_notice_shown";
const MIN_DELAY_MS = 10 * 60 * 1000;

function getRandomDelay() {
  const min = 10 * 60 * 1000;
  const max = 60 * 60 * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function TopViewedNotice() {
  const navigate = useNavigate();

  useEffect(() => {
    const lastShown = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    const now = Date.now();

    if (now - lastShown < MIN_DELAY_MS) {
      const remaining = MIN_DELAY_MS - (now - lastShown);
      const timer = setTimeout(() => showNotice(), remaining);
      return () => clearTimeout(timer);
    }

    const delay = getRandomDelay();
    const timer = setTimeout(() => showNotice(), delay);
    return () => clearTimeout(timer);

    function showNotice() {
      getTopViewed()
        .then((data) => {
          if (!data || data.length === 0) return;

          const p = data[Math.floor(Math.random() * data.length)];
          const img = p.primary_image?.image_url || p.images?.[0]?.image_url || "";
          const location = p.location?.name || "";
          const views = p.cached_views || p.views || 0;

          localStorage.setItem(STORAGE_KEY, String(Date.now()));

          const html = `
            <div data-prop-id="${p.id}" style="direction:rtl;text-align:right;cursor:pointer;display:flex;gap:12px;align-items:center;padding:10px;border-radius:12px;background:${COFFEE.creamSoft};border:2px solid ${COFFEE.gold};transition:transform 0.2s"
              onmouseover="this.style.transform='scale(1.02)'"
              onmouseout="this.style.transform='scale(1)'">
              ${img ? `<img src="${img}" style="width:80px;height:60px;object-fit:cover;border-radius:8px" />` : ""}
              <div style="flex:1">
                <div style="font-weight:700;color:${COFFEE.darkest};font-size:15px">${p.title}</div>
                <div style="font-size:13px;color:${COFFEE.gold};margin-top:4px">${location} — ${fmtPrice(p.price)}</div>
                <div style="font-size:11px;color:#888;margin-top:2px">${views} مشاهدة</div>
              </div>
            </div>
          `;

          Swal.fire({
            title: "قد تعجبك",
            html,
            confirmButtonText: "تم",
            confirmButtonColor: COFFEE.gold,
            background: COFFEE.creamSoft,
            width: 400,
            didOpen: (popup) => {
              const card = popup.querySelector("[data-prop-id]");
              if (card) {
                card.addEventListener("click", () => {
                  Swal.close();
                  navigate(`/property/${p.id}`);
                });
              }
            },
          });
        })
        .catch(() => {});
    }
  }, [navigate]);

  return null;
}
