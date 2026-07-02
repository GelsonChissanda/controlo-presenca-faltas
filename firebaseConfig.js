import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCwY7qzny_87J0D0U1UvIMXMB7ul4yLpV0",
  authDomain: "controlo-presenca-falta-2pnc87.firebaseapp.com",
  projectId: "controlo-presenca-falta-2pnc87",
  storageBucket: "controlo-presenca-falta-2pnc87.firebasestorage.app",
  messagingSenderId: "541041377414",
  appId: "1:541041377414:web:d8666b7bfb5dad01059107",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);