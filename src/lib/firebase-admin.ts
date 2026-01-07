import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminAuth: ReturnType<typeof getAuth> | null = null;

export function getFirebaseAdminAuth() {
  if (adminAuth) return adminAuth;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = privateKeyRaw?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase admin credentials");
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  adminAuth = getAuth();
  return adminAuth;
}
