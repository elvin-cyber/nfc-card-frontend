import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import PublicCard from "./pages/public/PublicCard";
import AdminLogin from "./pages/public/AdminLogin";
import Profile from "./pages/user/Profile";
import Cards from "./pages/user/Cards";
import CardDetails from "./pages/user/CardDetails";
import Password from "./pages/user/Password";
// import TestProfile from "./pages/user/TestProfile";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminCards from "./pages/admin/AdminCards";
import AdminManagement from "./pages/admin/AdminManagement";
import NotFound from "./pages/public/NotFound";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><p>Checking your session…</p></div>;
  return user ? children : <Navigate to="/login" replace />;
}
function AdminOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><p>Checking your session…</p></div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return ["ADMIN", "SUPER_ADMIN", "MAIN_ADMIN"].includes(user.role) ? children : <Navigate to="/profile" replace />;
}
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><p>Loading…</p></div>;
  return user ? <Navigate to={user.role?.includes("ADMIN") ? "/admin/cards" : "/profile"} replace /> : children;
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
    <Route path="/user/login" element={<Login />} />
    <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route path="/c/:token" element={<PublicCard />} />

    <Route path="/dashboard" element={<Protected><Navigate to="/profile" replace /></Protected>} />
    <Route path="/profile" element={<Protected><Profile /></Protected>} />
    {/* <Route path="/profile/test" element={<Protected><TestProfile /></Protected>} /> */}
    <Route path="/cards" element={<Protected><Cards /></Protected>} />
    <Route path="/password" element={<Protected><Password /></Protected>} />
    <Route path="/cards/:id" element={<Protected><CardDetails /></Protected>} />

    <Route path="/admin" element={<AdminOnly><Navigate to="/admin/cards" replace /></AdminOnly>} />
    <Route path="/admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
    <Route path="/admin/users/:id" element={<AdminOnly><AdminUserDetails /></AdminOnly>} />
    <Route path="/admin/cards" element={<AdminOnly><AdminCards /></AdminOnly>} />
    <Route path="/admin/admins" element={<AdminOnly><AdminManagement /></AdminOnly>} />
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
