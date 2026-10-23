import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export const LOCAL_VAULT_KEY = 'indosati_office_persistent_vault_v2';

export interface PersistentSuiteSnapshot {
  openingBalance: number;
  openingBalanceCustomized?: boolean;
  expenseCategories: string[];
  expensePersons: any[];
  linkedApps: any[];
  orders: any[];
  expenses: any[];
  advances: any[];
  notifications: any[];
  savedAt?: string;
}

export function saveToLocalVault(snapshot: PersistentSuiteSnapshot) {
  try {
    const payload: PersistentSuiteSnapshot = {
      ...snapshot,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Local vault write warning:', err);
  }
}

export function loadFromLocalVault(): PersistentSuiteSnapshot | null {
  try {
    const raw = localStorage.getItem(LOCAL_VAULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.orders) && Array.isArray(parsed.expenses)) {
      return parsed;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutFromCloud(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'default_workspace';
}

export async function saveWorkspaceToFirestore(
  uid: string,
  snapshot: PersistentSuiteSnapshot
): Promise<void> {
  if (!auth.currentUser || !uid) return;
  const docId = sanitizeId(uid);
  const path = `workspaces/${docId}`;
  const docRef = doc(db, 'workspaces', docId);

  const cleanPayload = {
    ownerId: uid,
    openingBalance: Math.max(0, Number(snapshot.openingBalance ?? 500)),
    expenseCategories: (snapshot.expenseCategories || []).slice(0, 50).map((c) => String(c).slice(0, 100)),
    orders: (snapshot.orders || []).slice(0, 500),
    expenses: (snapshot.expenses || []).slice(0, 1000),
    advances: (snapshot.advances || []).slice(0, 500),
    expensePersons: (snapshot.expensePersons || []).slice(0, 100),
    linkedApps: (snapshot.linkedApps || []).slice(0, 50),
    notifications: (snapshot.notifications || []).slice(0, 200),
  };

  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        ...cleanPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        ...cleanPayload,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadWorkspaceFromFirestore(
  uid: string
): Promise<PersistentSuiteSnapshot | null> {
  if (!auth.currentUser || !uid) return null;
  const docId = sanitizeId(uid);
  const path = `workspaces/${docId}`;
  const docRef = doc(db, 'workspaces', docId);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      openingBalance: typeof data.openingBalance === 'number' ? data.openingBalance : 500,
      openingBalanceCustomized: true,
      expenseCategories: Array.isArray(data.expenseCategories) ? data.expenseCategories : [],
      expensePersons: Array.isArray(data.expensePersons) ? data.expensePersons : [],
      linkedApps: Array.isArray(data.linkedApps) ? data.linkedApps : [],
      orders: Array.isArray(data.orders) ? data.orders : [],
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      advances: Array.isArray(data.advances) ? data.advances : [],
      notifications: Array.isArray(data.notifications) ? data.notifications : [],
      savedAt: new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}
