import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ADMIN_LOGIN_TOKEN } from "../constants/constants";

export default function useIdleLogout() {

    const timer = useRef(null);
    const navigate = useNavigate();

    const logout = () => {

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("admin");

        navigate(`/admin/${ADMIN_LOGIN_TOKEN}/login`, { replace: true });

    };

    const resetTimer = () => {

        clearTimeout(timer.current);

        timer.current = setTimeout(() => {

            logout();

        }, 30 * 60 * 1000); // 10 ثواني (تجربة) - غيّرها للقيمة الحقيقية قبل الإنتاج

    };

    useEffect(() => {

        resetTimer();

        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("keydown", resetTimer);
        window.addEventListener("click", resetTimer);
        window.addEventListener("scroll", resetTimer);

        return () => {

            clearTimeout(timer.current);

            window.removeEventListener("mousemove", resetTimer);
            window.removeEventListener("keydown", resetTimer);
            window.removeEventListener("click", resetTimer);
            window.removeEventListener("scroll", resetTimer);

        };

    }, []);

}