/* Statuts techniques des rendez-vous et leur présentation dans l'interface. */
export const APPOINTMENT_STATUS = Object.freeze({
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed"
});

const STATUS_META = Object.freeze({
  [APPOINTMENT_STATUS.PENDING]:   { label: "En attente", icon: "🟠", color: "orange" },
  [APPOINTMENT_STATUS.CONFIRMED]: { label: "Confirmé", icon: "✅", color: "green" },
  [APPOINTMENT_STATUS.CANCELLED]: { label: "Annulé", icon: "❌", color: "red" },
  [APPOINTMENT_STATUS.COMPLETED]: { label: "Terminé", icon: "🏁", color: "blue" }
});

const LEGACY_STATUS_MAP = Object.freeze({
  Enattente: APPOINTMENT_STATUS.PENDING,
  "En attente": APPOINTMENT_STATUS.PENDING,
  Confirmer: APPOINTMENT_STATUS.CONFIRMED,
  Annuler: APPOINTMENT_STATUS.CANCELLED,
  Terminer: APPOINTMENT_STATUS.COMPLETED
});

export function normalizeAppointmentStatus(status) {
  return STATUS_META[status] ? status : LEGACY_STATUS_MAP[status] || APPOINTMENT_STATUS.PENDING;
}

export function isTechnicalAppointmentStatus(status) {
  return Boolean(STATUS_META[status]);
}

export function getAppointmentStatusMeta(status) {
  return STATUS_META[normalizeAppointmentStatus(status)];
}

export function getAppointmentStatusLabel(status, withIcon = false) {
  const meta = getAppointmentStatusMeta(status);
  return withIcon ? `${meta.icon} ${meta.label}` : meta.label;
}
