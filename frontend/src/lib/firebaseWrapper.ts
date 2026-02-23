import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bgrxmhvowawznojdggnl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_qkAxjLVjGHpFGwPuZ93X0g_4VTJyZ6a';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- SHIM FOR FIREBASE APP --- //
export const initializeApp = (config: any) => supabase;
export const getApps = () => [supabase];
export const getApp = () => supabase;
export const deleteApp = (app: any) => Promise.resolve();

// --- SHIM FOR FIREBASE FIRESTORE --- //
export const db = supabase;
export const app = supabase;
export const isFirebaseReady = true;

export class Timestamp {
    seconds: number;
    nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
    }
    static now() {
        return new Timestamp(Math.floor(Date.now() / 1000), 0);
    }
    static fromDate(date: Date) {
        return new Timestamp(Math.floor(date.getTime() / 1000), 0);
    }
    static fromMillis(millis: number) {
        return new Timestamp(Math.floor(millis / 1000), 0);
    }
    toDate() {
        return new Date(this.seconds * 1000);
    }
    toMillis() {
        return this.seconds * 1000;
    }
}
export const serverTimestamp = () => Timestamp.now();

export const arrayUnion = (...elements: any[]) => elements; // partial stub
export const writeBatch = (dbInstance: any) => {
    return {
        set: (docRef: any, data: any) => { },
        update: (docRef: any, data: any) => { },
        delete: (docRef: any) => { },
        commit: async () => { }
    };
};

export const collection = (dbInstance: any, path: string, ...segments: string[]) => {
    const fullPath = [path, ...segments].join('/');
    return { type: 'collection', path: fullPath };
};

export const collectionGroup = (dbInstance: any, path: string) => {
    return { type: 'collection', path }; // stub
};

export const doc = (dbInstance: any, path: string, ...segments: string[]) => {
    if (dbInstance?.type === 'collection') {
        const fullPathId = [path, ...segments].join('/');
        return { type: 'doc', path: dbInstance.path, id: fullPathId };
    }
    const fullPath = [path, ...segments];
    const id = fullPath.pop();
    return { type: 'doc', path: fullPath.join('/'), id };
};

export const query = (ref: any, ...queryConstraints: any[]) => {
    return { ...ref, constraints: queryConstraints };
};

export const where = (fieldPath: string, opStr: string, value: any) => {
    return { type: 'where', fieldPath, opStr, value };
};

export const orderBy = (fieldPath: string, directionStr: 'asc' | 'desc' = 'asc') => {
    return { type: 'orderBy', fieldPath, directionStr };
};

export const limit = (limitAmount: number) => {
    return { type: 'limit', limitAmount };
};

function getTableConfig(path: string) {
    if (path === 'users' || path === 'customers' || path === 'tenants') {
        return { table: path, isGeneric: false };
    }
    return { table: 'firestore_documents', isGeneric: true };
}

export const getDocs = async (queryObj: any) => {
    const { table, isGeneric } = getTableConfig(queryObj.path);
    let builder: any = supabase.from(table).select('*');

    if (isGeneric) builder = builder.eq('collection_path', queryObj.path);

    if (queryObj.constraints) {
        for (const constraint of queryObj.constraints) {
            const field = isGeneric ? `data->>${constraint.fieldPath}` : constraint.fieldPath;
            if (constraint.type === 'where') {
                if (constraint.opStr === '==') builder = builder.eq(field, constraint.value);
            } else if (constraint.type === 'orderBy') {
                builder = builder.order(isGeneric ? `data->${constraint.fieldPath}` : constraint.fieldPath, { ascending: constraint.directionStr === 'asc' });
            } else if (constraint.type === 'limit') {
                builder = builder.limit(constraint.limitAmount);
            }
        }
    }
    const { data } = await builder;
    const items = data || [];
    const docs = items.map((item: any) => {
        const docData = isGeneric ? item.data : mapToFirebaseData(item);
        const docId = isGeneric ? item.doc_id : (item.id || item.uid);
        return {
            id: docId,
            data: () => docData,
            exists: () => true
        };
    });
    return {
        empty: docs.length === 0,
        size: docs.length,
        docs: docs,
        forEach: (cb: any) => docs.forEach(cb)
    };
};

export const getDoc = async (docRef: any) => {
    const { table, isGeneric } = getTableConfig(docRef.path);
    let builder: any = supabase.from(table).select('*');
    if (isGeneric) {
        builder = builder.eq('collection_path', docRef.path).eq('doc_id', docRef.id);
    } else {
        builder = builder.eq('id', docRef.id);
    }
    const { data } = await builder.single();
    return {
        id: docRef.id,
        exists: () => !!data,
        data: () => data ? (isGeneric ? mapToFirebaseData(data.data) : mapToFirebaseData(data)) : undefined,
    };
};

