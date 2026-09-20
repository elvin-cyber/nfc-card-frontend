import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { Badge, CreditCard, UserRound, Users, Menu, Moon, Shield, Sun, X, Home, PanelLeftClose, PanelLeftOpen, ShieldCheck, LogOut, KeyRound, UserCog } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme/ThemeContext";

function Footer() {
  return <footer className="app-footer">
    <span>© NFC Connect · Digital identity, connected.</span>
    <div><Link to="/">Main website</Link><Link to="/admin/login">Admin portal</Link></div>
  </footer>;
}

export default function Layout({ children, admin = false }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(admin);

  const userLinks = [
    { to: "/profile", label: "My Profile", icon: UserRound },
    { to: "/cards", label: "My NFC Cards", icon: CreditCard },
    { to: "/password", label: "Password", icon: KeyRound }
  ];
  const adminLinks = [
    { to: "/admin/users", label: "User Management", icon: Users },
    { to: "/admin/cards", label: "NFC Cards", icon: CreditCard }
  ];
  const links = admin ? adminLinks : userLinks;
  const signOut = async () => { await logout(); navigate("/"); };
  const initials = (user?.name || "U").split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();
  const isMainAdmin = ["SUPER_ADMIN", "MAIN_ADMIN"].includes(user?.role);

  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Badge size={21} /></div><div className="brand-copy"><strong>NFC Connect</strong><span>{admin ? "Administration" : "Digital identity platform"}</span></div></div>
      <nav className="nav-list">
        <div className="nav-section">{admin ? "Administration" : "Workspace"}</div>
        {!admin && <Link to="/" className="nav-link home-link" title={collapsed ? "Main website" : undefined} data-tooltip="Main website" onClick={() => setOpen(false)}><Home size={18} /><span>Main website</span></Link>}
        {links.map(({ to, label, icon: Icon }) =>
          <NavLink key={to} to={to} end={to === "/admin"} title={collapsed ? label : undefined} data-tooltip={label} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon size={18} /><span>{label}</span>
          </NavLink>
        )}
        {admin && isMainAdmin && <><div className="nav-section">System</div><NavLink to="/admin/admins" title={collapsed ? "Admin management" : undefined} data-tooltip="Admin management" onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Shield size={18} /><span>Admin management</span></NavLink></>}
      </nav>
      <div className="sidebar-bottom">
        {admin && <a href="/user/login" target="_blank" rel="noreferrer" className="nav-link" title={collapsed ? "User portal" : undefined} data-tooltip="User portal" onClick={() => setOpen(false)}><UserCog size={18} /><span>User portal</span></a>}
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={() => setOpen(v => !v)} aria-label="Menu">{open ? <X size={21} /> : <Menu size={21} />}</button>
        <button className="icon-btn sidebar-toggle" onClick={() => setCollapsed(v => !v)} title={collapsed ? "Open sidebar" : "Close sidebar"}>{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</button>
        <div className="breadcrumb"><span>NFC Connect</span><b>/</b><span>{location.pathname.startsWith("/admin") ? "Administration" : "Account"}</span></div>
        <div className="topbar-actions">
          <button className="theme-toggle" onClick={toggleTheme}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}<span>{theme === "light" ? "Dark" : "Light"}</span></button>
          <div className="top-user"><div className="avatar small">{initials}</div><div className="top-user-copy"><strong>{user?.name}</strong><span>{admin ? "Administrator" : "Account user"}</span></div></div>
          <button className="btn btn-secondary top-signout" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </div>
      </header>
      <div className="content">{children}</div>
      <Footer />
    </main>
  </div>;
}
