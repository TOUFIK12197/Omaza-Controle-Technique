// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBp_0y-oZX4XZKxOCI5r_2dbLzlNF8XP60",
  authDomain: "omaza-ct.firebaseapp.com",
  projectId: "omaza-ct",
  storageBucket: "omaza-ct.firebasestorage.app",
  messagingSenderId: "843595601119",
  appId: "1:843595601119:web:a6585a90cbb205edfac56a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);