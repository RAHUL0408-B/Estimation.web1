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
export const isSupabaseReady = true;

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

const SCHEMA_COLS = {
    users: ['id', 'uid', 'email', 'role', 'tenantId', 'lastLogin', 'createdAt'],
    customers: ['id', 'uid', 'email', 'displayName', 'phoneNumber', 'city', 'photoURL', 'lastLogin', 'createdAt'],
    tenants: ['id', 'ownerUid', 'name', 'status', 'plan', 'createdAt']
};

function getTableConfig(path: string) {
    if (path === 'users' || path === 'customers' || path === 'tenants') {
        return { table: path, isGeneric: false };
    }
    return { table: 'firestore_documents', isGeneric: true };
}

function prepareRelationalData(table: string, payload: any) {
    const result: any = { data: {} };
    const validCols = SCHEMA_COLS[table as keyof typeof SCHEMA_COLS] || [];

    for (const [key, value] of Object.entries(payload)) {
        let val = value;
        // Fix for Firebase Timestamp objects being injected into Postgres TIMESTAMPTZ columns natively
        if (val && typeof val === 'object' && val.constructor && val.constructor.name === 'Timestamp' && typeof (val as any).toDate === 'function') {
            val = (val as any).toDate().toISOString();
        }

        if (validCols.includes(key)) {
            result[key] = val;
        } else if (key !== 'id') {
            result.data[key] = val;
        }
    }
    return result;
}

export const getDocs = async (queryObj: any) => {
    const { table, isGeneric } = getTableConfig(queryObj.path);
    let builder: any = supabase.from(table).select('*');

    if (isGeneric) builder = builder.eq('collection_path', queryObj.path);

    if (queryObj.constraints) {
        const validCols = SCHEMA_COLS[table as keyof typeof SCHEMA_COLS] || [];
        for (const constraint of queryObj.constraints) {
            let field = constraint.fieldPath;
            if (isGeneric) {
                field = `data->>${constraint.fieldPath}`;
            } else if (!validCols.includes(field)) {
                field = `data->>${constraint.fieldPath}`;
            }

            if (constraint.type === 'where') {
                if (constraint.opStr === '==') builder = builder.eq(field, constraint.value);
                else if (constraint.opStr === '!=') builder = builder.neq(field, constraint.value);
                else if (constraint.opStr === '>') builder = builder.gt(field, constraint.value);
                else if (constraint.opStr === '>=') builder = builder.gte(field, constraint.value);
                else if (constraint.opStr === '<') builder = builder.lt(field, constraint.value);
                else if (constraint.opStr === '<=') builder = builder.lte(field, constraint.value);
            } else if (constraint.type === 'orderBy') {
                // Use text cast (->>) for ordering JSON fields so Postgres can compare values
                const orderField = isGeneric || !validCols.includes(constraint.fieldPath)
                    ? `data->>${constraint.fieldPath}`
                    : constraint.fieldPath;
                builder = builder.order(orderField, { ascending: constraint.directionStr === 'asc' });
            } else if (constraint.type === 'limit') {
                builder = builder.limit(constraint.limitAmount);
            }
        }
    }
    const response = await builder;
    if (response.error) {
        console.error(`getDocs error [${table}]:`, response.error);
        return { docs: [], empty: true, size: 0 };
    }
    const items = response.data || [];
    const docs = items.map((item: any) => {
        const docData = isGeneric ? item.data : mapToSupabaseData(item);
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
        data: () => data ? (isGeneric ? mapToSupabaseData(data.data) : mapToSupabaseData(data)) : undefined,
    };
};

function normalizeTimestampsInData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const normalized: any = {};
    for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && typeof (value as any).toDate === 'function') {
            normalized[key] = (value as any).toDate().toISOString();
        } else {
            normalized[key] = value;
        }
    }
    return normalized;
}

export const addDoc = async (collectionRef: any, data: any) => {
    const { table, isGeneric } = getTableConfig(collectionRef.path);
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    if (isGeneric) {
        const normalizedData = normalizeTimestampsInData(data);
        const { error } = await supabase.from(table).insert({ collection_path: collectionRef.path, doc_id: id, data: normalizedData });
        if (error) console.error("addDoc generic err:", error);
    } else {
        const payload = prepareRelationalData(table, data);
        const { error } = await supabase.from(table).insert({ id, ...payload });
        if (error) console.error("addDoc relational err:", error);
    }
    return { id };
};

