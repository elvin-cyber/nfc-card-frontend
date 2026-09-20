import { ArrowRight, Badge, LockKeyhole, Moon, Sun, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useTheme } from "../../theme/ThemeContext";

export default function Login() {
  const { login } = useAuth(); const { theme, toggleTheme } = useTheme(); const navigate = useNavigate(); const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" }); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [showPassword, setShowPassword] = useState(false);
  const destination = location.pathname === "/user/login" ? "/profile" : (location.state?.from || "/dashboard");
  const submit = async (e) => { e.preventDefault(); setError(""); setBusy(true); try { const u = await login(form.email, form.password); navigate(location.pathname === "/user/login" ? "/profile" : (u.role === "ADMIN" ? "/admin" : destination), { replace: true }); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return <div className="login-page"><button className="theme-toggle login-theme" onClick={toggleTheme}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />} {theme === "light" ? "Dark mode" : "Light mode"}</button><div className="login-brand"><div className="brand-mark large"><Badge size={25} /></div><div><strong>NFC Connect</strong><span>Digital identity platform</span></div></div>
    <form className="login-card" onSubmit={submit}><div className="login-icon"><LockKeyhole size={22} /></div><div className="eyebrow">WELCOME BACK</div><h1>One tap. Your identity.</h1><p className="login-copy">Sign in to manage your personalised NFC card and public contact profile.</p>
      {error && <div className="error-box">{error}</div>}<label className="field"><span>Email</span><input type="email" required autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" /></label><label className="field"><span>Password</span><div className="password-field"><input type={showPassword ? "text" : "password"} required autoComplete="current-password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••" /><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label><button className="btn btn-primary btn-wide" disabled={busy}>{busy ? "Signing in…" : <>Sign in <ArrowRight size={17} /></>}</button>
      <p className="auth-switch"><Link to="/admin/login">Administrator sign in</Link> · New to NFC Connect? <Link to="/signup">Create your personalised card account</Link></p><p className="login-foot">Your session is secured by the NFC Connect API.</p></form></div>;
}
