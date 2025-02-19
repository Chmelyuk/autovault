import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import ServiceDashboard from "./components/ServiceDashboard";
import ServiceRegistrationForm from "./components/ServiceRegistrationForm";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import './i18n';


const supabase = createClient('https://uowtueztcqvaeqzhovqb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvd3R1ZXp0Y3F2YWVxemhvdnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MDYyNDYsImV4cCI6MjA1NDA4MjI0Nn0.R-pev2rQ3YqkO0SDoyYIK7a1ZfcyUa2ezpL3WTaddx8');

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('is_service')
          .eq('id', currentUser.id)
          .single();

        if (userData?.is_service) {
          navigate('/autovault/service-dashboard', { state: { user: currentUser } });
        }
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('is_service')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.is_service) {
              navigate('/autovault/service-dashboard', { state: { user: session.user } });
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
      await supabase.auth.refreshSession();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Ошибка выхода:", error.message);
        return;
      }

      setUser(null);
      navigate("/autovault/");
    } catch (err) {
      console.error("❌ Ошибка при выходе:", err);
    }
  };

  return (
    <div className="container">
      <Routes>
        {/* Редирект с главной страницы на autovault */}
        <Route path="/" element={<Navigate to="/autovault/" replace />} />
        
        {/* Авторизация или Дашборд (если пользователь залогинен) */}
        <Route
          path="/autovault/"
          element={
            !user ? (
              <AuthForm setUser={setUser} supabase={supabase} />
            ) : (
              <Dashboard user={user} supabase={supabase} handleLogout={handleLogout} />
            )
          }
        />

        {/* Регистрация сервиса */}
        <Route
          path="/autovault/service-registration"
          element={<ServiceRegistrationForm supabase={supabase} />}
        />

        {/* Дашборд сервиса */}
        <Route
          path="/autovault/service-dashboard"
          element={
            user ? (
              <ServiceDashboard user={user} supabase={supabase} handleLogout={handleLogout} />
            ) : (
              <Navigate to="/autovault/" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}
