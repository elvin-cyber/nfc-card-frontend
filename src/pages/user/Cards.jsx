import {
  CreditCard,
  ExternalLink,
  Trash2,
  ShieldCheck,
  Plus,
  Eye,
  Power,
} from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import EmptyState from "../../components/EmptyState";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    try {
      const r = await api.getCards();

      setCards(
        (r.cards || [])
          .slice()
          .sort(
            (a, b) =>
              ({ PERSONAL: 0, COMPANY: 1 }[a.cardType] ?? 9) -
              ({ PERSONAL: 0, COMPANY: 1 }[b.cardType] ?? 9)
          )
      );
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const request = async (type) => {
    if (
      cards.length >= 2 ||
      cards.some((c) => c.cardType === type)
    ) {
      window.dispatchEvent(
        new CustomEvent("nfc:toast", {
          detail: {
            message:
              "You can only have one Personal card and one Office card.",
            type: "info",
          },
        })
      );

      return;
    }

    try {
      const r = await api.createCard({
        label: `${
          type === "PERSONAL" ? "Personal" : "Office"
        } NFC card`,
        cardType: type,
      });

      if (r.card) {
        setCards((p) =>
          [...p, r.card].sort(
            (a, b) =>
              ({ PERSONAL: 0, COMPANY: 1 }[a.cardType] ?? 9) -
              ({ PERSONAL: 0, COMPANY: 1 }[b.cardType] ?? 9)
          )
        );
      }

      window.dispatchEvent(
        new CustomEvent("nfc:toast", {
          detail: {
            message: "Card request submitted.",
            type: "success",
          },
        })
      );
    } catch {}
  };

  const remove = async () => {
    if (!confirm) return;

    try {
      await api.deleteCard(confirm._id);

      setCards((p) =>
        p.filter((c) => c._id !== confirm._id)
      );

      setConfirm(null);
    } catch {}
  };

  const toggleCard = async (card) => {
    if (card.adminDisabled || card.status === "ADMIN_DISABLED") {
      window.dispatchEvent(new CustomEvent("nfc:toast", { detail: { message: "This card was deactivated by an administrator. Only an administrator can reactivate it.", type: "error" } }));
      return;
    }
    try {
      const r =
        card.status === "ACTIVE"
          ? await api.disableCard(card._id)
          : await api.enableCard(card._id);

      setCards((p) =>
        p.map((c) =>
          c._id === card._id
            ? r.card || {
                ...c,
                status:
                  card.status === "ACTIVE"
                    ? "DISABLED"
                    : "ACTIVE",
              }
            : c
        )
      );

      window.dispatchEvent(
        new CustomEvent("nfc:toast", {
          detail: {
            message:
              card.status === "ACTIVE"
                ? "Card disabled."
                : "Card enabled.",
            type: "success",
          },
        })
      );
    } catch {}
  };

  return (
    <Layout>
      <PageHeader
        eyebrow="MY NFC CARDS"
        title="My NFC cards"
        description="See the basic details of your Personal and Office cards. The administrator controls NFC URL provisioning."
      />

      {/* Card limit information */}
      <section className="panel info-strip">
        <div className="strip-icon">
          <CreditCard size={18} />
        </div>

        <div>
          <strong>Card limit</strong>

          <span>
            You can create a maximum of 2 NFC cards — one
            Personal Card and one Office Card.
          </span>
        </div>
      </section>

      {/* NFC tag information */}
      {/* <section className="panel info-strip">
        <div className="strip-icon">
          <ShieldCheck size={18} />
        </div>

        <div>
          <strong>What is an NFC tag?</strong>

          <span>
            An NFC tag is the chip inside the physical card.
            The administrator generates the public URL and
            writes it to the physical tag.
          </span>
        </div>
      </section> */}

      {/* Card creation buttons */}
      <section className="card-type-actions">
        <button
          className="btn btn-primary"
          disabled={
            cards.length >= 2 ||
            cards.some((c) => c.cardType === "PERSONAL")
          }
          onClick={() => request("PERSONAL")}
        >
          <Plus size={16} />
          Personal card
        </button>

        <button
          className="btn btn-secondary"
          disabled={
            cards.length >= 2 ||
            cards.some((c) => c.cardType === "COMPANY")
          }
          onClick={() => request("COMPANY")}
        >
          <Plus size={16} />
          Office card
        </button>

        <span>{cards.length}/2 cards used</span>
      </section>

      {/* NFC cards */}
      <section className="simple-card-list">
        {cards.map((card, index) => (
          <article
            className="nfc-basic-card"
            key={card._id}
          >
            {/* Card visual */}
            <div className="nfc-basic-art">
              <CreditCard size={28} />

              <span>
                {index === 0 ? "PERSONAL" : "COMPANY"}
              </span>
            </div>

            {/* Card information */}
            <div className="nfc-basic-info">
              <div className="nfc-basic-head">
                <div>
                  <span className="eyebrow">
                    {card.cardType === "COMPANY"
                      ? "OFFICE CARD"
                      : "PERSONAL CARD"}
                  </span>

                  <h2>
                    {card.label || "NFC digital card"}
                  </h2>
                </div>

                <StatusBadge status={card.status} />
              </div>

              {/* Basic details */}
              <div className="basic-detail-grid">
                <div>
                  <span>Unique card ID</span>

                  <code>
                    {card.cardId ||
                      card.token ||
                      card._id}
                  </code>
                </div>

                <div>
                  <span>Provisioning</span>

                  <strong>
                    {card.provisioned
                      ? "URL assigned"
                      : "Awaiting admin"}
                  </strong>
                </div>

                <div>
                  <span>Created</span>

                  <strong>
                    {card.createdAt
                      ? new Date(
                          card.createdAt
                        ).toLocaleDateString()
                      : "—"}
                  </strong>
                </div>
              </div>

              {/* Admin generated URL */}
              {card.provisioned &&
                card.publicUrl && (
                  <div className="assigned-url">
                    <span>Admin-generated URL</span>

                    <code>
                      {card.publicUrl}
                    </code>
                  </div>
                )}

              {/* Actions */}
              <div className="nfc-basic-actions">
                <Link
                  className="btn btn-secondary"
                  to={`/cards/${card._id}`}
                >
                  <Eye size={15} />
                  View details
                </Link>

                {card.provisioned &&
                  card.publicUrl && (
                    <a
                      className="btn btn-secondary"
                      href={card.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={15} />
                      Open profile
                    </a>
                  )}

                <button
                  className={`btn ${
                    card.status === "ACTIVE"
                      ? "btn-danger-soft"
                      : "btn-success-soft"
                  }`}
                  onClick={() => toggleCard(card)}
                >
                  <Power size={15} />

                  {card.adminDisabled || card.status === "ADMIN_DISABLED"
                    ? "Admin deactivated"
                    : card.status === "ACTIVE"
                    ? "Disable card"
                    : "Enable card"}
                </button>

                <button
                  className="icon-btn danger"
                  onClick={() => setConfirm(card)}
                  title="Delete card"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Empty state */}
        {cards.length === 0 && (
          <EmptyState
            icon={CreditCard}
            title="No NFC cards yet"
            text="Create a Personal or Office card. You can have one of each."
          />
        )}
      </section>

      {/* Delete confirmation modal */}
      {confirm && (
        <div className="modal-backdrop delete-backdrop">
          <div className="confirm-modal">
            <div className="confirm-icon">
              <Trash2 size={22} />
            </div>

            <h2>Delete this card?</h2>

            <p>
              This removes the card from your account. You
              will only see a deletion confirmation after
              the card is removed.
            </p>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger-soft"
                onClick={remove}
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