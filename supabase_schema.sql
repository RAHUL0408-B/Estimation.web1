-- ============================================================
-- Estimation.web — Supabase Schema
-- Run this in Supabase SQL Editor to create all required tables
-- ============================================================

-- ── Tenants ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
    id          TEXT PRIMARY KEY DEFAULT (
                    substring(md5(random()::text || clock_timestamp()::text), 1, 20)
                ),
    "ownerUid"  TEXT,
    name        TEXT,
    email       TEXT UNIQUE,
    status      TEXT DEFAULT 'active',
    plan        TEXT DEFAULT 'free',
    data        JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id          TEXT PRIMARY KEY DEFAULT (
                    substring(md5(random()::text || clock_timestamp()::text), 1, 20)
                ),
    uid         TEXT UNIQUE,
    email       TEXT UNIQUE,
    role        TEXT DEFAULT 'admin',
    "tenantId"  TEXT,
    data        JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "lastLogin" TIMESTAMPTZ DEFAULT NOW()
);

-- ── Generic Firestore-like documents (sub-collections) ───────
-- Used for: tenants/{tenantId}/employees, tenants/{tenantId}/orders, etc.
CREATE TABLE IF NOT EXISTS public.firestore_documents (
    id              BIGSERIAL PRIMARY KEY,
    collection_path TEXT NOT NULL,
    doc_id          TEXT NOT NULL,
    data            JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_collection_doc UNIQUE (collection_path, doc_id)
);

-- Index for fast lookups by collection path
CREATE INDEX IF NOT EXISTS idx_firestore_docs_collection_path
    ON public.firestore_documents (collection_path);

-- Index for ordering by JSON createdAt field (stored as ISO string)
CREATE INDEX IF NOT EXISTS idx_firestore_docs_created_at
    ON public.firestore_documents ((data->>'createdAt'));

-- ── Row Level Security (RLS) ─────────────────────────────────
-- Disable RLS for now (enable & tune per-table once auth is fully wired)
ALTER TABLE public.tenants               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.firestore_documents   DISABLE ROW LEVEL SECURITY;
