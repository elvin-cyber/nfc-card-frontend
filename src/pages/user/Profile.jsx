import { Save, UserRound, Camera, Download, FileText, CreditCard, Plus, ExternalLink, FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../services/api";

const emptyProfile = {
  fullName: "",
  jobTitle: "",
  company: "",
  phone: "",
  email: "",
  whatsapp: "",
  linkedin: "",
  website: "",
  bio: "",
  photo: "",
  coverPhoto: "",
  documentUrl: "",
  documentDescription: ""
};

const readFile = file => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(file);
});

// Keep image payloads small enough for MongoDB documents and the API body limit.
const readImage = file => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = r.result;
  };
  r.onerror = reject;
  r.readAsDataURL(file);
});

const toForm = (u, type) => {
  const p = type === "OFFICE" ? (u.officeProfile || {}) : (u.personalProfile || u.profile || {});
  return {
    ...emptyProfile,
    fullName: type === "PERSONAL" ? (u.name || "") : (p.fullName || ""),
    jobTitle: p.jobTitle || "",
    company: p.company || "",
    phone: p.phone || "",
    email: type === "PERSONAL" ? (u.email || "") : (p.email || ""),
    whatsapp: p.whatsapp || "",
    linkedin: p.linkedin || "",
    website: p.website || "",
    bio: p.bio || "",
    photo: p.photo || p.photoUrl || "",
    coverPhoto: p.coverPhoto || p.coverPhotoUrl || "",
    resume: p.resume || "",
    resumeName: p.resumeName || ""
  };
};

