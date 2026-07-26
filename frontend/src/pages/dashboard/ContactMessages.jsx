import React, { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle";
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  X,
  User,
  Trash2,
} from "lucide-react";
import { COFFEE } from "../../constants/constants";
import {
  getContactMessages,
  updateContactMessage,
  deleteContactMessage,
} from "../../services/contactMessageService";
import { successToast, errorToast } from "../../utils/toast";

function ContactMessages() {
  usePageTitle("رسائل التواصل — سكني");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await getContactMessages();
        setMessages(data);
      } catch (error) {
        console.log(error);
        errorToast("تعذر تحميل رسائل التواصل");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const handleMarkDone = async () => {
    try {
      await updateContactMessage(selectedMessage.id, {
        status: "replied",
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === selectedMessage.id
            ? { ...msg, status: "replied" }
            : msg
        )
      );

      setSelectedMessage({
        ...selectedMessage,
        status: "replied",
      });
      successToast("تم تحديد الرسالة كمردود عليها");
    } catch (error) {
      console.log(error);
      errorToast("تعذر تحديث حالة الرسالة");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContactMessage(messageToDelete.id);

      setMessages((prev) =>
        prev.filter((msg) => msg.id !== messageToDelete.id)
      );

      setMessageToDelete(null);
      successToast("تم حذف الرسالة بنجاح");
    } catch (error) {
      console.log(error);
      errorToast("تعذر حذف الرسالة");
    }
  };

  const openMessage = (item) => {
    setSelectedMessage(item);
    requestAnimationFrame(() => setShowModal(true));
  };

  const closeMessage = () => {
    setShowModal(false);
    setTimeout(() => setSelectedMessage(null), 200);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <h1
            className="text-2xl md:text-3xl font-extrabold"
            style={{ color: COFFEE.dark }}
          >
            رسائل التواصل
          </h1>

          <p className="text-stone-500 mt-2 text-sm md:text-base">
            جميع الرسائل المرسلة من العملاء.
          </p>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="bg-white rounded-2xl shadow overflow-hidden hidden md:block">
        <table className="w-full">
          <thead
            style={{
              background: COFFEE.dark,
              color: "#fff",
            }}
          >
            <tr>
              <th className="py-4 px-4 text-right font-bold whitespace-nowrap">الاسم</th>
              <th className="px-4 text-right font-bold whitespace-nowrap">البريد الإلكتروني</th>
              <th className="px-4 text-right font-bold whitespace-nowrap">رقم الهاتف</th>
              <th className="px-4 text-right font-bold whitespace-nowrap">الحالة</th>
              <th className="px-4 text-right font-bold whitespace-nowrap">التاريخ</th>
              <th className="px-4 text-center font-bold whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-6">
                  جاري التحميل...
                </td>
              </tr>
            ) : messages.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-6">
                  لا توجد رسائل
                </td>
              </tr>
            ) : (
              messages.map((item) => (
                <tr key={item.id} className="text-center border-b">
                  <td className="py-5 px-4">{item.name}</td>
                  <td className="px-4">{item.email || "-"}</td>
                  <td className="px-4">{item.phone}</td>
                  <td className="px-4">
                    <span
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        background:
                          item.status === "new"
                            ? "#FEF3C7"
                            : item.status === "read"
                            ? "#DBEAFE"
                            : "#DCFCE7",
                        color:
                          item.status === "new"
                            ? "#92400E"
                            : item.status === "read"
                            ? "#1D4ED8"
                            : "#166534",
                      }}
                    >
                      {item.status === "new"
                        ? "جديدة"
                        : item.status === "read"
                        ? "تمت القراءة"
                        : "تم الرد"}
                    </span>
                  </td>
                  <td className="px-4">
                    {new Date(item.created_at).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openMessage(item)}
                        className="px-4 py-2 rounded-lg text-white transition hover:opacity-90"
                        style={{
                          background: COFFEE.gold,
                        }}
                      >
                        عرض
                      </button>

                      <button
                        onClick={() => setMessageToDelete(item)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition"
                        title="حذف الرسالة"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-10 text-stone-400">جاري التحميل...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-stone-400">لا توجد رسائل</div>
        ) : (
          messages.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow p-4 border border-stone-100"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: COFFEE.cream }}
                  >
                    <User size={18} color={COFFEE.gold} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate" style={{ color: COFFEE.dark }}>
                      {item.name}
                    </p>
                    <p className="text-xs text-stone-400 truncate">{item.phone}</p>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0"
                  style={{
                    background:
                      item.status === "new"
                        ? "#FEF3C7"
                        : item.status === "read"
                        ? "#DBEAFE"
                        : "#DCFCE7",
                    color:
                      item.status === "new"
                        ? "#92400E"
                        : item.status === "read"
                        ? "#1D4ED8"
                        : "#166534",
                  }}
                >
                  {item.status === "new"
                    ? "جديدة"
                    : item.status === "read"
                    ? "تمت القراءة"
                    : "تم الرد"}
                </span>
              </div>

              {item.email && (
                <p className="text-xs text-stone-400 mb-2 truncate" dir="ltr">{item.email}</p>
              )}

              <p className="text-xs text-stone-400 mb-3">
                {new Date(item.created_at).toLocaleDateString("ar-EG")}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => openMessage(item)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: COFFEE.gold }}
                >
                  عرض
                </button>
                <button
                  onClick={() => setMessageToDelete(item)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal - تفاصيل الرسالة */}
      {selectedMessage && (
        <div
          onClick={closeMessage}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
            showModal ? "opacity-100" : "opacity-0"
          }`}
          style={{ background: "rgba(28, 20, 15, 0.55)", backdropFilter: "blur(3px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            className={`bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transition-all duration-200 ${
              showModal
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-4"
            }`}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-4 md:px-8 md:py-6"
              style={{ background: COFFEE.dark }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: COFFEE.gold }}
                >
                  <MessageSquare size={20} color={COFFEE.dark} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    تفاصيل الرسالة
                  </h2>
                  <p className="text-stone-300 text-sm">
                    {new Date(selectedMessage.created_at).toLocaleDateString(
                      "ar-EG"
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={closeMessage}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition"
              >
                <X size={20} color="#fff" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 md:p-8 space-y-5">

              <div className="grid md:grid-cols-2 gap-4">

                <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3">
                  <User size={18} color={COFFEE.gold} />
                  <div>
                    <p className="text-xs text-stone-400">الاسم</p>
                    <p className="font-semibold" style={{ color: COFFEE.dark }}>
                      {selectedMessage.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3">
                  <Phone size={18} color={COFFEE.gold} />
                  <div>
                    <p className="text-xs text-stone-400">رقم الهاتف</p>
                    <p className="font-semibold" style={{ color: COFFEE.dark }}>
                      {selectedMessage.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3 md:col-span-2">
                  <Mail size={18} color={COFFEE.gold} />
                  <div>
                    <p className="text-xs text-stone-400">البريد الإلكتروني</p>
                    <p className="font-semibold" style={{ color: COFFEE.dark }}>
                      {selectedMessage.email || "-"}
                    </p>
                  </div>
                </div>

              </div>

              <div>
                <p
                  className="font-bold mb-2 flex items-center gap-2"
                  style={{ color: COFFEE.dark }}
                >
                  <MessageSquare size={16} color={COFFEE.gold} />
                  نص الرسالة
                </p>

                <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 min-h-[120px] leading-relaxed text-stone-700">
                  {selectedMessage.message}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-8 md:py-5 border-t border-stone-100">

              {selectedMessage.status !== "replied" ? (
                <button
                  onClick={handleMarkDone}
                  className="px-6 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition"
                  style={{ background: "#16A34A" }}
                >
                  تم التواصل
                </button>
              ) : (
                <span
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ background: "#DCFCE7", color: "#166534" }}
                >
                  تم الرد بالفعل
                </span>
              )}

              <button
                onClick={closeMessage}
                className="px-6 py-3 rounded-xl border border-stone-300 font-semibold hover:bg-stone-50 transition"
                style={{ color: COFFEE.dark }}
              >
                إغلاق
              </button>

            </div>

          </div>
        </div>
      )}

      {/* Modal - تأكيد الحذف */}
      {messageToDelete && (
        <div
          onClick={() => setMessageToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(28, 20, 15, 0.55)", backdropFilter: "blur(3px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 size={24} className="text-red-500" />
            </div>

            <h3 className="text-lg font-bold mb-2" style={{ color: COFFEE.dark }}>
              حذف الرسالة؟
            </h3>

            <p className="text-stone-500 mb-6">
              هل أنت متأكد إنك عايز تحذف رسالة "{messageToDelete.name}"؟ الإجراء ده مش هينفع يتراجع فيه.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setMessageToDelete(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-stone-300 font-semibold hover:bg-stone-50 transition"
                style={{ color: COFFEE.dark }}
              >
                إلغاء
              </button>

              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 rounded-xl text-white font-semibold bg-red-500 hover:bg-red-600 transition"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ContactMessages;