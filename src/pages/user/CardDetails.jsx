import { ExternalLink, Link2, Power, ArrowLeft, UserRound, Mail, Phone, Briefcase, Building2 } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../services/api";

export default function CardDetails() {
  const { id } = useParams();
  const [card,setCard] = useState(null);
  const [profile,setProfile] = useState(null);
  const [error,setError] = useState("");

  useEffect(() => {
    Promise.all([api.getCards(), api.getProfile()])
      .then(([c,p]) => {
        const found = (c.cards || []).find(x => x._id === id);
        if (!found) throw new Error("Card not found.");
        setCard(found);
        setProfile(p.user || {});
      })
      .catch(e => setError(e.message));
  }, [id]);

  if (error) return <Layout><div className="center-page"><h1>Card unavailable</h1><p>{error}</p><Link className="btn btn-secondary" to="/cards"><ArrowLeft size={15}/> Back to cards</Link></div></Layout>;
  if (!card) return <Layout><div className="empty-state"><p>Loading card details…</p></div></Layout>;

  const isOffice = card.cardType === "COMPANY";
  const p = isOffice ? (profile?.officeProfile || {}) : (profile?.personalProfile || profile?.profile || {});
  const displayName = p.fullName || (isOffice ? "" : profile?.name) || "Not filled";
  const displayEmail = p.email || (isOffice ? "" : profile?.email) || "Not filled";
  const publicUrl = card.status === "ACTIVE" ? (card.publicUrl || (card.provisioned && card.token ? `${window.location.origin}/c/${card.token}` : "")) : "";

  const toggle = async () => {
    if (card.adminDisabled || card.status === "ADMIN_DISABLED") {
      setError("This card was deactivated by an administrator. Only an administrator can reactivate it.");
      return;
    }
    try {
      const r = card.status === "ACTIVE" ? await api.disableCard(card._id) : await api.enableCard(card._id);
      setCard(r.card);
    } catch(e) { setError(e.message); }
  };

  const basic = [
    ["Card type", isOffice ? "Office" : "Personal"],
    ["Profile data used", isOffice ? "Office profile" : "Personal profile"],
    ["Name on this card", displayName],
    ["Email on this card", displayEmail],
    ["Phone", p.phone || "Not filled"],
    ["Job title", p.jobTitle || "Not filled"],
    ["Company", p.company || "Not filled"],
    ["Unique card ID", card.cardId || card.token || card._id],
    ["Status", card.status],
    ["Provisioning", card.provisioned ? "URL assigned by admin" : "Awaiting admin provisioning"],
    ["Created", card.createdAt ? new Date(card.createdAt).toLocaleString() : "—"]
  ];

  return <Layout>
    <PageHeader
      eyebrow={isOffice ? "OFFICE CARD" : "PERSONAL CARD"}
      title={card.label || "NFC digital card"}
      description={`This card uses your ${isOffice ? "Office" : "Personal"} profile data. This makes it clear which information will be shown when this card is used.`}
      action={<Link className="btn btn-secondary" to="/cards"><ArrowLeft size={15}/> Back to cards</Link>}
    />
    {error && <div className="error-box">{error}</div>}

    <section className="panel card-detail-only">
      <div className="card-detail-top">
        <div className="tiny-nfc large"><Link2 size={23}/></div>
        <div><span className="eyebrow">CARD DETAILS</span><h2>{isOffice ? "Office NFC card" : "Personal NFC card"}</h2><p>{isOffice ? "Contains Office profile information" : "Contains Personal profile information"}</p></div>
        <StatusBadge status={card.status}/>
      </div>

      <div className="basic-detail-grid large-grid">
        {basic.map(([label,value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>

      <div className="card-profile-data">
        <div className="card-profile-heading"><UserRound size={17}/><div><strong>Data shown by this card</strong><span>{isOffice ? "Office identity" : "Personal identity"}</span></div></div>
        <div className="card-profile-chips">
          <span><UserRound size={13}/> {displayName}</span>
          {displayEmail !== "Not filled" && <span><Mail size={13}/> {displayEmail}</span>}
          {p.phone && <span><Phone size={13}/> {p.phone}</span>}
          {p.jobTitle && <span><Briefcase size={13}/> {p.jobTitle}</span>}
          {p.company && <span><Building2 size={13}/> {p.company}</span>}
        </div>
      </div>

      {publicUrl && <div className="assigned-url"><span>URL assigned by administrator</span><code>{publicUrl}</code></div>}

      <div className="card-row-actions">
        {publicUrl && <a className="btn btn-primary" href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Open public profile</a>}
        <button className={`btn ${card.adminDisabled || card.status === "ADMIN_DISABLED" ? "btn-danger-soft" : card.status === "ACTIVE" ? "btn-danger-soft" : "btn-success-soft"}`} onClick={toggle}>
          <Power size={16}/>{card.adminDisabled || card.status === "ADMIN_DISABLED" ? "Admin deactivated" : card.status === "ACTIVE" ? "Disable card" : "Enable card"}
        </button>
      </div>
    </section>
  </Layout>;
}
