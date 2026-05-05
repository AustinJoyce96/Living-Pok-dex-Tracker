import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, getRedirectResult, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyA6UhnLJ_pKgnvRtSEy4RXbeKx-7iSAdMk",
  authDomain: "pokemon-companion-bcb97.firebaseapp.com",
  projectId: "pokemon-companion-bcb97",
  storageBucket: "pokemon-companion-bcb97.firebasestorage.app",
  messagingSenderId: "428610243796",
  appId: "1:428610243796:web:1977ba7232460a634cbf41"
};

const app = initializeApp(firebaseConfig);

// App Check — invisible reCAPTCHA v3, verifies requests come from your app
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LckHNYsAAAAAIKzLwhfQZV4mj5xs0ZF33jhQvcF"),
  isTokenAutoRefreshEnabled: true,
});
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt: "select_account"});

// ─── Allowed users ────────────────────────────────────────────────────────────
// Add email addresses of people allowed to use the app.
export const ALLOWED_EMAILS = new Set([
  "austinjoyce96@gmail.com",
  "joshualeehenry91@gmail.com",
  "nh260103@gmail.com",
  "crimminalec@gmail.com",
  "fablesfounding@gmail.com",
]);

export { signInWithRedirect, signInWithPopup, getRedirectResult, signOut, onAuthStateChanged, doc, setDoc, getDoc, onSnapshot, collection, getDocs, type User };
