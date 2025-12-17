import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDiJ8Zf90ijHqfKE8zzGlX1mAwpKhk57Cw",
  authDomain: "unit3quizapp.firebaseapp.com",
  projectId: "unit3quizapp",
  storageBucket: "unit3quizapp.firebasestorage.app",
  messagingSenderId: "923714014850",
  appId: "1:923714014850:web:b507c2852a8ed44a816e9b",
  measurementId: "G-EPPNNYMZ8W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

