import {
  ArrowLeft,
  Save,
  Trash2,
  Power,
  CreditCard,
  UserRound,
  Pencil,
  ExternalLink
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

const cardTypeLabel = t => t === "COMPANY" ? "Office" : "Personal";

const ownerId = c =>
  c.owner?._id ||
  c.owner?.id ||
  c.ownerId ||
  c.userId;

const notify = (message, type = "success") =>
  window.dispatchEvent(
    new CustomEvent("nfc:toast", {
      detail: { message, type }
    })
  );

export default function AdminUserDetails() {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [edit, setEdit] = useState(false);
  const [profileType, setProfileType] = useState("PERSONAL");

  const [form, setForm] = useState({
    name: "",
    email: "",
    status: "ACTIVE",
    phone: "",
    whatsapp: "",
    jobTitle: "",
    company: "",
    linkedin: "",
    website: "",
    bio: "",
    resumeName: "",
    resumeFile: "",
    photo: "",
    photoFileName: "",
    coverPhoto: "",
    coverPhotoFileName: ""
  });

  const [cardEdit, setCardEdit] = useState(null);

  const [cardForm, setCardForm] = useState({
    label: "",
    cardType: "PERSONAL"
  });

  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);

    try {
      const [u, c] = await Promise.all([
        api.adminUser(id).catch(() => api.adminUsers()),
        api.adminCards()
      ]);

      const found =
        u.user ||
        (u.users || []).find(
          x => String(x.id || x._id) === String(id)
        );

      if (!found) {
        throw new Error("User not found.");
      }

      setUser(found);

      const p = found.personalProfile || found.profile || {};

      setForm({
        name: found.name || "",
        email: found.email || "",
        status: found.status || "ACTIVE",
        phone: p.phone || "",
        whatsapp: p.whatsapp || "",
        jobTitle: p.jobTitle || "",
        company: p.company || "",
        linkedin: p.linkedin || "",
        website: p.website || "",
        bio: p.bio || "",
        resumeName: p.resumeName || "",
        resumeFile: "",
        photo: p.photo || p.photoUrl || "",
        photoFileName: "",
        coverPhoto: p.coverPhoto || p.coverPhotoUrl || "",
        coverPhotoFileName: ""
      });

      setCards(
        (c.cards || []).filter(
          card => String(ownerId(card)) === String(id)
        )
      );
    } catch (e) {
      notify(
        e.message || "Unable to load user.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const profile = user?.profile || {};

  const detailFields = useMemo(
    () => [
      ["Full name", user?.name],
      ["Email", user?.email],
      ["Phone", profile.phone],
      ["WhatsApp", profile.whatsapp],
      ["Job title", profile.jobTitle],
      ["Company", profile.company],
      ["LinkedIn", profile.linkedin],
      ["Website", profile.website],
      ["Bio", profile.bio],
      ["Resume", profile.resumeName],
      [
        "Profile photo",
        profile.photo || profile.photoUrl
      ],
      [
        "Cover photo",
        profile.coverPhoto || profile.coverPhotoUrl
      ]
    ],
    [user, profile]
  );

  /*
   * Convert the selected file into a data URL.
   */
  const fileToDataUrl = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });

  const imageToDataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  /*
   * PROFILE PHOTO
   */
  const pickProfilePhoto = async e => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      notify(
        "Please select an image file.",
        "error"
      );

      e.target.value = "";
      return;
    }

    try {
      const photo = await imageToDataUrl(file);

      setForm(current => ({
        ...current,
        photo: photo,
        photoFileName: file.name
      }));
    } catch {
      notify(
        "Unable to read the selected photo.",
        "error"
      );
    }

    e.target.value = "";
  };

  /*
   * COVER PHOTO
   */
  const pickCoverPhoto = async e => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      notify(
        "Please select an image file.",
        "error"
      );

      e.target.value = "";
      return;
    }

    try {
      const coverPhoto = await imageToDataUrl(file);

      setForm(current => ({
        ...current,
        coverPhoto: coverPhoto,
        coverPhotoFileName: file.name
      }));
    } catch {
      notify(
        "Unable to read the selected cover photo.",
        "error"
      );
    }

    e.target.value = "";
  };

  /*
   * RESUME / OTHER FILE
   */
  const pickResumeFile = async e => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const resumeFile = await fileToDataUrl(file);

      setForm(current => ({
        ...current,
        resumeName: file.name,
        resumeFile: resumeFile
      }));
    } catch {
      notify(
        "Unable to read the selected file.",
        "error"
      );
    }

    e.target.value = "";
  };

  const profileForType = (account, type) =>
    type === "OFFICE"
      ? (account?.officeProfile || {})
      : (account?.personalProfile || account?.profile || {});

  const loadProfileIntoForm = (account, type) => {
    const p = profileForType(account, type);
    setProfileType(type);
    setForm(current => ({
      ...current,
      phone: p.phone || "",
      whatsapp: p.whatsapp || "",
      jobTitle: p.jobTitle || "",
      company: p.company || "",
      linkedin: p.linkedin || "",
      website: p.website || "",
      bio: p.bio || "",
      resumeName: p.resumeName || "",
      resumeFile: p.resume || "",
      photo: p.photo || p.photoUrl || "",
      photoFileName: "",
      coverPhoto: p.coverPhoto || p.coverPhotoUrl || "",
      coverPhotoFileName: ""
    }));
  };

  /*
   * SAVE USER
   */
  const saveUser = async () => {
    try {
      const payload = {
        name: form.name,
        email: form.email,
        status: form.status,

        profileType,
        profile: {
          phone: form.phone,
          whatsapp: form.whatsapp,
          jobTitle: form.jobTitle,
          company: form.company,
          linkedin: form.linkedin,
          website: form.website,
          bio: form.bio,
          resume: form.resumeFile,
          resumeName: form.resumeName,
          photo: form.photo,
          coverPhoto: form.coverPhoto
        }
      };

      const r = await api.updateAdminUser(
        id,
        payload
      );

      const returned = r.user || {};

      setUser({ ...user, ...returned });
      await load();
      setEdit(false);

      notify(
        "All user details updated."
      );
    } catch (e) {
      notify(
        e?.message ||
          "Unable to update user details.",
        "error"
      );
    }
  };

  /*
   * SAVE CARD
   */
  const saveCard = async () => {
    if (!cardEdit) {
      return;
    }

    try {
      const r = await api.adminUpdateCard(
        cardEdit._id,
        cardForm
      );

      setCards(previous =>
        previous.map(card =>
          card._id === cardEdit._id
            ? r.card || {
                ...card,
                ...cardForm
              }
            : card
        )
      );

      setCardEdit(null);

      notify("Card details updated.");
    } catch {
      notify(
        "Unable to update card.",
        "error"
      );
    }
  };

  /*
   * ACTIVATE / DEACTIVATE CARD
   */
  const toggleCard = async card => {
    try {
      const adminDisabled =
        card.adminDisabled ||
        card.status === "ADMIN_DISABLED";

      const r = adminDisabled
        ? await api.adminEnableCard(card._id)
        : await api.adminDisableCard(card._id);

      setCards(previous =>
        previous.map(c =>
          c._id === card._id
            ? r.card || {
                ...c,
                adminDisabled: !adminDisabled,
                status: adminDisabled
                  ? "ACTIVE"
                  : "ADMIN_DISABLED"
              }
            : c
        )
      );

      notify(
        adminDisabled
          ? "Card reactivated by admin."
          : "Card deactivated by admin."
      );
    } catch {
      notify(
        "Unable to change card status.",
        "error"
      );
    }
  };

  /*
   * DELETE CARD
   */
  const deleteCard = async () => {
    if (!confirm?.card) {
      return;
    }

    try {
      await api.adminDeleteCard(
        confirm.card._id
      );

      setCards(previous =>
        previous.filter(
          c => c._id !== confirm.card._id
        )
      );

      setConfirm(null);

      notify("Card deleted.");
    } catch {
      notify(
        "Unable to delete card.",
        "error"
      );
    }
  };

  /*
   * DELETE USER
   */
  const deleteUser = async () => {
    if (!confirm?.user) {
      return;
    }

    try {
      await api.deleteAdminUser(id);

      notify("User deleted.");

      window.location.href =
        "/admin/users";
    } catch {
      notify(
        "Unable to delete user.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <Layout admin>
        <div className="center-page">
          <p>Loading user details…</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout admin>
        <div className="center-page">
          <h1>User unavailable</h1>

          <Link
            className="btn btn-secondary"
            to="/admin/users"
          >
            <ArrowLeft size={15} />
            Back to users
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout admin>

      <PageHeader
        eyebrow="ADMINISTRATION / USERS / DETAILS"
        title={user.name || "User details"}
        description="Complete account information, profile data and every NFC card owned by this user."
        action={
          <Link
            className="btn btn-secondary"
            to="/admin/users"
          >
            <ArrowLeft size={15} />
            Back to users
          </Link>
        }
      />

      <div className="admin-detail-actions">

        <button
          className="btn btn-primary"
          onClick={() => {
            const p = user.personalProfile || user.profile || {};
            setProfileType("PERSONAL");

            setForm({
              name: user.name || "",
              email: user.email || "",
              status: user.status || "ACTIVE",
              phone: p.phone || "",
              whatsapp: p.whatsapp || "",
              jobTitle: p.jobTitle || "",
              company: p.company || "",
              linkedin: p.linkedin || "",
              website: p.website || "",
              bio: p.bio || "",
              resumeName: p.resumeName || "",
              resumeFile: "",
              photo:
                p.photo ||
                p.photoUrl ||
                "",
              photoFileName: "",
              coverPhoto:
                p.coverPhoto ||
                p.coverPhotoUrl ||
                "",
              coverPhotoFileName: ""
            });

            setEdit(true);
          }}
        >
          <Pencil size={15} />
          Edit user
        </button>

        <button
          className={`btn ${
            user.status === "DISABLED"
              ? "btn-success-soft"
              : "btn-danger-soft"
          }`}
          onClick={async () => {
            try {
              if (user.status === "DISABLED") {
                await api.enableUser(id);
              } else {
                await api.disableUser(id);
              }

              await load();

              notify(
                user.status === "DISABLED"
                  ? "User enabled."
                  : "User disabled."
              );
            } catch {
              notify(
                "Unable to change user status.",
                "error"
              );
            }
          }}
        >
          <Power size={15} />

          {user.status === "DISABLED"
            ? "Enable user"
            : "Disable user"}
        </button>

        <button
          className="btn btn-danger-soft"
          onClick={() =>
            setConfirm({ user })
          }
        >
          <Trash2 size={15} />
          Delete user
        </button>

      </div>

      <div className="details-grid admin-user-grid">

        <section className="panel">

          <div className="panel-heading">

            <div>
              <h2>
                Account & profile data
              </h2>

              <p>
                All profile fields returned by
                the backend are visible to
                administrators.
              </p>
            </div>

            <StatusBadge
              status={user.status}
            />

          </div>

          <div className="admin-profile-summary">

            <div
              className="profile-avatar-large"
              style={
                profile.photo ||
                profile.photoUrl
                  ? {
                      backgroundImage: `url(${
                        profile.photo ||
                        profile.photoUrl
                      })`,
                      backgroundSize:
                        "cover",
                      backgroundPosition:
                        "center"
                    }
                  : {}
              }
            >
              {!(
                profile.photo ||
                profile.photoUrl
              ) && (
                <UserRound size={36} />
              )}
            </div>

            <div>
              <h3>{user.name}</h3>

              <p>
                {profile.jobTitle ||
                  "No job title"}

                {profile.company
                  ? ` · ${profile.company}`
                  : ""}
              </p>

              <small>
                {user.email}
              </small>
            </div>

          </div>

          <div className="admin-field-grid">

            {detailFields.map(
              ([label, value]) => (
                <div
                  className="admin-data-field"
                  key={label}
                >
                  <span>{label}</span>

                  {String(value || "").startsWith(
                    "data:image"
                  ) ? (
                    <img
                      src={value}
                      alt={label}
                    />
                  ) : (
                    <strong>
                      {value || "—"}
                    </strong>
                  )}
                </div>
              )
            )}

          </div>

        </section>

        <section className="panel">

          <div className="panel-heading">

            <div>
              <h2>
                Account metadata
              </h2>

              <p>
                Administrative and system
                information.
              </p>
            </div>

          </div>

          <div className="detail-list">

            {[
              [
                "User ID",
                user.id || user._id
              ],
              ["Role", user.role],
              ["Status", user.status],
              [
                "Created",
                user.createdAt
                  ? new Date(
                      user.createdAt
                    ).toLocaleString()
                  : "—"
              ],
              [
                "Updated",
                user.updatedAt
                  ? new Date(
                      user.updatedAt
                    ).toLocaleString()
                  : "—"
              ],
              [
                "Cards owned",
                cards.length
              ]
            ].map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <code>{value || "—"}</code>
              </div>
            ))}

          </div>

        </section>

      </div>

      <section className="panel admin-owned-cards">

        <div className="panel-heading">

          <div>
            <h2>
              NFC cards owned by {user.name}
            </h2>

            <p>
              Administrators can view, edit,
              deactivate, reactivate and
              delete these cards.
            </p>
          </div>

          <span>
            {cards.length} card
            {cards.length === 1
              ? ""
              : "s"}
          </span>

        </div>

        {cards.length === 0 ? (

          <div className="empty-state">

            <CreditCard size={28} />

            <h3>
              No NFC cards
            </h3>

            <p>
              This user has not created a
              card yet.
            </p>

          </div>

        ) : (

          <div className="admin-card-grid">

            {cards.map(card => {

              const adminOff =
                card.adminDisabled ||
                card.status ===
                  "ADMIN_DISABLED";

              return (
                <article
                  className="admin-owned-card"
                  key={card._id}
                >

                  <div className="admin-owned-card-head">

                    <div className="tiny-nfc">
                      <CreditCard
                        size={18}
                      />
                    </div>

                    <div>

                      <span className="eyebrow">
                        {cardTypeLabel(
                          card.cardType
                        ).toUpperCase()} CARD
                      </span>

                      <h3>
                        {card.label ||
                          "NFC digital card"}
                      </h3>

                    </div>

                    <StatusBadge
                      status={
                        adminOff
                          ? "ADMIN_DISABLED"
                          : card.status
                      }
                    />

                  </div>

                  <div className="basic-detail-grid">

                    <div>
                      <span>
                        Card ID
                      </span>

                      <code>
                        {card.cardId ||
                          card.token ||
                          card._id}
                      </code>
                    </div>

                    <div>
                      <span>
                        Provisioning
                      </span>

                      <strong>
                        {card.provisioned
                          ? "URL assigned"
                          : "Awaiting admin"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Created
                      </span>

                      <strong>
                        {card.createdAt
                          ? new Date(
                              card.createdAt
                            ).toLocaleString()
                          : "—"}
                      </strong>
                    </div>

                  </div>

                  {card.publicUrl && (
                    <div className="assigned-url">
                      <span>
                        Public URL
                      </span>

                      <code>
                        {card.publicUrl}
                      </code>
                    </div>
                  )}

                  <div className="card-row-actions">

                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setCardEdit(card);

                        setCardForm({
                          label:
                            card.label || "",
                          cardType:
                            card.cardType ||
                            "PERSONAL"
                        });
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    {card.publicUrl && (
                      <a
                        className="btn btn-secondary"
                        href={card.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink
                          size={14}
                        />
                        Open
                      </a>
                    )}

                    <button
                      className={`btn ${
                        adminOff
                          ? "btn-success-soft"
                          : "btn-danger-soft"
                      }`}
                      onClick={() =>
                        toggleCard(card)
                      }
                    >
                      <Power size={14} />

                      {adminOff
                        ? "Reactivate card"
                        : "Deactivate card"}
                    </button>

                    <button
                      className="icon-btn danger"
                      title="Delete card"
                      onClick={() =>
                        setConfirm({ card })
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </article>
              );
            })}

          </div>

        )}

      </section>

      {/* EDIT USER MODAL */}

      {edit && (
        <div className="modal-backdrop">

          <div className="modal edit-user-modal">

            <div className="modal-header">

              <div>

                <span className="eyebrow">
                  EDIT USER
                </span>

                <h2>
                  Update user details
                </h2>

                <p>
                  Administrators can edit all
                  profile information stored
                  for this user.
                </p>

              </div>

              <button
                className="icon-btn"
                onClick={() =>
                  setEdit(false)
                }
              >
                ×
              </button>

            </div>

            <div className="profile-mode-switch" style={{marginBottom: 18}}>
              <div>
                <span className="eyebrow">PROFILE TO EDIT</span>
                <strong>{profileType === "OFFICE" ? "Office profile" : "Personal profile"}</strong>
              </div>
              <div className="segmented">
                <button type="button" className={profileType === "PERSONAL" ? "active" : ""} onClick={() => loadProfileIntoForm(user, "PERSONAL")}>Personal</button>
                <button type="button" className={profileType === "OFFICE" ? "active" : ""} onClick={() => loadProfileIntoForm(user, "OFFICE")}>Office</button>
              </div>
            </div>

            <div className="edit-user-grid">

              <label className="field">
                <span>Full name</span>

                <input
                  value={form.name || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      name: e.target.value
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Email</span>

                <input
                  type="email"
                  value={form.email || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Phone</span>

                <input
                  value={form.phone || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      phone: e.target.value
                    })
                  }
                />
              </label>

              <label className="field">
                <span>WhatsApp</span>

                <input
                  value={form.whatsapp || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      whatsapp: e.target.value
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Job title</span>

                <input
                  value={form.jobTitle || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      jobTitle:
                        e.target.value
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Company</span>

                <input
                  value={form.company || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      company:
                        e.target.value
                    })
                  }
                />
              </label>

              <label className="field">
                <span>LinkedIn</span>

                <input
                  value={form.linkedin || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      linkedin:
                        e.target.value
                    })
                  }
                />
              </label>

              <label className="field">
                <span>Website</span>

                <input
                  value={form.website || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      website:
                        e.target.value
                    })
                  }
                />
              </label>

              <label className="field full">
                <span>Bio</span>

                <textarea
                  rows="4"
                  value={form.bio || ""}
                  onChange={e =>
                    setForm({
                      ...form,
                      bio: e.target.value
                    })
                  }
                />
              </label>

              {/* RESUME / FILE */}

              <div className="field">

                <span>
                  Resume / file
                </span>

                <div className="file-picker-row">

                  <input
                    id="admin-resume-file"
                    type="file"
                    onChange={
                      pickResumeFile
                    }
                  />

                  <label
                    className="btn btn-secondary file-picker-button"
                    htmlFor="admin-resume-file"
                  >
                    Choose file
                  </label>

                  <span className="file-name">
                    {form.resumeName ||
                      "No file selected"}
                  </span>

                </div>

              </div>

              {/* STATUS */}

              <label className="field">

                <span>Status</span>

                <select
                  value={
                    form.status || "ACTIVE"
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      status:
                        e.target.value
                    })
                  }
                >
                  <option>
                    ACTIVE
                  </option>

                  <option>
                    DISABLED
                  </option>
                </select>

              </label>

              {/* PROFILE PHOTO */}

              <div className="field full file-picker-field">

                <span>
                  Profile photo
                </span>

                <div className="file-picker-row">

                  <input
                    id="admin-profile-photo"
                    type="file"
                    accept="image/*"
                    onChange={
                      pickProfilePhoto
                    }
                  />

                  <label
                    className="btn btn-secondary file-picker-button"
                    htmlFor="admin-profile-photo"
                  >
                    Choose photo
                  </label>

                  <span className="file-name">
                    {form.photoFileName ||
                      (form.photo
                        ? "Current photo selected"
                        : "No photo selected")}
                  </span>

                </div>

                {form.photo && (
                  <img
                    className="admin-photo-preview"
                    src={form.photo}
                    alt="Profile preview"
                  />
                )}

              </div>

              {/* COVER PHOTO */}

              <div className="field full file-picker-field">

                <span>
                  Cover photo
                </span>

                <div className="file-picker-row">

                  <input
                    id="admin-cover-photo"
                    type="file"
                    accept="image/*"
                    onChange={
                      pickCoverPhoto
                    }
                  />

                  <label
                    className="btn btn-secondary file-picker-button"
                    htmlFor="admin-cover-photo"
                  >
                    Choose photo
                  </label>

                  <span className="file-name">
                    {form.coverPhotoFileName ||
                      (form.coverPhoto
                        ? "Current cover photo selected"
                        : "No cover photo selected")}
                  </span>

                </div>

                {form.coverPhoto && (
                  <img
                    className="admin-cover-preview"
                    src={form.coverPhoto}
                    alt="Cover preview"
                  />
                )}

              </div>

            </div>

            <div className="modal-actions">

              <button
                className="btn btn-secondary"
                onClick={() =>
                  setEdit(false)
                }
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={saveUser}
              >
                <Save size={15} />
                Save all changes
              </button>

            </div>

          </div>

        </div>
      )}

      {/* EDIT CARD MODAL */}

      {cardEdit && (
        <div className="modal-backdrop">

          <div className="modal">

            <div className="modal-header">

              <div>

                <span className="eyebrow">
                  EDIT NFC CARD
                </span>

                <h2>
                  Update card
                </h2>

                <p>
                  These changes are made
                  directly by the administrator.
                </p>

              </div>

              <button
                className="icon-btn"
                onClick={() =>
                  setCardEdit(null)
                }
              >
                ×
              </button>

            </div>

            <label className="field">

              <span>
                Card label
              </span>

              <input
                value={cardForm.label}
                onChange={e =>
                  setCardForm({
                    ...cardForm,
                    label: e.target.value
                  })
                }
              />

            </label>

            <label className="field">

              <span>
                Card type
              </span>

              <select
                value={cardForm.cardType}
                onChange={e =>
                  setCardForm({
                    ...cardForm,
                    cardType:
                      e.target.value
                  })
                }
              >
                <option value="PERSONAL">
                  Personal
                </option>

                <option value="COMPANY">
                  Office
                </option>
              </select>

            </label>

            <div className="modal-actions">

              <button
                className="btn btn-secondary"
                onClick={() =>
                  setCardEdit(null)
                }
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={saveCard}
              >
                <Save size={15} />
                Save card
              </button>

            </div>

          </div>

        </div>
      )}

      {/* CONFIRM DELETE */}

      {confirm && (
        <div className="modal-backdrop">

          <div className="confirm-modal">

            <div className="confirm-icon">
              <Trash2 size={22} />
            </div>

            <h2>
              {confirm.user
                ? "Delete this user?"
                : "Delete this card?"}
            </h2>

            <p>
              {confirm.user
                ? "This permanently removes the user account and its administrative record."
                : "This permanently removes this NFC card from the user's account."}
            </p>

            <div className="modal-actions">

              <button
                className="btn btn-secondary"
                onClick={() =>
                  setConfirm(null)
                }
              >
                Cancel
              </button>

              <button
                className="btn btn-danger-soft"
                onClick={
                  confirm.user
                    ? deleteUser
                    : deleteCard
                }
              >
                Delete
              </button>

            </div>

          </div>

        </div>
      )}

    </Layout>
  );
}