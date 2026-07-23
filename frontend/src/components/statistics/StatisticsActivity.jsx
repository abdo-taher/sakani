import React from "react";
import {
  Building2,
  ClipboardList,
  MapPinned,
  FolderTree,
} from "lucide-react";
import { COFFEE } from "../../constants/constants";

const ICONS = {
  property: <Building2 size={20} />,
  reservation: <ClipboardList size={20} />,
  location: <MapPinned size={20} />,
  category: <FolderTree size={20} />,
};

function timeAgo(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return "منذ لحظات";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;

  const months = Math.floor(days / 30);
  return `منذ ${months} شهر`;
}

function StatisticsActivity({ activities = [], loading }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 mb-10">

      <h2
        className="text-2xl font-bold mb-8"
        style={{ color: COFFEE.dark }}
      >
        آخر نشاط بالموقع
      </h2>

      {loading ? (
        <div className="text-stone-400 text-center py-10">
          جاري التحميل...
        </div>
      ) : activities.length === 0 ? (
        <div className="text-stone-400 text-center py-10">
          لا يوجد نشاط حتى الآن
        </div>
      ) : (
        <div className="space-y-5">

          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-4 pb-5 border-b border-stone-100 last:border-none"
            >

              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${COFFEE.gold}20`,
                  color: COFFEE.gold,
                }}
              >
                {ICONS[activity.type] || <Building2 size={20} />}
              </div>

              <div className="flex-1">

                <h3
                  className="font-bold text-lg"
                  style={{ color: COFFEE.dark }}
                >
                  {activity.title}
                </h3>

                <p className="text-stone-500 mt-1">
                  {activity.description}
                </p>

              </div>

              <span className="text-sm text-stone-400 whitespace-nowrap">
                {timeAgo(activity.time)}
              </span>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default StatisticsActivity;