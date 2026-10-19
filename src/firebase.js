// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBw192BUT5MxqMYIYQ4BjyU2qyOrMPJJ7w",
  authDomain: "hackvally-10e6a.firebaseapp.com",
  projectId: "hackvally-10e6a",
  storageBucket: "hackvally-10e6a.firebasestorage.app",
  messagingSenderId: "968699922073",
  appId: "1:968699922073:web:422e4f7f8024c20c931a08",
  measurementId: "G-3BVEY2BF7V"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally (only in browser environment)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
