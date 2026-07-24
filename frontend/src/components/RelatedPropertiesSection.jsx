import React, { useEffect, useState } from "react";
import { Link2, ArrowLeft } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { getRelatedProperties } from "../services/propertyService";
import PropertyShowcaseCard from "./PropertyShowcaseCard";
import Reveal from "./Reveal";

function RelatedPropertiesSection({ propertyId, favorites, onToggleFav }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;
    const load = async () => {
      try {
        const data = await getRelatedProperties(propertyId);
        setProperties(data);
      } catch (err) {
        console.error("Failed to load related properties", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [propertyId]);

  if (loading || properties.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto" dir="rtl">
      <Reveal>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(176,141,87,0.12)" }}>
            <Link2 className="w-5 h-5" style={{ color: COFFEE.gold }} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: COFFEE.dark }}>
              عقارات مشابهة
            </h2>
            <p className="text-xs" style={{ color: "#999" }}>
              عقارات بنفس المنطقة أو الفئة أو الميزانية
            </p>
          </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((p, i) => (
          <Reveal key={p.id} delay={i * 80}>
            <PropertyShowcaseCard
              p={p}
              isFav={favorites?.has?.(p.id) || false}
              onToggleFav={onToggleFav}
              showBadge={true}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default RelatedPropertiesSection;
