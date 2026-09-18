import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


/* ==============================================
   Détecter automatiquement le chemin de base
=============================================== */
function getBasePath() {
    const path = window.location.pathname;
    if (path.includes("/pages/")) return "../";
    return "";
}


/* ==============================================
   Initialiser la session (navbar dynamique)
=============================================== */
export function initSession() {

    onAuthStateChanged(auth, async (user) => {

        const navItem = document.getElementById("navUserItem");
        if (!navItem) return;

        const base = getBasePath();

        if (user) {

            // Récupérer les infos utilisateur
            let prenom = "Compte";
            let role = "client";

            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) {
                    prenom = snap.data().prenom || "Compte";
                    role   = snap.data().role   || "client";
                }
            } catch (err) {
                console.error("Erreur Firestore :", err);
            }

            // ✅ Lien dynamique selon le rôle
            const basePath = getBasePath();
            const lienEspace = role === "admin"
                ? basePath + "pages/admin.html"
                : basePath + "pages/mes-rendez-vous.html";

            // ✅ Icône dynamique selon le rôle
            const icone = role === "admin"
                ? "fa-user-shield"
                : "fa-user-circle";

            navItem.innerHTML = `
                <div class="user-menu">
                    <a href="${lienEspace}" class="user-greeting">
                        <i class="fas ${icone}"></i> ${prenom}
                    </a>
                    <button id="btnLogout" class="btn-logout">
                        <i class="fas fa-sign-out-alt"></i> Déconnexion
                    </button>
                </div>
            `;

            // Bouton de déconnexion
            document.getElementById("btnLogout")
                .addEventListener("click", async () => {
                    try {
                        await signOut(auth);
                        window.location.href = "/index.html";
                    } catch (err) {
                        console.error("Erreur déconnexion :", err);
                    }
                });

        } else {

            // Pas connecté → bouton "Mon Espace"
            navItem.innerHTML = `
                <a href="${base}pages/inscription.html" class="nav-link btn-nav">
                    <i class="fas fa-user"></i> Mon Espace
                </a>
            `;

        }

    });

}


/* ==============================================
   Protection page Admin
=============================================== */
export function protectAdminPage() {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {
            window.location.href = basePath + "pages/inscription.html";
            return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists() || snap.data().role !== "admin") {
            alert("Accès refusé ❌");
            window.location.href = basePath + "index.html";
        }

    });

}