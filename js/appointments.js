// js/appointments.js
import { auth, db } from "./firebase-config.js";
import { EMAILJS_CONFIG, logEmailAttempt } from "./emailjs-config.js";
import {
  APPOINTMENT_STATUS,
  isTechnicalAppointmentStatus,
  normalizeAppointmentStatus
} from "./statuses.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  runTransaction,
  writeBatch,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ============================================================
   CONFIGURATION EMAILJS
============================================================ */
const EMAILJS_SERVICE_ID         = EMAILJS_CONFIG.SERVICE_ID;
const EMAILJS_TEMPLATE_CLIENT    = EMAILJS_CONFIG.TEMPLATES.CLIENT;
const EMAILJS_TEMPLATE_ADMIN     = EMAILJS_CONFIG.TEMPLATES.ADMIN;
const ADMIN_EMAIL                = EMAILJS_CONFIG.ADMIN_EMAIL;

function getSlotId(date, heure) {
  return `${date.slice(0, 10)}_${heure.replace(":", "-")}`;
}


/* ============================================================
   CRÉER UN RENDEZ-VOUS
============================================================ */
/* ============================================================
    CRÉER UN RENDEZ-VOUS
    ✅ + Email client + Email admin (nouveau RDV)
============================================================ */
export async function createAppointment(data) {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, message: "Vous devez être connecté." };

    const appointmentsRef = collection(db, "appointments");
    const docRef = doc(appointmentsRef);
    const slotId = getSlotId(data.date, data.heure);
    const slotRef = doc(db, "appointmentSlots", slotId);
    const appointment = {
      userId: user.uid,
      prenom: data.prenom,
      nom: data.nom,
      telephone: data.telephone,
      email: user.email,
      wilaya: data.wilaya || "",
      categorie: data.categorie,
      marque: data.marque,
      modele: data.modele || "",
      immatriculation: data.immatriculation,
      anneeVehicule: data.anneeVehicule || "",
      service: data.service,
      commentaire: data.commentaire || "",
      date: data.date,
      heure: data.heure,
      slotId,
      status: APPOINTMENT_STATUS.PENDING,
      createdAt: serverTimestamp()
    };

    // La transaction est relancée par Firestore en cas de concurrence :
    // un seul client peut créer le verrou du créneau.
    await runTransaction(db, async (transaction) => {
      const existingSlot = await transaction.get(slotRef);
      if (existingSlot.exists()) {
        throw new Error("slot-already-reserved");
      }

      transaction.set(slotRef, {
        userId: user.uid,
        appointmentId: docRef.id,
        date: data.date,
        heure: data.heure,
        createdAt: serverTimestamp()
      });
      transaction.set(docRef, appointment);
    });

    // 📧 Envoyer email admin pour NOUVEAU RDV
    if (typeof window.emailjs !== "undefined") {
      try {
        const rdvData = { id: docRef.id, ...data, email: user.email };
        await sendAdminNotificationNewAppointment(rdvData);
      } catch (emailErr) {
        console.warn("⚠️ Email admin non envoyé pour nouveau RDV:", emailErr.message);
      }
    }

    return { success: true, id: docRef.id };
  } catch (e) {
    console.error("Erreur création RDV :", e);
    const message = e.message === "slot-already-reserved"
      ? "Ce créneau vient d’être réservé par un autre client. Choisissez-en un autre."
      : e.message;
    return { success: false, message };
  }
}


/* ============================================================
   MES RENDEZ-VOUS (Client)
============================================================ */
export async function getMyAppointments() {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      // Compatibilité temporaire avec les rendez-vous créés avant les statuts techniques.
      status: normalizeAppointmentStatus(d.data().status)
    }));
  } catch (e) {
    console.error("Erreur RDV client :", e);
    return [];
  }
}


/* ============================================================
   TOUS LES RDV (Admin)
============================================================ */
export async function getAllAppointments() {
  try {
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      status: normalizeAppointmentStatus(d.data().status)
    }));
  } catch (e) {
    console.error("Erreur RDV admin :", e);
    return [];
  }
}


