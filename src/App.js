import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import ServiceDashboard from "./components/ServiceDashboard";
import ServiceRegistrationForm from "./components/ServiceRegistrationForm";
import './i18n';

const supabase = createClient(
  "https://uowtueztcqvaeqzhovqb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvd3R1ZXp0Y3F2YWVxemhvdnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MDYyNDYsImV4cCI6MjA1NDA4MjI0Nn0.R-pev2rQ3YqkO0SDoyYIK7a1ZfcyUa2ezpL3WTaddx8",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        Accept: "application/json",
      },
    },
  }
);

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setUser(null);
        navigate("/");
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
          if (profileError.code === "PGRST116" || profileError.status === 406) {
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({ id: currentUser.id, is_service: false });
            if (insertError) {
              navigate("/service-registration");
            } else {
              navigate("/");
            }
          }
          return;
        }

        if (userData?.is_service) {
          navigate("/service-dashboard", { state: { user: currentUser } });
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
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
              if (error.code === "PGRST116" || error.status === 406) {
                supabase
                  .from("profiles")
                  .insert({ id: newUser.id, is_service: false })
                  .then(({ error: insertError }) => {
                    if (insertError) {
                      navigate("/service-registration");
                    } else {
                      navigate("/");
                    }
                  });
              }
              return;
            }
            if (data?.is_service) {
              navigate("/service-dashboard", { state: { user: newUser } });
            } else {
              navigate("/");
            }
          });
      } else {
        navigate("/");
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
        return;
      }
      setUser(null);
      navigate("/");
    } catch (err) {
      // Игнорируем неизвестные ошибки
    }
  };

  return (
    <div className="container">
      <Routes>
        <Route
          path="/"
          element={
            !user ? (
              <AuthForm setUser={setUser} supabase={supabase} />
            ) : (
              <Dashboard user={user} supabase={supabase} handleLogout={handleLogout} />
            )
          }
        />
        <Route
          path="/service-registration"
          element={<ServiceRegistrationForm supabase={supabase} />}
        />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}