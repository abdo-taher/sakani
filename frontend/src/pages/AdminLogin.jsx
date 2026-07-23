import React, { useState, useEffect } from "react";
import { ShieldCheck, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { COFFEE } from "../constants/constants";
import { useNavigate } from "react-router-dom";
import { login, checkLoginStatus } from "../services/authService";
import usePageTitle from "../hooks/usePageTitle";
import { successToast, errorToast } from "../utils/toast";
/* -------------------------------------------------------------------- */
/*  صفحة: تسجيل دخول الأدمن                                              */
/* -------------------------------------------------------------------- */
function AdminLogin() {
  usePageTitle("دخول لوحة التحكم — سكني");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [shake, setShake] = useState(false);
  const [lockTime, setLockTime] = useState(0);
const navigate = useNavigate();
  const submit = async (e) => {
    // أهم سطر في الدالة: يمنع أي reload/native submit مهما كان السبب
    if (e) e.preventDefault();

    if (lockTime > 0) {
        return;
    }


  try {
    const response = await login({
      username: user,
      password: pass,
    });

   sessionStorage.setItem("token", response.token);
sessionStorage.setItem("admin", JSON.stringify(response.user));

    setError("");

    successToast("تم تسجيل الدخول بنجاح");

    navigate("/dashboard");
  } catch (error) {

    if (error.response?.status === 429) {

    const seconds = error.response.data.seconds;

    setLockTime(seconds);

    sessionStorage.setItem(
        "login_lock_until",
        Date.now() + seconds * 1000
    );

    errorToast(error.response.data.message);

    return;
}

    setError(
        error.response?.data?.message ||
        "اسم المستخدم أو كلمة المرور غير صحيحة"
    );

    errorToast("بيانات تسجيل الدخول غير صحيحة");

    setShake(true);

    setTimeout(() => {
        setShake(false);
    }, 500);
}
};
  const inputStyle = {
    backgroundColor: "#F7F3EC",
    borderColor: "#E4D9C9",
    color: COFFEE.dark,
    colorScheme: "light",
  };

  // فحص محلي (sessionStorage) عشان لو نفس التاب اتعمل له ريفريش
  useEffect(() => {

    const lockUntil = sessionStorage.getItem("login_lock_until");

    if (!lockUntil) return;

    const seconds = Math.floor(
        (Number(lockUntil) - Date.now()) / 1000
    );

    if (seconds > 0) {

        setLockTime(seconds);

    } else {

        sessionStorage.removeItem("login_lock_until");

    }

}, []);

  // فحص من السيرفر مرة واحدة لما الصفحة تفتح (IP-based)
  // ده اللي بيمنع إن حد يفتح تاب جديد ويجرب يوزرنيم تاني عادي
  useEffect(() => {

    const checkStatus = async () => {

        try {

            const response = await checkLoginStatus();

            if (response.locked) {

                setLockTime(response.seconds);

                sessionStorage.setItem(
                    "login_lock_until",
                    Date.now() + response.seconds * 1000
                );

                errorToast(response.message);

            }

        } catch (error) {

            console.log(error);

        }

    };

    checkStatus();

}, []);


   useEffect(() => {

  if (lockTime <= 0) return;

  const timer = setInterval(() => {

    setLockTime((prev) => {

      if (prev <= 1) {

    clearInterval(timer);

    sessionStorage.removeItem("login_lock_until");

    return 0;

}

      return prev - 1;

    });

  }, 1000);

  return () => clearInterval(timer);

}, [lockTime]);

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: COFFEE.darkest }}
      dir="rtl"
    >
      <div
        className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: COFFEE.gold }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: COFFEE.gold }}
      />

      <div
        className={`relative w-full max-w-4xl min-h-[440px] sm:min-h-[480px] bg-white rounded-3xl px-10 py-10 sm:px-20 sm:py-14 shadow-2xl animate-popIn flex flex-col justify-between ${shake ? "animate-shake" : ""}`}
      >
        <div>
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-float"
            style={{ backgroundColor: COFFEE.gold }}
          >
            <span className="absolute inset-0 rounded-full animate-haloPulse" />
            <ShieldCheck className="w-10 h-10 relative z-10" style={{ color: COFFEE.darkest }} />
          </div>

          <h1 className="text-4xl font-extrabold text-center mb-3" style={{ color: COFFEE.dark }}>
            دخول لوحة التحكم
          </h1>
          <p className="text-lg text-stone-400 text-center">
            هذه اللوحة مخصصة لإدارة الشركة فقط
          </p>
        </div>

        <form onSubmit={submit}>
        <div className="space-y-8">
          <div>
            <label className="block text-lg font-semibold mb-3" style={{ color: COFFEE.dark }}>
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
                className="w-full box-border rounded-xl border-2 py-5 text-xl outline-none transition-all duration-300"
                style={{ ...inputStyle, paddingRight: "60px", paddingLeft: "20px" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
              />
              <User
                className="w-7 h-7 absolute pointer-events-none"
                style={{ color: COFFEE.gold, right: "18px", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-3" style={{ color: COFFEE.dark }}>
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
                className="w-full box-border rounded-xl border-2 py-5 text-xl outline-none transition-all duration-300"
                style={{ ...inputStyle, paddingRight: "60px", paddingLeft: "60px" }}
                onFocus={(e) => (e.target.style.borderColor = COFFEE.gold)}
                onBlur={(e) => (e.target.style.borderColor = "#E4D9C9")}
              />
              <Lock
                className="w-7 h-7 absolute pointer-events-none"
                style={{ color: COFFEE.gold, right: "18px", top: "50%", transform: "translateY(-50%)" }}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute text-stone-400 hover:text-stone-600 transition-colors"
                style={{ left: "18px", top: "50%", transform: "translateY(-50%)" }}
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 text-red-500 text-base bg-red-50 border border-red-200 rounded-lg px-5 py-4 font-semibold animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div>
         

          <button
  type="submit"
  disabled={lockTime > 0}
  className="w-full py-5 rounded-xl font-bold text-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
  style={{ backgroundColor: COFFEE.gold, color: COFFEE.darkest }}
>
  {lockTime > 0
    ? `حاول بعد ${Math.ceil(lockTime / 60)} دقيقة`
    : "دخول"}
</button>
        </div>
        </form>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-popIn { animation: popIn 0.4s cubic-bezier(.34,1.56,.64,1); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }

        @keyframes haloPulse {
          0% { box-shadow: 0 0 0 0 ${COFFEE.gold}66; }
          70% { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        .animate-haloPulse { animation: haloPulse 2.4s ease-out infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }

        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}

export default AdminLogin;