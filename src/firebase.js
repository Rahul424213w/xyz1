// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
  collection,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

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

// Initialize Cloud Firestore database (configured for 'default' database instance)
export const db = getFirestore(app, 'default');

// Initialize Analytics conditionally (only in browser environment)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

/**
 * Compresses an image to fit safely within Firestore 1MB document limit
 */
export async function compressImage(dataUrl, maxWidth = 1000, quality = 0.75) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Securely saves team registration to Cloud Firestore
 * Collection: 'registrations'
 * Document ID: registrationId (e.g. HV26-258)
 */
export async function saveTeamRegistrationToFirestore(data) {
  if (!data || !data.registrationId) {
    throw new Error('Registration ID is required to save to Firestore');
  }

  // Compress screenshot if present to prevent exceeding document size limits
  let safeScreenshot = data.paymentScreenshot;
  if (safeScreenshot) {
    try {
      safeScreenshot = await compressImage(safeScreenshot, 1000, 0.75);
    } catch (e) {
      console.warn('[Firestore] Screenshot compression note:', e);
    }
  }

  const docRef = doc(db, 'registrations', data.registrationId);

  const firestoreData = {
    registrationId: data.registrationId,
    teamName: data.teamName || '',
    institute: data.institute || '',
    domain: data.domain || '',
    teamSize: Number(data.teamSize) || 2,
    leaderName: data.leaderName || '',
    leaderEmail: data.leaderEmail || '',
    leaderPhone: data.leaderPhone || '',
    leaderGender: data.leaderGender || 'Not Specified',
    members: Array.isArray(data.members) ? data.members : [],
    boys: Number(data.boys) || 0,
    girls: Number(data.girls) || 0,
    utr: data.utr || '',
    paymentDate: data.paymentDate || '',
    paymentTime: data.paymentTime || '',
    paymentScreenshot: safeScreenshot || null,
    paymentScreenshotName: data.paymentScreenshotName || '',
    paymentStatus: data.paymentStatus || 'Pending Verification',
    status: data.status || 'Pending',
    submittedAt: data.submittedAt || new Date().toISOString(),
    createdAtTimestamp: serverTimestamp()
  };

  console.log(`[Firestore] Saving team registration: ${firestoreData.teamName} [${firestoreData.registrationId}]...`);
  await setDoc(docRef, firestoreData, { merge: true });
  console.log(`[Firestore] ✅ Team registration saved successfully: ${firestoreData.registrationId}`);
  return { success: true, registrationId: firestoreData.registrationId };
}

/**
 * Fetches all team registrations from Firestore
 */
export async function getTeamRegistrationsFromFirestore() {
  try {
    const colRef = collection(db, 'registrations');
    const snapshot = await getDocs(colRef);
    const teams = [];
    snapshot.forEach((docSnap) => {
      teams.push(docSnap.data());
    });
    console.log(`[Firestore] Loaded ${teams.length} teams from Firestore`);
    return teams;
  } catch (err) {
    console.warn('[Firestore] Error fetching registrations:', err);
    return [];
  }
}

/**
 * Updates team registration status (e.g. 'Approved', 'Rejected') in Firestore
 */
