import React from "react";
import { Tag } from "lucide-react";
import ListingPage from "./ListingPage";
import usePageTitle from "../hooks/usePageTitle";

export default function Sell({
  properties,
  favorites,
  onToggleFav,
  onOpen,
}) {
  usePageTitle("بيع عقارات — سكني");
  return (
    <ListingPage
      title="شقق للبيع"
      subtitle="أفضل الوحدات المتاحة للبيع حاليًا"
      list={properties.filter((p) => p.category?.slug === "sell")}
      icon={Tag}
      favorites={favorites}
      onToggleFav={onToggleFav}
      onOpen={onOpen}
    />
  );
}