export default function Profile() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProfile);
  const [profiles, setProfiles] = useState({ PERSONAL: emptyProfile, OFFICE: emptyProfile });
  const [cards, setCards] = useState([]);
  const [profileMode, setProfileMode] = useState("PERSONAL");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [{ user: u }, c] = await Promise.all([api.getProfile(), api.getCards()]);
      const next = {
        PERSONAL: toForm(u, "PERSONAL"),
        OFFICE: toForm(u, "OFFICE")
      };
      setProfiles(next);
      setForm(next[profileMode]);
      const ordered = (c.cards || []).slice().sort(
        (a,b) => ({ PERSONAL:0, COMPANY:1 }[a.cardType] ?? 9) - ({ PERSONAL:0, COMPANY:1 }[b.cardType] ?? 9)
      );
      setCards(ordered);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const switchMode = type => {
    const nextMode = type;
    setProfiles(p => ({ ...p, [profileMode]: form }));
    setProfileMode(nextMode);
    setForm(profiles[nextMode] || emptyProfile);
  };

  const change = e => setForm(v => ({ ...v, [e.target.name]: e.target.value }));

  const upload = async (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (key !== "resume" && !file.type.startsWith("image/")) {
      window.dispatchEvent(new CustomEvent("nfc:toast", { detail: { message: "Please select an image file.", type: "error" } }));
      e.target.value = "";
      return;
    }
    try {
      const data = key === "resume" ? await readFile(file) : await readImage(file);
      setForm(v => ({ ...v, [key]: data, ...(key === "resume" ? { resumeName: file.name } : {}) }));
    } catch {
      window.dispatchEvent(new CustomEvent("nfc:toast", { detail: { message: "Unable to read the selected file.", type: "error" } }));
    }
    e.target.value = "";
  };

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.updateProfile({ ...form, profileType: profileMode });
      const returned = r.user;
      const nextForm = toForm(returned, profileMode);
      setForm(nextForm);
      setProfiles(p => ({ ...p, [profileMode]: nextForm }));
      await refresh();
      window.dispatchEvent(new CustomEvent("nfc:toast", { detail: { message: `${profileMode === "PERSONAL" ? "Personal" : "Office"} profile saved successfully.`, type: "success" } }));
    } catch {} finally {
      setSaving(false);
    }
  };

  const download = () => {
    const lines = [
      "BEGIN:VCARD","VERSION:3.0",`FN:${form.fullName || ""}`,`ORG:${form.company || ""}`,
      `TITLE:${form.jobTitle || ""}`,`TEL:${form.phone || ""}`,`EMAIL:${form.email || ""}`,
      `URL:${form.website || ""}`,"END:VCARD"
    ].join("\n");
    const url = URL.createObjectURL(new Blob([lines], { type:"text/vcard" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${(form.fullName || "contact").replace(/\s+/g, "_")}.vcf`; a.click();
    URL.revokeObjectURL(url);
  };

  const requestCard = async type => {
    if (cards.some(c => c.cardType === type)) {
      window.dispatchEvent(new CustomEvent("nfc:toast", { detail: { message: `Your ${type === "COMPANY" ? "office" : "personal"} card already exists.`, type:"info" } }));
      return;
    }
    if (cards.length >= 2) {
      window.dispatchEvent(new CustomEvent("nfc:toast", { detail: { message:"You can have a maximum of two cards: Personal and Office.", type:"error" } }));
      return;
    }
    try {
      // Persist the currently edited profile before creating the card so the new
      // card immediately points at the exact Personal/Office data the user sees.
      const saved = await api.updateProfile({ ...form, profileType: profileMode });
      const savedForm = toForm(saved.user, profileMode);
      setForm(savedForm);
      setProfiles(p => ({ ...p, [profileMode]: savedForm }));
      await refresh();

      const requestedProfileType = type === "COMPANY" ? "OFFICE" : "PERSONAL";
      if (profileMode !== requestedProfileType) {
        const target = profiles[requestedProfileType] || emptyProfile;
        await api.updateProfile({ ...target, profileType: requestedProfileType });
      }

      const r = await api.createCard({
        label: `${type === "PERSONAL" ? "Personal" : "Office"} NFC card`,
        cardType: type
      });
      if (r.card) setCards(prev => [...prev, r.card].sort(
        (a,b) => ({ PERSONAL:0, COMPANY:1 }[a.cardType] ?? 9) - ({ PERSONAL:0, COMPANY:1 }[b.cardType] ?? 9)
      ));
      window.dispatchEvent(new CustomEvent("nfc:toast", { detail: { message:`${type === "PERSONAL" ? "Personal" : "Office"} card requested.`, type:"success" } }));
    } catch {}
  };

  const openTestProfile = () => {
    // Save the current unsaved edits locally so the test page can show exactly what
    // the user is currently editing without changing the server profile.
    const payload = JSON.stringify({ type: profileMode, profile: form, name: user?.name, email: user?.email });
    sessionStorage.setItem("nfc_test_profile", payload);
    window.open("/profile/test", "_blank", "noopener,noreferrer");
  };

  return <Layout>
    <PageHeader
      eyebrow="MY ACCOUNT"
      title={`Welcome, ${profiles.PERSONAL.fullName || user?.name || "there"} 👋`}
      description="Keep your Personal and Office identities separate. Each NFC card uses the matching profile."
      action={<div className="page-header-actions"><button className="btn btn-secondary" onClick={openTestProfile}><FlaskConical size={16}/> Test profile</button><button className="btn btn-secondary" onClick={download}><Download size={16}/> Download contact</button></div>}
    />

    <div className="profile-mode-switch">
      <div><span className="eyebrow">PROFILE VIEW</span><strong>Switch between your personal and office identity</strong></div>
      <div className="segmented">
        <button type="button" className={profileMode==="PERSONAL" ? "active" : ""} onClick={() => switchMode("PERSONAL")}>Personal</button>
        <button type="button" className={profileMode==="OFFICE" ? "active" : ""} onClick={() => switchMode("OFFICE")}>Office</button>
      </div>
    </div>

    <form className="profile-layout" onSubmit={submit}>
      <section className="panel form-panel">
        <div className="panel-heading">
          <div><h2>{profileMode==="PERSONAL" ? "Edit my personal profile" : "Edit my office profile"}</h2><p>These details are stored separately and are shown by the matching NFC card.</p></div>
        </div>

        <div className="cover-upload" style={form.coverPhoto ? { backgroundImage:`url(${form.coverPhoto})` } : {}}>
          <label className="photo-upload cover"><Camera size={16}/><span>Change cover photo</span><input type="file" accept="image/*" onChange={e => upload(e,"coverPhoto")}/></label>
        </div>

        <div className="profile-photo-upload">
          <div className="profile-avatar-large photo-avatar profile-photo-big" style={form.photo ? {backgroundImage:`url(${form.photo})`} : {}}>
            {!form.photo && <UserRound size={42}/>}
          </div>
          <label className="photo-upload"><Camera size={15}/><span>Upload profile photo</span><input type="file" accept="image/*" onChange={e => upload(e,"photo")}/></label>
        </div>

        <div className="form-grid">
          {[
            ["fullName","Full name"],["jobTitle","Job title"],["company","Company"],["phone","Phone"],
            ["email","Email"],["whatsapp","WhatsApp"],["linkedin","LinkedIn"],["website","Website"]
          ].map(([name,label]) => <label className="field" key={name}><span>{label}</span><input name={name} value={form[name] || ""} onChange={change}/></label>)}
          <label className="field full"><span>Bio</span><textarea name="bio" rows="4" value={form.bio || ""} onChange={change}/></label>
        </div>

        <div className="file-upload-row">
          <FileText size={20}/><div><strong>{form.resumeName || "Resume / document"}</strong><span>Upload a PDF, CV or other document for this profile.</span></div>
          <label className="btn btn-secondary">Choose file<input type="file" hidden accept=".pdf,.doc,.docx,.txt" onChange={e => upload(e,"resume")}/></label>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}><Save size={17}/>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </section>
    </form>

    <section className="panel account-section">
      <div className="panel-heading"><div><h2>My NFC cards</h2><p>Personal cards use Personal profile data. Office cards use Office profile data.</p></div></div>
      <div className="profile-card-grid">
        {["PERSONAL","COMPANY"].map(type => {
          const card = cards.find(c => c.cardType === type);
          const profileName = type === "PERSONAL" ? (profiles.PERSONAL.fullName || user?.name) : profiles.OFFICE.fullName;
          return <div className={`simple-card ${card ? "has-card" : "empty-card"}`} key={type}>
            <div className="simple-card-icon"><CreditCard size={20}/></div>
            <div>
              <span className="eyebrow">{type==="PERSONAL" ? "PERSONAL CARD" : "OFFICE CARD"}</span>
              <h3>{card?.label || `${type==="PERSONAL" ? "Personal" : "Office"} NFC card`}</h3>
              {card ? <><p><StatusBadge status={card.status}/> · {profileName ? `Profile: ${profileName}` : "Profile not filled yet"}</p><Link className="text-link" to={`/cards/${card._id}`}>Open card <ExternalLink size={13}/></Link></> : <p>No card created yet.</p>}
            </div>
            {!card && cards.length < 2 && <button type="button" className="btn btn-secondary" onClick={() => requestCard(type)}><Plus size={15}/> Request {type==="PERSONAL" ? "personal" : "office"} card</button>}
          </div>;
        })}
      </div>
    </section>
  </Layout>;
}
