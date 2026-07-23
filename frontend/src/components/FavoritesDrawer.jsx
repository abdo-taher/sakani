

import React from "react";

import { Heart, Trash2, X } from "lucide-react";

import Reveal from "./Reveal";

import { COFFEE } from "../constants/constants";

import { SAMPLE_IMG, fmtPrice } from "../utils/helpers";

/* -------------------------------------------------------------------- */
/*  مكون: نافذة المفضلة                                                  */
/* -------------------------------------------------------------------- */
function FavoritesDrawer({ open, properties, favorites, onToggleFav, onOpenProperty, onClose }) {
  if (!open) return null;
  const list = properties.filter((p) => favorites.has(p.id));
  return (
    <div className="fixed inset-0 z-[95] flex justify-end animate-modalBackdropIn" style={{ backgroundColor: "rgba(20,12,8,0.55)" }} onClick={onClose}>
      <div
        className="animate-drawerIn bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl p-5"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold flex items-center gap-2" style={{ color: COFFEE.dark }}>
            <Heart className="w-5 h-5" fill="#e0435c" style={{ color: "#e0435c" }} /> المفضلة ({list.length})
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 hover:rotate-90 transition-all duration-300">
            <X className="w-5 h-5" style={{ color: COFFEE.dark }} />
          </button>
        </div>
        {list.length === 0 ? (
          <p className="text-center text-stone-400 py-16 text-sm">لسه مفيش حاجة مضافة للمفضلة، اضغط على القلب في أي عقار عشان تضيفه هنا.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {list.map((p, i) => (
              <Reveal
                key={p.id}
                delay={i * 60}
                onClick={() => { onOpenProperty(p); onClose(); }}
                className="flex gap-3 items-center bg-stone-50 rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <img src={p.images?.[0] || SAMPLE_IMG(p.id)} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: COFFEE.dark }}>{p.title}</p>
                  <p className="text-xs text-stone-400">{p.location}</p>
                  <p className="text-sm font-extrabold" style={{ color: COFFEE.gold }}>{fmtPrice(p.price)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onToggleFav(p.id); }} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


export default FavoritesDrawer;