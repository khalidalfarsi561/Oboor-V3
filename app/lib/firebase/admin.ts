import * as admin from "firebase-admin";

type MockDocData = Record<string, unknown>;

type MockDocSnapshot = {
  exists: boolean;
  data: () => MockDocData | undefined;
};

type MockQuerySnapshot = {
  empty: boolean;
  docs: Array<{
    id: string;
    data: () => MockDocData;
    ref: MockDocumentRef;
  }>;
  data: () => { count: number };
};

type MockDocumentRef = {
  id: string;
  get: () => Promise<MockDocSnapshot>;
  set: (_data: MockDocData, _options?: { merge?: boolean }) => Promise<void>;
  update: (_data: MockDocData) => Promise<void>;
  delete: () => Promise<void>;
};

type MockQueryRef = {
  get: () => Promise<MockQuerySnapshot>;
  limit: (_count: number) => MockQueryRef;
  where: (_field: string, _op: string, _value: unknown) => MockQueryRef;
  orderBy: (_field: string, _direction?: string) => MockQueryRef;
  count: () => { get: () => Promise<MockQuerySnapshot> };
};

type MockCollectionRef = MockQueryRef & {
  doc: (id?: string) => MockDocumentRef;
};

type MockTransaction = {
  get: (
    ref: MockDocumentRef | MockQueryRef
  ) => Promise<MockDocSnapshot | MockQuerySnapshot>;
  set: (
    _ref: MockDocumentRef,
    _data: MockDocData,
    _options?: { merge?: boolean }
  ) => void;
  update: (_ref: MockDocumentRef, _data: MockDocData) => void;
};

type MockAuth = {
  verifyIdToken: (idToken: string) => Promise<{ uid: string }>;
};

const hasServiceAccountCredentials =
  Boolean(process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) ||
  Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

function createEmptyDocSnapshot(): MockDocSnapshot {
  return {
    exists: false,
    data: () => undefined,
  };
}

function createEmptyQuerySnapshot(): MockQuerySnapshot {
  return {
    empty: true,
    docs: [],
    data: () => ({ count: 0 }),
  };
}

function createMockDocumentRef(id: string): MockDocumentRef {
  return {
    id,
    get: async () => createEmptyDocSnapshot(),
    set: async () => undefined,
    update: async () => undefined,
    delete: async () => undefined,
  };
}

function createMockQueryRef(): MockQueryRef {
  const queryRef: MockQueryRef = {
    get: async () => createEmptyQuerySnapshot(),
    limit: () => queryRef,
    where: () => queryRef,
    orderBy: () => queryRef,
    count: () => ({
      get: async () => createEmptyQuerySnapshot(),
    }),
  };

  return queryRef;
}

function createMockCollectionRef(): MockCollectionRef {
  const queryRef = createMockQueryRef();

  return {
    ...queryRef,
    doc: (id = "") => createMockDocumentRef(id),
  };
}

function createMockTransaction(): MockTransaction {
  return {
    get: async (ref) => {
      if ("count" in ref) {
        return createEmptyQuerySnapshot();
      }

      return createEmptyDocSnapshot();
    },
    set: () => undefined,
    update: () => undefined,
  };
}

function createMockAuth(): MockAuth {
  return {
    verifyIdToken: async (idToken: string) => {
      if (!idToken) {
        throw new Error("غير مصرح.");
      }

      return { uid: idToken };
    },
  };
}

function createMockFirestore() {
  const collection = (name: string) => {
    void name;
    return createMockCollectionRef();
  };

  return {
    collection,
    runTransaction: async <T>(
      updateFunction: (transaction: MockTransaction) => Promise<T>
    ) => updateFunction(createMockTransaction()),
  };
}

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

if (!admin.apps.length) {
  try {
    if (hasServiceAccountCredentials) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      admin.initializeApp({
        projectId,
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
        }),
      });

      adminDb = admin.firestore();
      adminAuth = admin.auth();
    } else {
      // إيقاف السيرفر فوراً في أي بيئة إنتاجية لحماية البيانات
      throw new Error(
        "CRITICAL SECURITY ERROR: Firebase Service Account credentials missing!"
      );
    }
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
    // إذا كنا في الإنتاج، نمنع التطبيق من المتابعة بالبيانات الوهمية نهائياً
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    // يسمح بالوضع الوهمي فقط في بيئة التطوير المحلية (Local Development)
    const mockFirestore = createMockFirestore();
    adminDb = mockFirestore as unknown as admin.firestore.Firestore;
    adminAuth = createMockAuth() as unknown as admin.auth.Auth;
  }
} else {
  adminDb = admin.firestore();
  adminAuth = admin.auth();
}

export async function getUidFromToken(idToken: string): Promise<string> {
  if (!idToken) throw new Error("غير مصرح.");
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}

export { adminDb, adminAuth };
