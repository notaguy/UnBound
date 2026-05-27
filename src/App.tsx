import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProviderSupabase } from "./context/AppContextSupabase";
import Layout from "./components/Layout";
import GuestHomePage from "./pages/GuestHomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CitizenPage from "./pages/CitizenPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <AppProviderSupabase>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<GuestHomePage />} />
            <Route path="/inregistrare" element={<RegisterPage />} />
            <Route path="/autentificare" element={<LoginPage />} />
            <Route path="/panou" element={<CitizenPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProviderSupabase>
  );
}
