import React from "react";
import { Bell, CalendarDays, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { COFFEE } from "../../constants/constants";

function Topbar({ unreadCount = 0 }) {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className="bg-white border-b border-stone-200 flex items-center justify-between flex-wrap gap-4"
      dir="rtl"
      style={{ paddingRight: "32px", paddingLeft: "32px", paddingTop: "20px", paddingBottom: "20px" }}
    >
      {/* يمين */}
      <div className="flex flex-col gap-1.5" style={{ paddingRight: "4px" }}>
        <h1
          className="text-2xl font-extrabold leading-relaxed"
          style={{ color: COFFEE.dark }}
        >
          لوحة التحكم
        </h1>

        <div className="flex items-center gap-2 text-sm text-stone-500">
          <CalendarDays size={16} className="shrink-0" />
          <span>{today}</span>
        </div>
      </div>

      {/* شمال */}
      <div className="flex items-center gap-6">
        {/* إشعارات */}
        <button
          onClick={() => navigate("/dashboard/notifications")}
          className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition hover:bg-stone-100"
          title="الإشعارات"
        >
          <Bell size={20} />

          {unreadCount > 0 && (
            <span
              className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full ring-2 ring-white animate-pulse"
              style={{ backgroundColor: "#e0435c" }}
            />
          )}
        </button>

        {/* فاصل */}
        <div className="w-px h-9 bg-stone-200 shrink-0" />

        {/* بيانات الأدمن */}
        <div className="flex items-center gap-3">
          <UserCircle2
            size={42}
            className="shrink-0"
            style={{ color: COFFEE.gold }}
          />

          <div className="text-right leading-tight">
            <h3
              className="font-bold"
              style={{ color: COFFEE.dark }}
            >
              Admin
            </h3>

            <p className="text-xs text-stone-500 mt-0.5">
              مدير النظام
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;