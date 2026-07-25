import React from "react";
import { Tag, Home, ChevronLeft } from "lucide-react";
import ListingPage from "./ListingPage";
import usePageTitle from "../hooks/usePageTitle";
import { useNavigate } from "react-router-dom";
import { COFFEE } from "../constants/constants";

export default function Sell({
  properties,
  favorites,
  onToggleFav,
  onOpen,
}) {
  usePageTitle("بيع عقارات — سكني");
  const navigate = useNavigate();

  const breadcrumb = (
    <nav className="flex items-center gap-1.5 text-xs sm:text-sm" style={{ color: COFFEE.stone }}>
      <button onClick={() => navigate("/")} className="flex items-center gap-1 hover:underline hover:opacity-80 transition" style={{ color: COFFEE.dark }}>
        <Home className="w-3.5 h-3.5" /> الرئيسية
      </button>
      <ChevronLeft className="w-2.5 h-2.5" />
      <span className="font-bold" style={{ color: COFFEE.gold }}>البيع</span>
    </nav>
  );

  return (
    <ListingPage
      title="شقق للبيع"
      subtitle="أفضل الوحدات المتاحة للبيع حاليًا"
      list={properties.filter((p) => p.category?.slug === "sell")}
      icon={Tag}
      favorites={favorites}
      onToggleFav={onToggleFav}
      onOpen={onOpen}
      breadcrumb={breadcrumb}
    />
  );
}