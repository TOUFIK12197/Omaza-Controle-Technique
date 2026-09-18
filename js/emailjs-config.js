// js/emailjs-config.js
// 📧 Configuration centralisée d'EmailJS

export const EMAILJS_CONFIG = {
  PUBLIC_KEY: "1VBkeUVpA49ZE-v4s", // Clé publique EmailJS
  SERVICE_ID: "omaza_email",
  TEMPLATES: {
    CLIENT: "omaza_confirmation_rdv",    // Email client RDV confirmé/annulé/terminé
    ADMIN: "omaza_admin_notif"           // Email admin pour chaque action
  },
  ADMIN_EMAIL: "omaza.ct@gmail.com",
  RETRY_CONFIG: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000  // 1 seconde
  }
};

// Initialiser EmailJS dès le chargement
export function initEmailJS() {
  try {
    if (typeof window.emailjs === "undefined") {
      console.error("❌ EmailJS SDK non chargé");
      return false;
    }
    
    window.emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    console.log("✅ EmailJS initialisé avec succès");
    return true;
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation d'EmailJS:", error);
    return false;
  }
}

// Fonction utilitaire pour logger les tentatives d'envoi
export function logEmailAttempt(config = {}) {
  const {
    status,        // "pending", "success", "failed"
    templateId,
    recipientEmail,
    rdvId,
    error,
    attempt
  } = config;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    status,
    templateId,
    recipientEmail,
    rdvId,
    error: error?.message || null,
    errorStatus: error?.status || null,
    attempt
  };

  // Logger dans la console
  console.log(`📧 [${status.toUpperCase()}] Template: ${templateId} | To: ${recipientEmail} | Attempt: ${attempt}`);
  
  // Optionnel: Stocker dans sessionStorage pour debug
  const logs = JSON.parse(sessionStorage.getItem("emailLogs") || "[]");
  logs.push(logEntry);
  if (logs.length > 50) logs.shift(); // Garder seulement 50 derniers logs
  sessionStorage.setItem("emailLogs", JSON.stringify(logs));

  return logEntry;
}

// Fonction pour consulter les logs d'emails
export function getEmailLogs() {
  return JSON.parse(sessionStorage.getItem("emailLogs") || "[]");
}

// Vider les logs
export function clearEmailLogs() {
  sessionStorage.removeItem("emailLogs");
  console.log("📧 Logs d'email vidés");
}