export const setDoc = async (docRef: any, data: any, options?: { merge: boolean }) => {
    const { table, isGeneric } = getTableConfig(docRef.path);
    if (isGeneric) {
        const existing = await supabase.from(table).select('data').eq('collection_path', docRef.path).eq('doc_id', docRef.id).single();
        const newData = options?.merge && existing.data ? { ...existing.data.data, ...data } : data;
        const { error } = await supabase.from(table).upsert({ collection_path: docRef.path, doc_id: docRef.id, data: newData }, { onConflict: 'collection_path,doc_id' });
        if (error) console.error("setDoc generic err:", error);
    } else {
        let payload = prepareRelationalData(table, data);
        if (options?.merge) {
            const existing = await supabase.from(table).select('data').eq('id', docRef.id).single();
            if (existing.data?.data) {
                payload.data = { ...existing.data.data, ...payload.data };
            }
        }
        const { error } = await supabase.from(table).upsert({ id: docRef.id, ...payload });
        if (error) console.error("setDoc relational err:", error);
    }
};

export const updateDoc = async (docRef: any, data: any) => {
    const { table, isGeneric } = getTableConfig(docRef.path);
    if (isGeneric) {
        const existing = await supabase.from(table).select('data').eq('collection_path', docRef.path).eq('doc_id', docRef.id).single();
        if (existing.data) {
            const newData = { ...existing.data.data, ...data };
            const { error } = await supabase.from(table).update({ data: newData }).eq('collection_path', docRef.path).eq('doc_id', docRef.id);
            if (error) console.error("updateDoc generic err:", error);
        }
    } else {
        const existing = await supabase.from(table).select('data').eq('id', docRef.id).single();
        const payload = prepareRelationalData(table, data);
        if (existing.data?.data) {
            payload.data = { ...existing.data.data, ...payload.data };
        }
        const { error } = await supabase.from(table).update(payload).eq('id', docRef.id);
        if (error) console.error("updateDoc relational err:", error);
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

// Snapshot listener stub — polls once and then sets up a lightweight interval for near-realtime updates
export const onSnapshot = (queryObj: any, callbackOrObj: any, errorCallback?: any) => {
    const callback = typeof callbackOrObj === 'function' ? callbackOrObj : callbackOrObj.next;
    const onError = typeof callbackOrObj === 'function' ? errorCallback : callbackOrObj.error;

    let cancelled = false;

    const fetchAndNotify = async () => {
        try {
            if (queryObj.type === 'doc') {
                const docSnap = await getDoc(queryObj);
                if (!cancelled) callback(docSnap);
            } else {
                const querySnap = await getDocs(queryObj);
                if (!cancelled) callback(querySnap);
            }
        } catch (e) {
            console.error('[onSnapshot] Error fetching data:', e);
            if (onError && !cancelled) onError(e);
        }
    };

    // Fetch immediately
    fetchAndNotify();

    // Poll every 5 seconds to keep data fresh (near-realtime)
    const intervalId = setInterval(fetchAndNotify, 5000);

    return () => {
        cancelled = true;
        clearInterval(intervalId);
    };
};

function mapToSupabaseData(obj: any): any {
    if (!obj) return null;
    let baseObj = { ...obj };

    // Convert root DB string ISO dates back to pseudo-Timestamps
    if (baseObj.createdAt && typeof baseObj.createdAt === 'string') {
        baseObj.createdAt = Timestamp.fromDate(new Date(baseObj.createdAt));
    }
    if (baseObj.lastLogin && typeof baseObj.lastLogin === 'string') {
        baseObj.lastLogin = Timestamp.fromDate(new Date(baseObj.lastLogin));
    }

    if (baseObj.data && typeof baseObj.data === 'object' && !Array.isArray(baseObj.data)) {
        const { data, ...rest } = baseObj;
        return { ...rest, ...data };
    }
    return baseObj;
}
function mapFromSupabaseData(obj: any): any {
    return { ...obj };
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

export const signInWithGoogle = async (redirectTo?: string) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectTo || (window.location.origin + '/dashboard'),
        },
    });
    if (error) throw error;
    return data;
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
    const bucketName = 'files';
    const { data, error } = await supabase.storage.from(bucketName).upload(storageRef.path, file, {
        upsert: true,
        contentType: metadata?.contentType
    });

    if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
    }

    return { ref: storageRef };
};
export const getDownloadURL = async (storageRef: any) => {
    const bucketName = 'files';
    const { data } = supabase.storage.from(bucketName).getPublicUrl(storageRef.path);
    return data.publicUrl;
};

