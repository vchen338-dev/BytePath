export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAsBJXcC75ST3Sq-1Ebn2JzZulaSC9rPGM",
  authDomain: "bytepath-b0c80.firebaseapp.com",
  projectId: "bytepath-b0c80",
  storageBucket: "bytepath-b0c80.firebasestorage.app",
  messagingSenderId: "602265408473",
  appId: "1:602265408473:web:648293196d756f3b583fc8",
  measurementId: "G-WPP0BXWJ42"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);