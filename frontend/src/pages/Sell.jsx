import React from "react";
import { Tag } from "lucide-react";
import ListingPage from "./ListingPage";

export default function Sell({
  properties,
  favorites,
  onToggleFav,
  onOpen,
}) {
  return (
    <ListingPage
      title="شقق للبيع"
      subtitle="أفضل الوحدات المتاحة للبيع حاليًا"
      list={properties.filter((p) => p.category === "sell")}
      icon={Tag}
      favorites={favorites}
      onToggleFav={onToggleFav}
      onOpen={onOpen}
    />
  );
}