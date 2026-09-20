export default function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const label = status === "PENDING" ? "Pending" : status === "DISABLED" ? "Disabled" : status === "ADMIN_DISABLED" || status === "ADMIN_DISABLED" ? "Admin deactivated" : "Active";
  return <span className={`status status-${normalized}`}>{label}</span>;
}