/* ============================================================
   AUDIT LOG
============================================================ */
export async function logAdminAction(rdvId, action, extra = {}) {
  try {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "auditLogs"), {
      userId: user.uid,
      email: user.email,
      rdvId: rdvId,
      action: action,
      ...extra,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Erreur audit log :", e);
  }
}


/* ============================================================
   BUILD DES PARAMS EMAIL CLIENT (selon statut)
============================================================ */
function buildClientEmailParams(rdv, newStatus, cancelReason) {
  // Paramètres simples pour le template omaza_confirmation_rdv
  return {
    to_email      : rdv.email || "",
    prenom        : rdv.prenom || "",
    nom           : rdv.nom || "",
    date          : rdv.date || "",
    heure         : rdv.heure || "",
    marque        : rdv.marque || "",
    modele        : rdv.modele || "",
    immatriculation : rdv.immatriculation || "",
    service       : rdv.service || "",
    status        : newStatus,
    reason        : cancelReason || ""
  };
}


/* ============================================================
   BUILD DES PARAMS EMAIL ADMIN
============================================================ */
function buildAdminEmailParams(rdv, newStatus, cancelReason, adminEmail) {
  // Paramètres simples pour le template omaza_admin_notif
  return {
    to_email      : ADMIN_EMAIL,
    client_email  : rdv.email || "",
    prenom        : rdv.prenom || "",
    nom           : rdv.nom || "",
    telephone     : rdv.telephone || "",
    date          : rdv.date || "",
    heure         : rdv.heure || "",
    marque        : rdv.marque || "",
    modele        : rdv.modele || "",
    categorie     : rdv.categorie || "",
    immatriculation : rdv.immatriculation || "",
    service       : rdv.service || "",
    status        : newStatus,
    reason        : cancelReason || ""
  };
}


/* ============================================================
    ENVOI EMAIL ADMIN POUR NOUVEAU RDV
============================================================ */
async function sendAdminNotificationNewAppointment(rdv) {
  if (typeof window.emailjs === "undefined") {
    console.warn("⚠️ EmailJS non chargé");
    return { success: false };
  }

  try {
    const params = {
      to_email      : ADMIN_EMAIL,
      client_email  : rdv.email || "",
      prenom        : rdv.prenom || "",
      nom           : rdv.nom || "",
      telephone     : rdv.telephone || "",
      date          : typeof rdv.date === 'string' && rdv.date.includes('T') 
                      ? new Date(rdv.date).toLocaleDateString("fr-FR") 
                      : rdv.date || "",
      heure         : rdv.heure || "",
      marque        : rdv.marque || "",
      modele        : rdv.modele || "",
      categorie     : rdv.categorie || "",
      immatriculation : rdv.immatriculation || "",
      service       : rdv.service || ""
    };

    await window.emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ADMIN,
      params
    );

    console.log("✅ Email admin (nouveau RDV) envoyé");
    return { success: true };
  } catch (err) {
    console.error("❌ Erreur email admin :", err);
    return { success: false, error: err.message };
  }
}


