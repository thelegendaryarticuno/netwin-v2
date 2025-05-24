import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Firestore import

const firebaseConfig = {
  apiKey: "AIzaSyB0Kl8_9ZwlV1xcwdVmPgBlB2OFJJSB1tk",
  authDomain: "netwin-f0e6d.firebaseapp.com",
  projectId: "netwin-f0e6d",
  storageBucket: "netwin-f0e6d.appspot.com", // keep this for completeness, even if not used
  messagingSenderId: "175912468381",
  appId: "1:175912468381:web:7745928e58577d01f67974"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export { auth, db, app };
