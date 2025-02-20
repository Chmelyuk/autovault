import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import ServiceDashboard from "./components/ServiceDashboard";
import ServiceRegistrationForm from "./components/ServiceRegistrationForm";
import './i18n';

// Инициализация Supabase клиента
const supabase = createClient(
  "https://uowtueztcqvaeqzhovqb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvd3R1ZXp0Y3F2YWVxemhvdnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MDYyNDYsImV4cCI6MjA1NDA4MjI0Nn0.R-pev2rQ3YqkO0SDoyYIK7a1ZfcyUa2ezpL3WTaddx8"
);

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Ошибка получения сессии:", error.message);
        return;
      }
      const currentUser = data?.session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: userData, error: profileError } = await supabase
          .from("profiles")
          .select("is_service")
          .eq("id", currentUser.id)
          .single();

        if (profileError) {
          console.error("Ошибка получения профиля:", profileError.message);
          return;
        }

        if (userData?.is_service) {
          navigate("/service-dashboard", { state: { user: currentUser } });
        }
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user || null;
      setUser(newUser);
      if (newUser) {
        supabase
          .from("profiles")
          .select("is_service")
          .eq("id", newUser.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error("Ошибка получения профиля при изменении состояния:", error.message);
              return;
            }
            if (data?.is_service) {
              navigate("/service-dashboard", { state: { user: newUser } });
            }
          });
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Ошибка при выходе из системы:", error.message);
        return;
      }
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Неизвестная ошибка при выходе:", err);
    }
  };

  return (
    <div className="container">
      <Routes>
        <Route path="/" element={!user ? <AuthForm setUser={setUser} supabase={supabase} /> : <Dashboard user={user} supabase={supabase} handleLogout={handleLogout} />} />
        <Route path="/service-registration" element={<ServiceRegistrationForm supabase={supabase} />} />
        <Route
          path="/service-dashboard"
          element={
            user ? (
              <ServiceDashboard user={user} supabase={supabase} handleLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* Перенаправление с неизвестных маршрутов на главную страницу */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/autovault">
      <AppContent />
    </BrowserRouter>
  );
}