/* ============================================================
   ENVOI DES EMAILS (Client + Admin en parallèle) - AVEC RETRY
============================================================ */
async function sendEmailWithRetry(serviceId, templateId, params, maxRetries = 3) {
  const recipientEmail = params.to_email || "unknown";
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await window.emailjs.send(serviceId, templateId, params);
      
      // Logger succès
      logEmailAttempt({
        status: "success",
        templateId,
        recipientEmail,
        attempt
      });
      
      return { success: true, attempt };
    } catch (err) {
      console.error(`❌ Tentative ${attempt}/${maxRetries} échouée:`, err.message);
      
      // Logger tentative échouée
      logEmailAttempt({
        status: "failed",
        templateId,
        recipientEmail,
        error: err,
        attempt
      });
      
      // Ne pas réessayer si erreur de validation
      if (err.message && (err.message.includes("Missing") || err.message.includes("Invalid"))) {
        console.error("❌ Erreur de configuration EmailJS — pas de retry");
        return { success: false, attempt, error: err.message };
      }

      // Attendre avant nouvelle tentative (exponential backoff)
      if (attempt < maxRetries) {
        const delayMs = 1000 * attempt;
        console.log(`⏳ Attente ${delayMs}ms avant nouvelle tentative...`);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  
  // Log final d'échec
  logEmailAttempt({
    status: "failed",
    templateId,
    recipientEmail,
    error: { message: "Max retries reached" },
    attempt: maxRetries
  });
  
  return { success: false, attempt: maxRetries, error: "Max retries reached" };
}

async function sendStatusEmails(rdv, newStatus, cancelReason, adminEmail) {
  // Vérifier qu'EmailJS est dispo (chargé en global dans le HTML)
  if (typeof window.emailjs === "undefined") {
    console.warn("⚠️ EmailJS non chargé — emails non envoyés.");
    return { success: false, message: "EmailJS not loaded" };
  }

  // ✅ On utilise la même logique de message clair que sendClientEmail
  // (titre, message_principal, statut_label, raison)
  const results = { client: null };

  if (rdv?.email) {
    // On envoie une seule fois avec retry
    const recipientEmail = rdv.email;

    // Construire les params exactement comme sendClientEmail
    let titre = "";
    let message_principal = "";
    let statut_label = "";

    if (newStatus === APPOINTMENT_STATUS.CONFIRMED) {
      titre = "✅ Votre rendez-vous OMAZA est confirmé";
      message_principal = "Votre rendez-vous au Centre OMAZA a été CONFIRMÉ par notre équipe.";
      statut_label = "✅ Confirmé";
    } else if (newStatus === APPOINTMENT_STATUS.CANCELLED) {
      titre = "❌ Votre rendez-vous OMAZA a été annulé";
      message_principal = "Votre rendez-vous au Centre OMAZA a été ANNULÉ." +
        (cancelReason ? ` Raison : ${cancelReason}.` : "") +
        " Vous pouvez en reprendre un autre depuis votre espace client.";
      statut_label = "❌ Annulé";
    } else if (newStatus === APPOINTMENT_STATUS.COMPLETED) {
      titre = "🏁 Votre rendez-vous OMAZA est terminé";
      message_principal = "Votre rendez-vous au Centre OMAZA est marqué comme terminé. Merci pour votre visite 🚗";
      statut_label = "🏁 Terminé";
    }

    const clientParams = {
      to_email: recipientEmail,
      prenom: rdv.prenom,
      date: new Date(rdv.date).toLocaleDateString("fr-FR"),
      heure: rdv.heure,
      marque: rdv.marque,
      modele: rdv.modele || "",
      immatriculation: rdv.immatriculation,
      service: rdv.service,
      titre,
      message_principal,
      statut_label,
      raison: cancelReason || ""
    };

    console.log(`📧 Envoi email client [${newStatus}] à ${recipientEmail}...`);
    results.client = await sendEmailWithRetry(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CLIENT, clientParams);
  } else {
    console.warn("⚠️ Email client: email manquant");
    results.client = { success: false, error: "missing recipient" };
  }

  // ❌ L'admin ne reçoit l'email que pour les NOUVEAUX RDV (voir createAppointment)
  console.log("ℹ️ Admin notifié uniquement pour les nouveaux rendez-vous (pas pour les changements de statut)");

  return results;
}


/* ============================================================
   MISE À JOUR STATUT RDV
   ✅ + Audit log
   ✅ + Emails automatiques (Confirmé / Annulé / Terminé) avec retry
============================================================ */
export async function updateAppointmentStatus(id, status, cancelReason = null) {
  try {
    if (!Object.values(APPOINTMENT_STATUS).includes(status)) {
      return { success: false, message: "Statut de rendez-vous invalide." };
    }
    // 1. Récupérer les données du RDV AVANT de modifier
    const rdvRef  = doc(db, "appointments", id);
    const rdvSnap = await getDoc(rdvRef);

    if (!rdvSnap.exists()) {
      return { success: false, message: "RDV introuvable." };
    }
    const rdvData = { id: rdvSnap.id, ...rdvSnap.data() };

    // 2. Mise à jour Firestore
    const updatePayload = { status };
    if (cancelReason) updatePayload.cancelReason = cancelReason;

    const batch = writeBatch(db);
    batch.update(rdvRef, updatePayload);
    if (status === APPOINTMENT_STATUS.CANCELLED && rdvData.slotId) {
      batch.delete(doc(db, "appointmentSlots", rdvData.slotId));
    }
    await batch.commit();

    // 3. Audit log
    await logAdminAction(id, status, {
      clientName: `${rdvData.prenom || ""} ${rdvData.nom || ""}`.trim(),
      clientEmail: rdvData.email || "",
      plate: rdvData.immatriculation || "",
      cancelReason: cancelReason || null
    });

    // 4. Emails automatiques au CLIENT (Confirmé / Annulé / Terminé)
    if ([
      APPOINTMENT_STATUS.CONFIRMED,
      APPOINTMENT_STATUS.CANCELLED,
      APPOINTMENT_STATUS.COMPLETED
    ].includes(status)) {
      const adminEmail = auth.currentUser ? auth.currentUser.email : "inconnu";
      const emailResults = await sendStatusEmails(rdvData, status, cancelReason, adminEmail);
      
      // Vérifier que l'email client est parti
      if (emailResults && !emailResults.client?.success) {
        console.warn("⚠️ Email client n'a pas pu être envoyé");
      }
    }

    return { success: true };
  } catch (e) {
    console.error("Erreur updateAppointmentStatus :", e);
    return { success: false, message: e.message };
  }
}


/* ============================================================
   STATISTIQUES ADMIN
============================================================ */
export async function getStats() {
  try {
    const snap = await getDocs(collection(db, "appointments"));
    const all = snap.docs.map(d => d.data());
    const today = new Date().toDateString();

    return {
      total: all.length,
      today: all.filter(r => r.date && new Date(r.date).toDateString() === today).length,
      pending: all.filter(r => normalizeAppointmentStatus(r.status) === APPOINTMENT_STATUS.PENDING).length,
      confirmed: all.filter(r => normalizeAppointmentStatus(r.status) === APPOINTMENT_STATUS.CONFIRMED).length,
      cancelled: all.filter(r => normalizeAppointmentStatus(r.status) === APPOINTMENT_STATUS.CANCELLED).length,
      completed: all.filter(r => normalizeAppointmentStatus(r.status) === APPOINTMENT_STATUS.COMPLETED).length
    };
  } catch (e) {
    console.error("Erreur stats :", e);
    return {};
  }
}


/* ============================================================
   ADMIN — Liste utilisateurs
============================================================ */
export async function getAllUsers() {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error("Erreur getAllUsers :", e);
    return [];
  }
}


