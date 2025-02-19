import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import ServiceDashboard from "./components/ServiceDashboard";
import ServiceRegistrationForm from "./components/ServiceRegistrationForm";
import { useNavigate, Routes, Route,Navigate  } from "react-router-dom";
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
    // Обновляем токен перед выходом
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
        <Route
  path="/"
  element={<Navigate to="/autovault/" replace />}
/>
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
        <Route
          path="/autovault/service-registration"
          element={<ServiceRegistrationForm supabase={supabase} />}
        />
        <Route
          path="/autovault/service-dashboard"
          element={<ServiceDashboard user={user} supabase={supabase} handleLogout={handleLogout} />}
        />
      </Routes>
    </div>
  );
}