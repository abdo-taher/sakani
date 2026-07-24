import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getUser } from "../services/authService";
import { ADMIN_LOGIN_TOKEN } from "../constants/constants";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");

      if (!token) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const user = await getUser();

        if (user.role === "admin") {
          setAuthorized(true);
        } else {
          sessionStorage.clear();
          localStorage.removeItem("token");
          localStorage.removeItem("admin");
          localStorage.removeItem("admin_remember");
          setAuthorized(false);
        }
      } catch (error) {
        sessionStorage.clear();
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        localStorage.removeItem("admin_remember");
        setAuthorized(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        جاري التحقق...
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to={`/admin/${ADMIN_LOGIN_TOKEN}/login`} replace />;
  }

  return children;
}

export default ProtectedRoute;