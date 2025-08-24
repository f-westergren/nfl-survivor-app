import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDEigdvmptSDAHbdRvMSJdGDKa4fCGN0K4",
  authDomain: "nfl-survivor-app.firebaseapp.com",
  projectId: "nfl-survivor-app",
  storageBucket: "nfl-survivor-app.firebasestorage.app",
  messagingSenderId: "895088761264",
  appId: "1:895088761264:web:b83bbd8fd40519e43b5e75",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
