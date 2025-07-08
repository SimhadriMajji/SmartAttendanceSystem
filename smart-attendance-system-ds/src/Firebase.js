import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCVkScTpMk8_AXSDaA3sBzmE5W-U5HHXwk",
  authDomain: "attendance-1ec21.firebaseapp.com",
  projectId: "attendance-1ec21",
  storageBucket: "attendance-1ec21.appspot.com",
  messagingSenderId: "103579209762",
  appId: "1:103579209762:web:243a56a907591f1648fa7b",
  measurementId: "G-NETQ5CY4NR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };