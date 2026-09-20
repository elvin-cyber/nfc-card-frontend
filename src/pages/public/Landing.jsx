import { ArrowRight, Badge, Check, CreditCard, Edit3, Link2, LockKeyhole, Smartphone, UserRound, ShieldCheck, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useState } from "react";

const features = ["Name, job title and company", "Phone, email and WhatsApp", "Website and LinkedIn", "Personal bio and contact profile"];

export default function Landing() {
  const { user, logout } = useAuth();
  const [tilt,setTilt]=useState({x:0,y:0});
  const handleCardMove=e=>{const r=e.currentTarget.getBoundingClientRect();const x=((e.clientX-r.left)/r.width-.5)*16;const y=((e.clientY-r.top)/r.height-.5)*-16;setTilt({x,y});};
  const resetCard=()=>setTilt({x:0,y:0});
  const signOut = async () => { await logout(); window.location.href = "/"; };
  return <div className="landing-page">
    <header className="landing-nav">
      <Link className="landing-brand" to="/"><span className="brand-mark"><Badge size={21} /></span><span><strong>NFC Connect</strong><small>Digital identity platform</small></span></Link>
      <nav><a href="#how-it-works">How it works</a><a href="#card-details">Card details</a></nav>
      <div className="landing-nav-actions">
        {user ? <>
          <span className="landing-user-pill"><span className="landing-user-dot">{(user.name||"U").slice(0,1).toUpperCase()}</span><span><small>Signed in as</small><strong>{user.name}</strong></span></span>
          <button className="btn btn-secondary" onClick={signOut}><LogOut size={15} /> Sign out</button>
        </> : <>
          <Link className="btn btn-ghost" to="/login">Sign in</Link>
          <Link className="btn btn-primary" to="/signup">Get my card</Link>
        </>}
      </div>
    </header>
    <main>
      <section className="landing-hero"><div className="hero-copy"><div className="eyebrow">YOUR DIGITAL BUSINESS CARD</div><h1>One tap turns a card into your <em>digital identity.</em></h1><p>Share your contact details instantly with a personalised NFC card. Update your profile online without replacing the physical card.</p><div className="hero-actions"><Link className="btn btn-primary" to={user ? (user.role?.includes("ADMIN") ? "/admin" : "/profile") : "/signup"}>{user ? "Open my profile" : "Apply for a personalised card"}<ArrowRight size={17} /></Link><a className="btn btn-secondary" href="#card-details">See what's included</a></div><div className="hero-trust"><span><LockKeyhole size={14} /> Secure account</span><span><Smartphone size={14} /> NFC ready</span><span><Link2 size={14} /> Two card types</span></div></div><div className="hero-card-wrap" onMouseMove={handleCardMove} onMouseLeave={resetCard}><div className="hero-glow" /><div className="hero-card" style={{transform:`perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) rotateZ(4deg)`}}><div className="card-chip"><span /><span /><span /></div><div className="card-nfc">NFC</div><div className="hero-card-brand"><Badge size={18} /> NFC Connect</div><div className="hero-card-name">YOUR NAME</div><div className="hero-card-sub">PERSONALISED DIGITAL CARD</div><div className="hero-card-footer"><span>Tap to connect</span><Link2 size={17} /></div></div><div className="tap-badge"><span className="tap-pulse"><Smartphone size={17} /></span><div><strong>Tap & connect</strong><small>Your profile opens instantly</small></div></div></div></section>
      <section id="card-details" className="landing-section"><div className="section-heading"><div><div className="eyebrow">WHAT YOUR CARD CAN SHOW</div><h2>Your card, your details, your control.</h2></div><p>The physical NFC tag stores a secure link. Your actual contact information stays in your online profile.</p></div><div className="details-showcase"><div className="feature-panel"><div className="feature-icon"><UserRound size={20} /></div><h3>Personalised profile</h3><p>Build a professional contact page that visitors can open from your card.</p><div className="feature-list">{features.map(x => <div key={x}><Check size={15} /><span>{x}</span></div>)}</div></div><div className="mini-public-card"><div className="mini-cover" /><div className="mini-avatar">YN</div><div className="mini-body"><span className="public-verified">✓ NFC verified profile</span><h3>Your Name</h3><p>Job Title · Company</p><div className="mini-lines"><span>+971 XX XXX XXXX</span><span>you@example.com</span><span>yourwebsite.com</span></div></div></div></div></section>
      <section id="how-it-works" className="landing-section process-section"><div className="eyebrow">HOW NFC CONNECT WORKS</div><h2>From signup to tap in three steps.</h2><div className="process-grid"><div><b>01</b><CreditCard /><h3>Create your account</h3><p>Sign up once and enter the details you want visitors to see.</p></div><div><b>02</b><Edit3 /><h3>Choose your cards</h3><p>Keep up to two cards: Personal first and Company second.</p></div><div><b>03</b><Smartphone /><h3>Tap to connect</h3><p>The administrator assigns the unique NFC URL, then the card opens your live profile.</p></div></div></section>
      <section className="landing-cta"><div><div className="eyebrow">READY WHEN YOU ARE</div><h2>Start your personalised NFC identity.</h2><p>No need to replace your card when your details change.</p></div><Link className="btn btn-primary" to={user ? "/profile" : "/signup"}>{user ? "Open my profile" : "Create my account"}<ArrowRight size={17} /></Link></section>
    </main>
    <footer className="landing-footer"><div><strong>© NFC Connect</strong><span>Digital identity, connected.</span></div><div><Link to="/admin/login"><ShieldCheck size={13} /> Admin portal</Link><a href="#how-it-works">How it works</a><a href="#card-details">Card details</a>{!user && <Link to="/login">Sign in</Link>}</div></footer>
  </div>;
}
