import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ===========================
   INSCRIPTION
=========================== */
export async function registerUser(data) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      prenom: data.prenom,
      nom: data.nom,
      telephone: data.telephone,
      email: data.email,
      role: "client",
      createdAt: new Date()
    });

    return { success: true };

  } catch (error) {
    return { success: false, message: error.message };
  }
}

/* ===========================
   CONNEXION
=========================== */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    /* Récupérer le rôle depuis Firestore */
    const snap = await getDoc(doc(db, "users", user.uid));
    const role = snap.exists() ? snap.data().role : "client";

    return { success: true, role: role };

  } catch (error) {
    return { success: false, message: error.message };
  }
}

/* ===========================
   DECONNEXION
=========================== */
export async function logoutUser() {
  await signOut(auth);
}

/* ===========================
   SESSION
=========================== */
export function observeAuth(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

/* ===========================
   RÉINITIALISATION DU MOT DE PASSE
=========================== */
export async function resetUserPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, code: error.code, message: error.message };
  }
}