/* ============================================================
   ADMIN — RDV d'un client
============================================================ */
export async function getAppointmentsByUser(userId) {
  try {
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      status: normalizeAppointmentStatus(d.data().status)
    }));
  } catch (e) {
    console.error("Erreur getAppointmentsByUser :", e);
    return [];
  }
}


/* ============================================================
    ADMIN — ENVOI EMAIL CLIENT (centralisé)
============================================================ */
export async function sendClientEmail(rdv, action, reason = "") {
  if (!rdv) return { success: false };
  
  if (typeof window.emailjs === "undefined") {
    console.warn("⚠️ EmailJS non chargé");
    return { success: false };
  }

  try {
    let titre = "";
    let message_principal = "";
    let statut_label = "";

    if (action === APPOINTMENT_STATUS.CONFIRMED) {
      titre = "✅ Votre rendez-vous OMAZA est confirmé";
      message_principal = "Votre rendez-vous au Centre OMAZA a été CONFIRMÉ par notre équipe.";
      statut_label = "✅ Confirmé";
    } 
    else if (action === APPOINTMENT_STATUS.CANCELLED) {
      titre = "❌ Votre rendez-vous OMAZA a été annulé";
      message_principal = "Votre rendez-vous au Centre OMAZA a été ANNULÉ." +
                          (reason ? ` Raison : ${reason}.` : "") +
                          " Vous pouvez en reprendre un autre depuis votre espace client.";
      statut_label = "❌ Annulé";
    }
    else if (action === APPOINTMENT_STATUS.COMPLETED) {
      titre = "🏁 Votre rendez-vous OMAZA est terminé";
      message_principal = "Votre rendez-vous au Centre OMAZA est marqué comme terminé. Merci pour votre visite 🚗";
      statut_label = "🏁 Terminé";
    }

    if (!titre) return { success: false };

    await window.emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_CLIENT,
      {
        to_email: rdv.email,
        prenom: rdv.prenom,
        date: new Date(rdv.date).toLocaleDateString("fr-FR"),
        heure: rdv.heure,
        marque: rdv.marque,
        modele: rdv.modele || "",
        immatriculation: rdv.immatriculation,
        service: rdv.service,
        titre: titre,
        message_principal: message_principal,
        statut_label: statut_label,
        raison: reason || ""
      }
    );

    console.log("✅ Email client envoyé :", action);
    return { success: true };

  } catch (err) {
    console.error("❌ Erreur email :", err);
    return { success: false, error: err.message };
  }
}

