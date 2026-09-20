import { Mail, Phone, Globe, Linkedin, MessageCircle, Share2, Download, Badge, AlertCircle, Edit3 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../auth/AuthContext";

export default function PublicCard() {
  const { token } = useParams(); const { user } = useAuth(); const [profile, setProfile] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { let active=true; api.getPublicCard(token).then(({profile:p})=>active&&setProfile(p)).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false)); return()=>{active=false}; }, [token]);
  // IMPORTANT: an admin-deactivated card must keep all user/card data in the database,
  // but the public NFC URL must never render that data. Show a 404-style revoked page instead.
  const cardStatus = String(profile?.card?.status || profile?.cardStatus || profile?.status || "").toUpperCase();
  const adminRevoked = Boolean(
    profile?.adminDisabled ||
    profile?.card?.adminDisabled ||
    profile?.revokedByAdmin ||
    profile?.card?.revokedByAdmin ||
    ["ADMIN_DISABLED", "ADMIN_DEACTIVATED", "REVOKED", "REVOKED_BY_ADMIN", "DISABLED", "BANNED", "INACTIVE"].includes(cardStatus)
  );
  if (adminRevoked) { return <div className="public-page"><div className="public-container"><div className="public-brand"><Badge size={19}/> NFC Connect</div><section className="public-profile-card"><div className="public-error"><AlertCircle size={35}/><h1>Card unavailable</h1><p>This NFC card has been revoked by the administrator and is no longer available.</p><p className="public-error-code">Error 404 · Card access revoked</p><Link className="btn btn-primary" to="/">Visit NFC Connect</Link></div></section></div></div>; }
  const initials = profile?.name?.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase() || "NC";
  const coverStyle = profile?.coverPhoto ? { backgroundImage:`url(${profile.coverPhoto})` } : {};
  const avatarStyle = profile?.photo ? { backgroundImage:`url(${profile.photo})` } : {};
  const downloadContact = () => { if(!profile)return; const lines=["BEGIN:VCARD","VERSION:3.0",`FN:${profile.name||""}`,`ORG:${profile.company||""}`,`TITLE:${profile.title||""}`,`TEL:${profile.phone||""}`,`EMAIL:${profile.email||""}`,`URL:${profile.website||""}`,"END:VCARD"].join("\n"); const blob=new Blob([lines],{type:"text/vcard"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`${(profile.name||"contact").replace(/\s+/g,"_")}.vcf`; a.click(); URL.revokeObjectURL(url); };
  const share = async()=>{try{if(navigator.share) await navigator.share({title:profile?.name||"NFC Connect",url:window.location.href});else await navigator.clipboard.writeText(window.location.href)}catch{}};
  if(loading)return <div className="center-page"><p>Loading NFC profile…</p></div>;
  if(error)return <div className="public-page"><div className="public-container"><div className="public-brand"><Badge size={19}/> NFC Connect</div><section className="public-profile-card"><div className="public-error"><AlertCircle size={35}/><h1>Profile unavailable</h1><p>{error}</p><Link className="btn btn-primary" to="/">Visit NFC Connect</Link></div></section></div></div>;
  return <div className="public-page"><div className="public-orb"/><div className="public-container"><div className="public-brand"><Badge size={19}/> NFC Connect</div><section className="public-profile-card"><div className="profile-cover" style={coverStyle}/><div className="public-avatar" style={avatarStyle}>{!profile?.photo && initials}</div><div className="public-main"><div className="public-verified">✓ NFC verified profile</div><h1>{profile.name}</h1><h2>{profile.title || "NFC Connect member"}</h2>{profile.company&&<p className="company">{profile.company}</p>}{profile.bio&&<p className="public-bio">{profile.bio}</p>}<div className="public-actions"><button className="btn btn-primary" onClick={downloadContact}><Download size={17}/> Save contact</button><button className="btn btn-secondary" onClick={share}><Share2 size={17}/> Share</button>{user&&<Link className="btn btn-secondary" to="/profile"><Edit3 size={17}/> Edit card</Link>}</div><div className="contact-list">{profile.phone&&<a href={`tel:${profile.phone}`}><span><Phone size={17}/></span><div><small>Phone</small><strong>{profile.phone}</strong></div></a>}{profile.email&&<a href={`mailto:${profile.email}`}><span><Mail size={17}/></span><div><small>Email</small><strong>{profile.email}</strong></div></a>}{profile.whatsapp&&<a href={`https://wa.me/${profile.whatsapp.replace(/\D/g,"")}`}><span><MessageCircle size={17}/></span><div><small>WhatsApp</small><strong>Message me</strong></div></a>}{profile.website&&<a href={/^https?:\/\//i.test(profile.website)?profile.website:`https://${profile.website}`} target="_blank" rel="noreferrer"><span><Globe size={17}/></span><div><small>Website</small><strong>{profile.website.replace(/^https?:\/\//,"")}</strong></div></a>}{profile.linkedin&&<a href={/^https?:\/\//i.test(profile.linkedin)?profile.linkedin:`https://${profile.linkedin}`} target="_blank" rel="noreferrer"><span><Linkedin size={17}/></span><div><small>LinkedIn</small><strong>{profile.linkedin.replace(/^https?:\/\//,"")}</strong></div></a>}</div></div><div className="public-footer"><span>NFC Connect digital card</span><code>{token}</code></div></section><p className="public-powered">Powered by NFC Connect</p></div></div>;
}
