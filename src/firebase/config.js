import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace with your Firebase project config
const firebaseConfig = {
apiKey: "AIzaSyDm3bdkQQe8etFKrwaiIvS8Fbx2Xtuk944",
  authDomain: "armb-1c630.firebaseapp.com",
  projectId: "armb-1c630",
  storageBucket: "armb-1c630.firebasestorage.app",
  messagingSenderId: "312951205199",
  appId: "1:312951205199:web:5ab3a61dae2ebaf7a9693a",
  measurementId: "G-JBXVJ66JJ1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
