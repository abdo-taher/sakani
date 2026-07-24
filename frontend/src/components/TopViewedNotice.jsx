import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getTopViewed } from "../services/propertyService";
import { COFFEE } from "../constants/constants";
import { fmtPrice } from "../utils/helpers";

const STORAGE_KEY = "sakani_top_viewed_shown";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function TopViewedNotice() {
  const navigate = useNavigate();

  useEffect(() => {
    const lastShown = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    const now = Date.now();

    if (now - lastShown < ONE_DAY_MS) return;

    let cancelled = false;

    getTopViewed()
      .then((data) => {
        if (cancelled || !data || data.length === 0) return;

        localStorage.setItem(STORAGE_KEY, String(now));

        const top = data[0];
        const second = data[1] || null;

        const buildCard = (p, index) => {
          const img = p.primary_image?.image_url || p.images?.[0]?.image_url || "";
          const location = p.location?.name || "";
          const views = p.cached_views || p.views || 0;
          const border = index === 0 ? `2px solid ${COFFEE.gold}` : `1px solid ${COFFEE.gold}40`;
          return `
            <div data-prop-id="${p.id}" style="cursor:pointer;display:flex;gap:12px;align-items:center;padding:10px;border-radius:12px;background:${COFFEE.creamSoft};border:${border};margin-bottom:8px;transition:transform 0.2s"
              onmouseover="this.style.transform='scale(1.02)'"
              onmouseout="this.style.transform='scale(1)'">
              ${img ? `<img src="${img}" style="width:64px;height:48px;object-fit:cover;border-radius:8px" />` : ""}
              <div style="flex:1;text-align:right">
                <div style="font-weight:700;color:${COFFEE.darkest};font-size:14px">${p.title}</div>
                <div style="font-size:12px;color:${COFFEE.gold};margin-top:2px">${location} — ${fmtPrice(p.price)}</div>
              </div>
              <div style="text-align:center;min-width:50px">
                <div style="font-size:18px;font-weight:800;color:${COFFEE.gold}">${views}</div>
                <div style="font-size:10px;color:#888">مشاهدة</div>
              </div>
            </div>
          `;
        };

        let html = `<div style="direction:rtl;text-align:right">`;
        html += buildCard(top, 0);
        if (second) html += buildCard(second, 1);
        html += `</div>`;

        Swal.fire({
          title: "🔥 الأكثر مشاهدة",
          html,
          confirmButtonText: "تم",
          confirmButtonColor: COFFEE.gold,
          background: COFFEE.creamSoft,
          width: 420,
          didOpen: (popup) => {
            popup.querySelectorAll("[data-prop-id]").forEach((el) => {
              el.addEventListener("click", () => {
                const id = el.getAttribute("data-prop-id");
                Swal.close();
                navigate(`/property/${id}`);
              });
            });
          },
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return null;
}