export const addDoc = async (collectionRef: any, data: any) => {
    const { table, isGeneric } = getTableConfig(collectionRef.path);
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    if (isGeneric) {
        await supabase.from(table).insert({ collection_path: collectionRef.path, doc_id: id, data: data });
    } else {
        await supabase.from(table).insert({ id, ...data });
    }
    return { id };
};

export const setDoc = async (docRef: any, data: any, options?: { merge: boolean }) => {
    const { table, isGeneric } = getTableConfig(docRef.path);
    if (isGeneric) {
        const existing = await supabase.from(table).select('data').eq('collection_path', docRef.path).eq('doc_id', docRef.id).single();
        const newData = options?.merge && existing.data ? { ...existing.data.data, ...data } : data;
        await supabase.from(table).upsert({ collection_path: docRef.path, doc_id: docRef.id, data: newData }, { onConflict: 'collection_path,doc_id' });
    } else {
        await supabase.from(table).upsert({ id: docRef.id, ...data });
    }
};

export const updateDoc = async (docRef: any, data: any) => {
    const { table, isGeneric } = getTableConfig(docRef.path);
    if (isGeneric) {
        const existing = await supabase.from(table).select('data').eq('collection_path', docRef.path).eq('doc_id', docRef.id).single();
        if (existing.data) {
            const newData = { ...existing.data.data, ...data };
            await supabase.from(table).update({ data: newData }).eq('collection_path', docRef.path).eq('doc_id', docRef.id);
        }
    } else {
        await supabase.from(table).update(data).eq('id', docRef.id);
    }
};

export const deleteDoc = async (docRef: any) => {
    const { table, isGeneric } = getTableConfig(docRef.path);
    if (isGeneric) {
        await supabase.from(table).delete().eq('collection_path', docRef.path).eq('doc_id', docRef.id);
    } else {
        await supabase.from(table).delete().eq('id', docRef.id);
    }
};

// Snapshot listener stub
export const onSnapshot = (queryObj: any, callbackOrObj: any, errorCallback?: any) => {
    const callback = typeof callbackOrObj === 'function' ? callbackOrObj : callbackOrObj.next;
    Promise.resolve().then(async () => {
        try {
            if (queryObj.type === 'doc') {
                const docSnap = await getDoc(queryObj);
                callback(docSnap);
            } else {
                const querySnap = await getDocs(queryObj);
                callback(querySnap);
            }
        } catch (e) {
            if (errorCallback) errorCallback(e);
        }
    });
    return () => { }; // return unsubscribe function
};

function mapToFirebaseData(obj: any): any {
    const result = { ...obj };
    return result;
}
function mapFromFirebaseData(obj: any): any {
    const result = { ...obj };
    return result;
}

// --- SHIM FOR FIREBASE AUTH --- //
export type User = { uid: string; email: string; displayName?: string; photoURL?: string };
export const auth = supabase.auth;
export const getAuth = (appData: any) => supabase.auth;

export const onAuthStateChanged = (authInstance: any, callback: any) => {
    supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
            callback({ uid: session.user.id, email: session.user.email, emailVerified: true });
        } else {
            callback(null);
        }
    });
    return () => { };
};

export const signInWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return { user: { uid: data.user.id, email: data.user.email as string } };
};

export const createUserWithEmailAndPassword = async (authInstance: any, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) throw error;
    if (!data.user) throw new Error("Signup failed");
    return { user: { uid: data.user.id, email: data.user.email as string } };
};

export const signInWithPopup = async (authInstance: any, provider: any) => {
    return { user: { uid: "stub", email: "stub@example.com", displayName: "", photoURL: "" } as User };
};

export class GoogleAuthProvider {
    constructor() { }
}

export const sendPasswordResetEmail = async (authInstance: any, email: string) => {
    await supabase.auth.resetPasswordForEmail(email);
};

export const signOut = async (authInstance: any) => {
    await supabase.auth.signOut();
};

export const browserLocalPersistence = "LOCAL";
export const setPersistence = async (authInst: any, type: any) => { };

// --- SHIM FOR FIREBASE STORAGE --- //
export const storage = supabase.storage;
export const ref = (storageInstance: any, path: string) => {
    return { type: 'ref', path };
};
export const uploadBytes = async (storageRef: any, file: any, metadata?: any) => {
    // Note: fallback mock storage object due to disabled auto bucket creation
    return { ref: storageRef };
};
export const getDownloadURL = async (storageRef: any) => {
    return "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2670&auto=format&fit=crop";
};

