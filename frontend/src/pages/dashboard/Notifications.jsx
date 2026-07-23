import React, { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Mail,
  Calendar,
  ClipboardList,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { COFFEE } from "../../constants/constants";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../services/notificationService";
import { useNavigate } from "react-router-dom";
import { successToast, errorToast } from "../../utils/toast";

const TYPE_ICON = {
  reservation: ClipboardList,
  contact: MessageSquare,
  property: Bell,
};

const TYPE_COLOR = {
  reservation: "#B08D57",
  contact: "#6B8E7B",
  property: COFFEE.gold,
};

function Notifications({ setUnreadCount }) {
  usePageTitle("الإشعارات — سكني");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data || []);
      if (setUnreadCount && res?.unread_count !== undefined) {
        setUnreadCount(res.unread_count);
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, is_read: true } : n));
        if (setUnreadCount) setUnreadCount(next.filter((n) => !n.is_read).length);
        return next;
      });
    } catch {
      errorToast("حدث خطأ");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => {
        const next = prev.map((n) => ({ ...n, is_read: true }));
        if (setUnreadCount) setUnreadCount(0);
        return next;
      });
      successToast("تم تعليم الكل كمقروء");
    } catch {
      errorToast("حدث خطأ");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      errorToast("حدث خطأ");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: COFFEE.dark }}>
            الإشعارات
          </h1>
          <p className="text-stone-500 mt-2">
            {unreadCount > 0
              ? `لديك ${unreadCount} إشعار غير مقروء`
              : "لا توجد إشعارات جديدة"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition hover:scale-105"
            style={{ borderColor: "#E4D9C9", color: COFFEE.stone }}
          >
            <RefreshCw size={18} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition hover:scale-105"
              style={{ borderColor: COFFEE.gold, color: COFFEE.gold }}
            >
              <CheckCheck size={18} />
              تعليم الكل كمقروء
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-20 text-stone-400">جاري التحميل...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <BellOff size={48} className="mx-auto mb-4" style={{ color: "#E4D9C9" }} />
          <p className="text-stone-400 text-lg">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] || Bell;
            const color = TYPE_COLOR[n.type] || COFFEE.gold;

            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 p-5 rounded-2xl transition-all cursor-pointer ${
                  n.is_read ? "bg-white" : "bg-amber-50 border border-amber-200"
                }`}
                onClick={() => {
                  if (!n.is_read) handleMarkRead(n.id);
                  if (n.link) navigate(n.link);
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-bold ${
                        n.is_read ? "text-stone-600" : "text-stone-900"
                      }`}
                    >
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: COFFEE.gold }}
                      />
                    )}
                  </div>
                  <p className="text-sm text-stone-500 mt-1">{n.message}</p>
                  <p className="text-xs text-stone-400 mt-2">
                    {new Date(n.created_at).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      className="p-2 rounded-lg hover:bg-stone-100 transition"
                      title="تعليم كمقروء"
                    >
                      <Mail size={16} className="text-stone-400" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 transition"
                    title="حذف"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Notifications;
