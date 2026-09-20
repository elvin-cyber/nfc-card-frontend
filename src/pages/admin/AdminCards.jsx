import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Link2,
  Plus,
  Search,
  X,
  Trash2,
  Users,
  AlertCircle,
  Power,
} from "lucide-react";

import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import StatCard from "../../components/StatCard";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

const cardTypeLabel = (type) =>
  type === "COMPANY" ? "Office" : "Personal";

const ownerId = (card) =>
  card.owner?._id ||
  card.owner?.id ||
  card.ownerId ||
  card.userId;

export default function AdminCards() {
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);

  const [q, setQ] = useState("");

  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState("");
  const [type, setType] = useState("PERSONAL");

  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  // ==========================================
  // LOAD ADMIN CARDS + USERS
  // ==========================================

  const load = async () => {
    try {
      const [c, u] = await Promise.all([
        api.adminCards(),
        api.adminUsers(),
      ]);

      setCards(c.cards || []);

      setUsers(
        (u.users || []).filter(
          (x) =>
            ![
              "ADMIN",
              "SUPER_ADMIN",
              "MAIN_ADMIN",
            ].includes(x.role)
        )
      );
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  // ==========================================
  // SEARCH
  // ==========================================

  const filtered = useMemo(
    () =>
      cards.filter((c) =>
        `${c._id} ${c.token} ${c.cardId} ${
          c.owner?.name || ""
        } ${c.owner?.email || ""}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [cards, q]
  );

  // ==========================================
  // AVAILABLE CARDS
  // ==========================================

  const availableCards = useMemo(
    () =>
      cards.filter(
        (c) =>
          !c.provisioned &&
          c.status !== "DELETED" &&
          !c.deleted &&
          !c.deletedAt
      ),
    [cards]
  );

  // ==========================================
  // USER'S AVAILABLE CARDS
  // ==========================================

  const selectableCards = useMemo(() => {
    if (!selected) return [];

    return availableCards.filter(
      (c) =>
        String(ownerId(c)) === String(selected)
    );
  }, [availableCards, selected]);

  // ==========================================
  // CARD TYPES
  // ==========================================

  const selectedTypes = useMemo(
    () =>
      new Set(
        selectableCards.map(
          (c) => c.cardType
        )
      ),
    [selectableCards]
  );

  // ==========================================
  // GENERATE NFC URL
  // ==========================================

  const generate = async () => {
    if (!selected) return;

    try {
      const existing = selectableCards.find(
        (c) => c.cardType === type
      );

      if (!existing) return;

      const r = await api.issueAdminCard({
        userId: selected,
        cardId: existing._id,
        label: `${cardTypeLabel(
          type
        )} NFC card`,
        cardType: type,
      });

      const card = r.card;

      /*
       * IMPORTANT:
       *
       * The Render URL is the BACKEND/API URL:
       *
       * https://nfc-card-backend-irj1.onrender.com/api
       *
       * The NFC URL itself should normally point to
       * the FRONTEND card page:
       *
       * https://YOUR-FRONTEND-DOMAIN.com/c/TOKEN
       *
       * The frontend then communicates with the
       * Render backend.
       */

      const publicUrl =
        card.publicUrl ||
        `${window.location.origin}/c/${card.token}`;

      setGenerated({
        ...card,
        url: publicUrl,
      });

      await load();

      window.dispatchEvent(
        new CustomEvent("nfc:toast", {
          detail: {
            message: "NFC URL generated.",
            type: "success",
          },
        })
      );
    } catch {}
  };

  // ==========================================
  // COPY URL
  // ==========================================

  const copy = async () => {
    if (!generated) return;

    await navigator.clipboard?.writeText(
      generated.url
    );

    setCopied(true);

    setTimeout(
      () => setCopied(false),
      1800
    );
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const close = () => {
    setShow(false);
    setGenerated(null);
    setCopied(false);
    setSelected("");
    setType("PERSONAL");
  };

  // ==========================================
  // ADMIN CARD ENABLE / DISABLE
  // ==========================================

  const toggleAdminCard = async (card) => {
    try {
      const locked =
        card.adminDisabled ||
        card.status === "ADMIN_DISABLED";

      const r = locked
        ? await api.adminEnableCard(
            card._id
          )
        : await api.adminDisableCard(
            card._id
          );

      setCards((prev) =>
        prev.map((c) =>
          c._id === card._id
            ? r.card ||
              {
                ...c,
                adminDisabled: !locked,
                status: locked
                  ? "ACTIVE"
                  : "ADMIN_DISABLED",
              }
            : c
        )
      );

      window.dispatchEvent(
        new CustomEvent("nfc:toast", {
          detail: {
            message: locked
              ? "Card reactivated by admin."
              : "Card deactivated by admin.",
            type: "success",
          },
        })
      );
    } catch {}
  };

  // ==========================================
  // DELETE CARD
  // ==========================================

  const deleteCard = async () => {
    if (!deleteTarget) return;

    try {
      await api.adminDeleteCard(
        deleteTarget._id
      );

      setCards((prev) =>
        prev.filter(
          (c) =>
            c._id !== deleteTarget._id
        )
      );

      setDeleteTarget(null);

      window.dispatchEvent(
        new CustomEvent("nfc:toast", {
          detail: {
            message: "Card deleted.",
            type: "success",
          },
        })
      );
    } catch {}
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const stats = useMemo(
    () => ({
      users: users.length,

      cards: cards.filter(
        (c) =>
          !c.deleted &&
          c.status !== "DELETED"
      ).length,

      writing: cards.filter(
        (c) =>
          !c.provisioned &&
          !c.deleted &&
          c.status !== "DELETED"
      ).length,
    }),
    [cards, users]
  );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Layout admin>

      <PageHeader
        eyebrow="ADMINISTRATION / NFC CARDS"
        title="NFC card inventory"
        description="Manage user cards and provision the unique public URL for each physical NFC card."
        action={
          <button
            className="btn btn-primary"
            onClick={() => setShow(true)}
          >
            <Plus size={17} />
            Generate NFC URL
          </button>
        }
      />

      {/* ======================================
          STATISTICS
      ====================================== */}

      <div className="stats-grid">

        <StatCard
          icon={Users}
          label="Total users"
          value={stats.users}
          note="Registered accounts"
        />

        <StatCard
          icon={CreditCard}
          label="NFC cards"
          value={stats.cards}
          note="User cards"
        />

        <StatCard
          icon={AlertCircle}
          label="Needs writing"
          value={stats.writing}
          note="Waiting for NFC URL writing"
        />

      </div>

      {/* ======================================
          CARD TABLE
      ====================================== */}

      <section className="panel">

        <div className="toolbar">

          <div className="search">
            <Search size={17} />

            <input
              placeholder="Search card, unique ID or owner..."
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
            />
          </div>

          <span>
            {filtered.length} records
          </span>

        </div>

        <div className="table-wrap">

          <table>

            <thead>

              <tr>
                <th>Card</th>
                <th>Unique card ID</th>
                <th>Type</th>
                <th>Owner</th>
                <th>URL</th>
                <th>Status</th>
                <th>Action</th>
              </tr>

            </thead>

            <tbody>

              {filtered.map((c) => (

                <tr key={c._id}>

                  {/* CARD */}

                  <td>

                    <div className="table-card">

                      <div className="tiny-nfc">
                        <CreditCard size={17} />
                      </div>

                      <div>

                        <strong>
                          {c.label ||
                            "NFC digital card"}
                        </strong>

                        <small>
                          {c._id}
                        </small>

                      </div>

                    </div>

                  </td>

                  {/* CARD ID */}

                  <td>
                    <code>
                      {c.cardId ||
                        c.token ||
                        c._id}
                    </code>
                  </td>

                  {/* TYPE */}

                  <td>
                    {cardTypeLabel(
                      c.cardType
                    )}
                  </td>

                  {/* OWNER */}

                  <td>
                    {c.owner?.name ||
                      "Unassigned"}
                  </td>

                  {/* PUBLIC URL */}

                  <td>

                    {c.provisioned &&
                    c.token ? (

                      <code>
                        {c.publicUrl ||
                          `${window.location.origin}/c/${c.token}`}
                      </code>

                    ) : (

                      <span className="table-muted">
                        Not generated
                      </span>

                    )}

                  </td>

                  {/* STATUS */}

                  <td>
                    <StatusBadge
                      status={c.status}
                    />
                  </td>

                  {/* ACTIONS */}

                  <td>

                    <div className="card-table-actions">

                      <button
                        className={`btn btn-xs ${
                          c.adminDisabled ||
                          c.status ===
                            "ADMIN_DISABLED"
                            ? "btn-success-soft"
                            : "btn-danger-soft"
                        }`}
                        title={
                          c.adminDisabled ||
                          c.status ===
                            "ADMIN_DISABLED"
                            ? "Reactivate card"
                            : "Deactivate card"
                        }
                        onClick={() =>
                          toggleAdminCard(c)
                        }
                      >

                        <Power size={14} />

                        {c.adminDisabled ||
                        c.status ===
                          "ADMIN_DISABLED"
                          ? "Reactivate"
                          : "Deactivate"}

                      </button>

                      <button
                        className="icon-btn danger"
                        title="Delete card"
                        onClick={() =>
                          setDeleteTarget(c)
                        }
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          {filtered.length === 0 && (

            <div className="empty-state">

              <CreditCard size={28} />

              <h3>
                No card records found
              </h3>

              <p>
                Cards assigned to users
                will appear here.
              </p>

            </div>

          )}

        </div>

      </section>

      {/* ======================================
          GENERATE URL MODAL
      ====================================== */}

      {show && (

        <div
          className="modal-backdrop"
          onMouseDown={(e) =>
            e.target === e.currentTarget &&
            close()
          }
        >

          <div className="modal modal-provision">

            <div className="modal-header">

              <div>

                <span className="eyebrow">
                  NFC PROVISIONING
                </span>

                <h2>
                  Generate card URL
                </h2>

                <p>
                  Select a user first,
                  then choose one of their
                  available cards and
                  generate its unique NFC
                  URL.
                </p>

              </div>

              <button
                className="icon-btn"
                onClick={close}
              >
                <X size={20} />
              </button>

            </div>

            {!generated ? (

              <>

                {/* USER */}

                <label className="field">

                  <span>
                    Assign to user
                  </span>

                  <select
                    value={selected}
                    onChange={(e) => {
                      setSelected(
                        e.target.value
                      );

                      setType("PERSONAL");
                    }}
                  >

                    <option value="">
                      Select a user…
                    </option>

                    {users
                      .filter((u) =>
                        availableCards.some(
                          (c) =>
                            String(
                              ownerId(c)
                            ) ===
                            String(
                              u.id ||
                                u._id
                            )
                        )
                      )
                      .map((u) => (

                        <option
                          key={
                            u.id || u._id
                          }
                          value={
                            u.id || u._id
                          }
                        >
                          {u.name} —{" "}
                          {u.email}
                        </option>

                      ))}

                  </select>

                </label>

                {/* CARD */}

                <div className="provision-card-section">

                  <div className="provision-section-title">

                    <CreditCard size={17} />

                    <div>

                      <strong>
                        Card to provision
                      </strong>

                      <span>
                        Choose the user's
                        available physical
                        NFC card.
                      </span>

                    </div>

                  </div>

                  <label className="field">

                    <span>
                      Card type
                    </span>

                    <select
                      value={type}
                      disabled={
                        !selected ||
                        selectableCards.length ===
                          0
                      }
                      onChange={(e) =>
                        setType(
                          e.target.value
                        )
                      }
                    >

                      {selectedTypes.has(
                        "PERSONAL"
                      ) && (

                        <option value="PERSONAL">
                          Personal card
                        </option>

                      )}

                      {selectedTypes.has(
                        "COMPANY"
                      ) && (

                        <option value="COMPANY">
                          Office card
                        </option>

                      )}

                      {!selected && (

                        <option value="PERSONAL">
                          Select a user first
                        </option>

                      )}

                      {selected &&
                        selectableCards.length ===
                          0 && (

                          <option value="PERSONAL">
                            No card available
                          </option>

                        )}

                    </select>

                  </label>

                  {!selected && (

                    <div className="provision-hint">
                      After selecting a user,
                      their unprovisioned
                      Personal or Office card
                      will become available
                      here.
                    </div>

                  )}

                  {selected &&
                    selectableCards.length ===
                      0 && (

                      <div className="provision-hint error-hint">
                        This user has no
                        unprovisioned card
                        available. Cards that
                        already have a URL
                        cannot be provisioned
                        again.
                      </div>

                    )}

                  {selected &&
                    selectableCards.length >
                      0 && (

                      <div className="workflow-box">

                        <div>
                          <b>1</b>
                          <span>
                            Choose available
                            card
                          </span>
                        </div>

                        <div>
                          <b>2</b>
                          <span>
                            Generate unique
                            URL
                          </span>
                        </div>

                        <div>
                          <b>3</b>
                          <span>
                            Write to NFC
                          </span>
                        </div>

                      </div>

                    )}

                </div>

                {/* ACTIONS */}

                <div className="modal-actions">

                  <button
                    className="btn btn-secondary"
                    onClick={close}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    disabled={
                      !selected ||
                      !selectableCards.some(
                        (c) =>
                          c.cardType ===
                          type
                      )
                    }
                    onClick={generate}
                  >

                    <Link2 size={17} />

                    Generate URL

                  </button>

                </div>

              </>

            ) : (

              /* =================================
                 GENERATED URL
              ================================= */

              <>

                <div className="success-box">

                  <Check size={22} />

                  <div>

                    <strong>
                      URL generated
                    </strong>

                    <span>
                      {generated.owner?.name ||
                        "User"}{" "}
                      ·{" "}
                      {cardTypeLabel(
                        generated.cardType
                      )}{" "}
                      card
                    </span>

                  </div>

                </div>

                <div className="url-generator">

                  <span>
                    Write this URL to the
                    NFC card
                  </span>

                  <div className="generated-url">

                    <code>
                      {generated.url}
                    </code>

                    <button
                      className="btn btn-secondary"
                      onClick={copy}
                    >

                      {copied ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}

                      {copied
                        ? "Copied"
                        : "Copy URL"}

                    </button>

                  </div>

                </div>

                <div className="nfc-instructions">

                  <strong>
                    Physical NFC card
                  </strong>

                  <span>
                    In NFC Tools: Write →
                    Add a record → URL →
                    paste the URL above →
                    Write. Test the card
                    after writing.
                  </span>

                </div>

                <div className="modal-actions">

                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setGenerated(null)
                    }
                  >
                    Done
                  </button>

                  <a
                    className="btn btn-primary"
                    href={generated.url}
                    target="_blank"
                    rel="noreferrer"
                  >

                    <ExternalLink
                      size={16}
                    />

                    Test URL

                  </a>

                </div>

              </>

            )}

          </div>

        </div>

      )}

      {/* ======================================
          DELETE CONFIRMATION
      ====================================== */}

      {deleteTarget && (

        <div
          className="modal-backdrop"
          onMouseDown={(e) =>
            e.target === e.currentTarget &&
            setDeleteTarget(null)
          }
        >

          <div className="confirm-modal">

            <div className="confirm-icon">
              <Trash2 size={22} />
            </div>

            <h2>
              Delete this card?
            </h2>

            <p>
              This permanently removes
              the selected NFC card from
              the user's account and admin
              card inventory.
            </p>

            <div className="modal-actions">

              <button
                className="btn btn-secondary"
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Cancel
              </button>

              <button
                className="btn btn-danger-soft"
                onClick={deleteCard}
              >
                Delete card
              </button>

            </div>

          </div>

        </div>

      )}

    </Layout>
  );
}