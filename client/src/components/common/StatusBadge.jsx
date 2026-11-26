export function StatusBadge({ status }) {
  if (!status) return null;
  const normalized = String(status).toLowerCase();
  const display = String(status).replace(/_/g, ' ');

  return (
    <span className={`status-badge ${normalized}`}>
      {display}
    </span>
  );
}
