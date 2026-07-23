import React from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  Wallet,
  FileText,
  Home,
} from "lucide-react";
import { COFFEE } from "../../../constants/constants";

function NeedRequestDetails({
  request,
  onClose,
  onSaveStatus,
}) {
  if (!request) return null;

  // ⚠️ مهم: request.customerName كان فاضي عشان الحقل مش موجود بالاسم ده في الداتا الحقيقية.
  // حطيت fallback لأشهر الأسماء المحتملة. لو لسه فاضي، افتح الـ console واعمل
  // console.log(request) عشان تشوف اسم الحقل الصح وابعتهولي.
  const customerName =
    request.customerName ||
    request.name ||
    request.clientName ||
    request.fullName ||
    "غير محدد";

  const requestTypeMap = {
    rent: "إيجار",
    buy: "شراء",
    sell: "بيع",
  };

  const isContacted = request.status === "contacted";

  const handleMarkContacted = () => {
    onSaveStatus("contacted");
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-6"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{ backgroundColor: COFFEE.dark }}
        >
          <h2 className="text-2xl font-extrabold text-white">
            تفاصيل طلب العميل
          </h2>

          <button
            onClick={onClose}
            className="text-white hover:rotate-90 transition"
          >
            <X size={28} />
          </button>
        </div>

        <div className="p-8 space-y-10">
          {/* بيانات العميل */}
          <div>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <User size={22} />
              بيانات العميل
            </h3>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-stone-500 block mb-1">الاسم</label>
                <div className="font-bold">{customerName}</div>
              </div>

              <div>
                <label className="text-stone-500 block mb-1">الهاتف</label>
                <div className="font-bold flex items-center gap-2">
                  <Phone size={18} />
                  {request.phone || "غير محدد"}
                </div>
              </div>
            </div>
          </div>

          {/* بيانات الطلب */}
          <div>
            <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
              <Home size={22} />
              بيانات الطلب
            </h3>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-stone-500 block mb-1">نوع الطلب</label>
                <div className="font-bold">
                  {requestTypeMap[request.requestType] || "غير محدد"}
                </div>
              </div>

              <div>
                <label className="text-stone-500 block mb-1">المنطقة</label>
                <div className="font-bold flex items-center gap-2">
                  <MapPin size={18} />
                  {request.location || "غير محدد"}
                </div>
              </div>

              <div>
                <label className="text-stone-500 block mb-1">
                  نوع التشطيب
                </label>
                <div className="font-bold">
                  {request.finishType || "غير محدد"}
                </div>
              </div>

              <div>
                <label className="text-stone-500 block mb-1">
                  عدد الغرف
                </label>
                <div className="font-bold">{request.rooms || "غير محدد"}</div>
              </div>

              {request.requestType === "rent" && (
                <div>
                  <label className="text-stone-500 block mb-1">
                    مدة الإيجار
                  </label>
                  <div className="font-bold">
                    {request.rentDuration || "غير محدد"}
                  </div>
                </div>
              )}

              <div>
                <label className="text-stone-500 block mb-1">
                  الميزانية
                </label>
                <div className="font-bold flex items-center gap-2">
                  <Wallet size={18} />
                  {request.budget}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-stone-500 block mb-1">
                  ملاحظات
                </label>
                <div className="bg-stone-100 rounded-xl p-4 flex gap-2">
                  <FileText size={18} />
                  {request.notes || "لا توجد ملاحظات"}
                </div>
              </div>
            </div>
          </div>

          {/* تغيير الحالة - زرار واحد بس */}
          <div>
            <h3 className="text-xl font-bold mb-4">حالة الطلب</h3>

            <button
              onClick={handleMarkContacted}
              disabled={isContacted}
              className={`px-8 py-4 rounded-xl font-bold w-full md:w-auto transition ${
                isContacted
                  ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                  : ""
              }`}
              style={
                !isContacted
                  ? { backgroundColor: COFFEE.gold, color: COFFEE.dark }
                  : {}
              }
            >
              {isContacted ? "تم التواصل بالفعل" : "تم التواصل"}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-7 py-3 border rounded-xl"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NeedRequestDetails;