// js/email-diagnostic.js
// 🔍 Outil de diagnostic pour les problèmes d'envoi d'emails EmailJS

export function runEmailDiagnostics() {
  console.log("=".repeat(60));
  console.log("📧 DIAGNOSTIC EMAILJS");
  console.log("=".repeat(60));

  // 1. Vérifier EmailJS chargé
  console.log("\n1️⃣  EmailJS SDK Chargé:");
  if (typeof window.emailjs !== "undefined") {
    console.log("✅ EmailJS est disponible");
  } else {
    console.error("❌ EmailJS N'EST PAS CHARGÉ — Vérifiez le <script> dans le HTML");
    return;
  }

  // 2. Vérifier que emailjs.init() a été appelé
  console.log("\n2️⃣  Clé publique EmailJS:");
  const publicKey = localStorage.getItem("emailjs_public_key") || "Non trouvée";
  console.log(`Clé utilisée: ${publicKey}`);
  
  // Les IDs de service et template
  console.log("\n3️⃣  Configuration EmailJS:");
  console.log("Service ID: omaza_email");
  console.log("Template Client: omaza_confirmation_rdv");
  console.log("Template Admin: omaza_admin_notif");
  
  // 4. Test d'envoi
  console.log("\n4️⃣  Test d'envoi d'email:");
  testEmailSend();
}

async function testEmailSend() {
  const testParams = {
    to_email: "omaza.ct@gmail.com",
    prenom: "Test",
    nom: "Diagnostic",
    date: new Date().toLocaleDateString("fr-FR"),
    heure: new Date().toLocaleTimeString("fr-FR"),
    marque: "Test",
    modele: "Diagnostic",
    immatriculation: "TEST-123",
    service: "Diagnostic",
    status: "confirmed",
    reason: ""
  };

  try {
    console.log("📤 Tentative d'envoi d'un email de test...");
    const response = await window.emailjs.send(
      "omaza_email",
      "omaza_confirmation_rdv",
      testParams
    );
    console.log("✅ TEST RÉUSSI — EmailJS fonctionne correctement");
    console.log("Response:", response);
    return true;
  } catch (error) {
    console.error("❌ TEST ÉCHOUÉ — EmailJS a rencontré une erreur:");
    console.error("Message:", error.message);
    console.error("Status:", error.status);
    
    // Analyser le type d'erreur
    if (error.message.includes("Missing")) {
      console.error("⚠️  Il manque un paramètre attendu par le template");
    }
    if (error.message.includes("Invalid")) {
      console.error("⚠️  Erreur de configuration (clé, service ID, ou template ID)");
    }
    if (error.status === 429) {
      console.error("⚠️  Quota EmailJS dépassé (trop d'emails envoyés rapidement)");
    }
    
    return false;
  }
}

// Ajouter à la console globale
window.runEmailDiagnostics = runEmailDiagnostics;

// Exporter aussi pour utilisation en module
export { testEmailSend };
