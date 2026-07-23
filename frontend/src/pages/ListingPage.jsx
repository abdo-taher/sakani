import React from "react";

import PropertyGrid from "../components/PropertyGrid";

import { COFFEE } from "../constants/constants";

/* -------------------------------------------------------------------- */
/*  صفحة: شراء / بيع                                                     */
/* -------------------------------------------------------------------- */
function ListingPage({
  title,
  subtitle,
  list,
  icon: Icon,
  favorites,
  onToggleFav,
  onOpen,
}) {
  return (
    <div className="min-h-[70vh] pt-28 pb-14 px-4 sm:px-6 bg-white" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* عنوان الصفحة */}
        <div className="flex items-center gap-3 mb-2 animate-heroFade">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center animate-float"
            style={{ backgroundColor: COFFEE.gold }}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: COFFEE.darkest }}
            />
          </div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            {title}
          </h1>
        </div>

        <p className="text-stone-500 mb-10 animate-heroFade-1">
          {subtitle}
        </p>

        {/* لو مفيش بيانات */}
        {list.length === 0 ? (
          <div className="flex items-center justify-center min-h-[55vh]">
            <div
              className="bg-white border rounded-3xl shadow-lg px-10 py-14 text-center w-full max-w-2xl"
              style={{ borderColor: "#eee" }}
            >
              <h2
                className="text-3xl font-extrabold mb-4"
                style={{ color: COFFEE.dark }}
              >
                لا توجد طلبات حالياً
              </h2>

              <p
                className="text-lg"
                style={{ color: "#777" }}
              >
                سيقوم الأدمن بإضافة البيانات وستظهر هنا تلقائياً.
              </p>
            </div>
          </div>
        ) : (
          <PropertyGrid
            list={list}
            favorites={favorites}
            onToggleFav={onToggleFav}
            onOpen={onOpen}
          />
        )}
      </div>
    </div>
  );
}

export default ListingPage;