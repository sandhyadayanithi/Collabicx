import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAtLt0dyp4Xr2OAA6mNWDQgB2FrBcscF5o",
    authDomain: "collabix-e9fd6.firebaseapp.com",
    projectId: "collabix-e9fd6",
    storageBucket: "collabix-e9fd6.firebasestorage.app",
    messagingSenderId: "980780357186",
    appId: "1:980780357186:web:2a864e0ae4f2fe4e203fdb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