/* ===========================
   CRÉNEAUX RÉSERVÉS (anti double-RDV)
=========================== */
export async function getReservedSlotsByDate(dateISO) {
    try {
        const q = query(
            collection(db, "appointmentSlots"),
            where("date", "==", dateISO)
        );
        const snap = await getDocs(q);

        return snap.docs
            .map(d => d.data())
            .map(r => r.heure);

    } catch (e) {
        console.error("Erreur getReservedSlotsByDate :", e);
        return [];
    }
}

/* ============================================================
   MIGRATION DES ANCIENS STATUTS (administrateur uniquement)
============================================================ */
export async function migrateLegacyAppointmentStatuses() {
  try {
    const snap = await getDocs(collection(db, "appointments"));
    const legacyAppointments = snap.docs.filter(
      appointment => !isTechnicalAppointmentStatus(appointment.data().status)
    );

    let migrated = 0;
    for (let index = 0; index < legacyAppointments.length; index += 500) {
      const batch = writeBatch(db);
      legacyAppointments.slice(index, index + 500).forEach(appointment => {
        batch.update(appointment.ref, {
          status: normalizeAppointmentStatus(appointment.data().status)
        });
      });
      await batch.commit();
      migrated += Math.min(500, legacyAppointments.length - index);
    }

    return { success: true, migrated };
  } catch (error) {
    console.error("Erreur migration des statuts :", error);
    return { success: false, message: error.message };
  }
}

/* ============================================================
   MIGRATION DES VERROUS DE CRÉNEAUX (administrateur uniquement)
============================================================ */
export async function migrateAppointmentSlots() {
  try {
    const snap = await getDocs(collection(db, "appointments"));
    const appointments = snap.docs
      .map(appointment => ({ ref: appointment.ref, id: appointment.id, ...appointment.data() }))
      .filter(appointment => appointment.date && appointment.heure
        && !appointment.slotId
        && normalizeAppointmentStatus(appointment.status) !== APPOINTMENT_STATUS.CANCELLED);

    let migrated = 0;
    for (const appointment of appointments) {
      const slotId = getSlotId(appointment.date, appointment.heure);
      const slotRef = doc(db, "appointmentSlots", slotId);
      const existingSlot = await getDoc(slotRef);
      if (existingSlot.exists()) continue;

      const batch = writeBatch(db);
      batch.set(slotRef, {
        userId: appointment.userId,
        appointmentId: appointment.id,
        date: appointment.date,
        heure: appointment.heure,
        createdAt: serverTimestamp()
      });
      batch.update(appointment.ref, { slotId });
      await batch.commit();
      migrated += 1;
    }

    return { success: true, migrated };
  } catch (error) {
    console.error("Erreur migration des créneaux :", error);
    return { success: false, message: error.message };
  }
}