export async function updateTeamStatusInFirestore(registrationId, updates = {}) {
  try {
    const docRef = doc(db, 'registrations', registrationId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log(`[Firestore] ✅ Team ${registrationId} status updated successfully`);
    return true;
  } catch (err) {
    console.warn(`[Firestore] Error updating team status for ${registrationId}:`, err);
    return false;
  }
}

/**
 * Permanently deletes a team registration from Firestore (Team Bin)
 */
export async function deleteTeamFromFirestore(registrationId) {
  try {
    const docRef = doc(db, 'registrations', registrationId);
    await deleteDoc(docRef);
    console.log(`[Firestore] 🗑️ Permanently deleted team registration: ${registrationId}`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error deleting team ${registrationId}:`, err);
    throw err;
  }
}

/**
 * ── Admin Panel PIN (Stored in Cloud Firestore) ──
 * Document: config/admin_pin
 * NOTE: Default PIN ('jcerbhackvally') is never saved to the database. Only accessPin & defaultPinEnabled.
 */
export async function getAdminPinConfigFromFirestore() {
  try {
    const docRef = doc(db, 'config', 'admin_pin');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        accessPin: data.accessPin || 'admin2026',
        defaultPinEnabled: data.defaultPinEnabled !== false
      };
    }
    // Initialize default if doesn't exist
    const initial = { accessPin: 'admin2026', defaultPinEnabled: true };
    await setDoc(docRef, { ...initial, createdAt: new Date().toISOString() });
    return initial;
  } catch (err) {
    console.warn('[Firestore] Error reading admin PIN config:', err);
    return { accessPin: 'admin2026', defaultPinEnabled: true };
  }
}

export async function saveAdminPinConfigToFirestore({ accessPin, defaultPinEnabled }) {
  try {
    const docRef = doc(db, 'config', 'admin_pin');
    const payload = {
      defaultPinEnabled: typeof defaultPinEnabled === 'boolean' ? defaultPinEnabled : true,
      updatedAt: new Date().toISOString()
    };
    if (accessPin && accessPin.trim()) {
      payload.accessPin = accessPin.trim();
    }
    await setDoc(docRef, payload, { merge: true });
    console.log('[Firestore] ✅ Admin PIN configuration saved to Firestore');
    return true;
  } catch (err) {
    console.error('[Firestore] Error saving admin PIN config:', err);
    throw err;
  }
}

/**
 * ── Team Bin PIN (Stored in Cloud Firestore) ──
 * Document: config/bin_pin
 * Default access PIN: 'jcer'
 */
export async function getBinPinConfigFromFirestore() {
  try {
    const docRef = doc(db, 'config', 'bin_pin');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        accessPin: data.accessPin || 'jcer',
        defaultPinEnabled: data.defaultPinEnabled !== false
      };
    }
    // Initialize default if doesn't exist (default PIN: 'jcer')
    const initial = { accessPin: 'jcer', defaultPinEnabled: true };
    await setDoc(docRef, { ...initial, createdAt: new Date().toISOString() });
    return initial;
  } catch (err) {
    console.warn('[Firestore] Error reading bin PIN config:', err);
    return { accessPin: 'jcer', defaultPinEnabled: true };
  }
}

export async function saveBinPinConfigToFirestore({ accessPin, defaultPinEnabled }) {
  try {
    const docRef = doc(db, 'config', 'bin_pin');
    const payload = {
      defaultPinEnabled: typeof defaultPinEnabled === 'boolean' ? defaultPinEnabled : true,
      updatedAt: new Date().toISOString()
    };
    if (accessPin && accessPin.trim()) {
      payload.accessPin = accessPin.trim();
    }
    await setDoc(docRef, payload, { merge: true });
    console.log('[Firestore] ✅ Team Bin PIN configuration saved to Firestore');
    return true;
  } catch (err) {
    console.error('[Firestore] Error saving bin PIN config:', err);
    throw err;
  }
}

/**
 * ── Admin Users Access Management (Stored in Cloud Firestore) ──
 * Document: config/admin_users
 */
export async function getAdminUsersFromFirestore() {
  try {
    const docRef = doc(db, 'config', 'admin_users');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.users) && data.users.length > 0) {
        return data.users;
      }
    }
    // Initialize default super admin
    const defaultUsers = [
      {
        id: 'admin_1',
        email: 'swayamuk1@gmail.com',
        password: 'admin123',
        role: 'Super Admin',
        createdAt: new Date().toISOString()
      }
    ];
    await setDoc(docRef, { users: defaultUsers, updatedAt: new Date().toISOString() });
    return defaultUsers;
  } catch (err) {
    console.warn('[Firestore] Error reading admin users:', err);
    return [
      {
        id: 'admin_1',
        email: 'swayamuk1@gmail.com',
        password: 'admin123',
        role: 'Super Admin',
        createdAt: new Date().toISOString()
      }
    ];
  }
}

export async function saveAdminUsersToFirestore(users) {
  try {
    const docRef = doc(db, 'config', 'admin_users');
    await setDoc(docRef, {
      users: Array.isArray(users) ? users : [],
      updatedAt: new Date().toISOString()
    });
    console.log(`[Firestore] ✅ Saved ${users.length} admin users to Firestore`);
    return true;
  } catch (err) {
    console.error('[Firestore] Error saving admin users:', err);
    throw err;
  }
}

