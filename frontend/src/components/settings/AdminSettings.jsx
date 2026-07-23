import React, { useState } from "react";
import { User, Mail, Lock, ImagePlus } from "lucide-react";
import { COFFEE } from "../../constants/constants";
import Swal from "sweetalert2";
import { updateAdminCredentials } from "../../services/settingsService";
function AdminSettings() {
  const [name, setName] = useState("");
 
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    Swal.fire({
      icon: "error",
      title: "خطأ",
      text: "كلمتا المرور غير متطابقتين.",
    });
    return;
  }

  try {
    await updateAdminCredentials({
      username: name,
      password,
      password_confirmation: confirmPassword,
    });

    Swal.fire({
      icon: "success",
      title: "تم الحفظ",
      text: "تم تحديث اسم المستخدم وكلمة المرور بنجاح.",
      confirmButtonColor: COFFEE.gold,
    });

    setPassword("");
    setConfirmPassword("");
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "حدث خطأ",
      text:
        error.response?.data?.message ||
        "تعذر تحديث البيانات.",
    });
  }
};

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 mb-8">

      <h2
        className="text-2xl font-bold mb-8"
        style={{ color: COFFEE.dark }}
      >
        بيانات الأدمن
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >

        <div>
          <label className="flex items-center gap-2 mb-2 font-semibold">
            <User size={18} />
            اسم الأدمن
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الأدمن"
            className="w-full border rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-yellow-200"
          />
        </div>


       

        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <Lock size={18} />
              كلمة المرور الجديدة
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full border rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-yellow-200"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2 font-semibold">
              <Lock size={18} />
              تأكيد كلمة المرور
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="********"
              className="w-full border rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-yellow-200"
            />
          </div>

        </div>

        <div className="flex justify-end">

          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-bold"
            style={{
              backgroundColor: COFFEE.gold,
              color: COFFEE.dark,
            }}
          >
            حفظ بيانات الأدمن
          </button>

        </div>

      </form>

    </div>
  );
}

export default AdminSettings;