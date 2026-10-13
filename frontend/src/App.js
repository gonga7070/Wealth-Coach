import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Welcome from "@/pages/Welcome";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Onboarding from "@/pages/Onboarding";
import Home from "@/pages/Home";
import Money from "@/pages/Money";
import AccountDetails from "@/pages/AccountDetails";
import Spending from "@/pages/Spending";
import Insights from "@/pages/Insights";
import Goals from "@/pages/Goals";
import GoalDetails from "@/pages/GoalDetails";
import Budget from "@/pages/Budget";
import Recurring from "@/pages/Recurring";
import Savings from "@/pages/Savings";
import Investing from "@/pages/Investing";
import Coach from "@/pages/Coach";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import Premium from "@/pages/Premium";

function Loader() {
  return (
    <div className="wc-app-bg min-h-screen grid place-items-center">
      <div className="animate-pulse text-slate-500 font-head">Loading Wealth Coach…</div>
    </div>
  );
}

function Protected({ children }) {
  const { user, booting } = useAuth();
  if (booting || user === null) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, booting } = useAuth();
  if (booting || user === null) return <Loader />;
  if (user && user.onboarded) return <Navigate to="/app" replace />;
  if (user && !user.onboarded) return <Navigate to="/onboarding" replace />;
  return children;
}

function Routing() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<PublicOnly><Auth mode="login" /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Auth mode="register" /></PublicOnly>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/app" element={<Protected><Layout /></Protected>}>
        <Route index element={<Home />} />
        <Route path="money" element={<Money />} />
        <Route path="money/:id" element={<AccountDetails />} />
        <Route path="spending" element={<Spending />} />
        <Route path="insights" element={<Insights />} />
        <Route path="goals" element={<Goals />} />
        <Route path="goals/:id" element={<GoalDetails />} />
        <Route path="budget" element={<Budget />} />
        <Route path="recurring" element={<Recurring />} />
        <Route path="savings" element={<Savings />} />
        <Route path="investing" element={<Investing />} />
        <Route path="coach" element={<Coach />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="premium" element={<Premium />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routing />
          <Toaster position="top-center" theme="dark" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
