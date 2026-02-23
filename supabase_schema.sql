-- ==============================================================================
-- SUPABASE MIGRATION SCHEMA
-- This script prepares your Supabase PostgreSQL database to work with the 
-- frontend's Firebase wrapper logic. 
--
-- We use a hybrid approach: Base tables (users, tenants, customers) are relational
-- while deeply nested Firestore subcollections use a generic JSONB document store 
-- to prevent the need for immediate massive frontend refactoring.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Core Relational Tables
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  uid TEXT, 
  email TEXT,
  role TEXT,
  "tenantId" TEXT,
  "lastLogin" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb -- Optional extra data bucket
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  uid TEXT,
  email TEXT,
  "displayName" TEXT,
  "phoneNumber" TEXT,
  city TEXT,
  "photoURL" TEXT,
  "lastLogin" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  "ownerUid" TEXT,
  name TEXT,
  status TEXT,
  plan TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb
);

-- 3. Generic Document Store (For Firestore Subcollections)
-- This table absorbs any dynamic subcollection path like 'tenants/1234/brand/config'
CREATE TABLE IF NOT EXISTS firestore_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_path TEXT NOT NULL,
  doc_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_path, doc_id)
);

-- Note: We create B-Tree indexes on the collection path and doc ID to speed up queries
CREATE INDEX IF NOT EXISTS idx_firestore_documents_path ON firestore_documents(collection_path);
CREATE INDEX IF NOT EXISTS idx_firestore_documents_doc_id ON firestore_documents(doc_id);

-- 4. Set Up Access Control (RLS)
-- Currently allowing public access to unblock the migration. 
-- You should lock these down based on your authentication needs inside the Supabase dashboard!
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for users" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for customers" ON customers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for tenants" ON tenants FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE firestore_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for firestore_documents" ON firestore_documents FOR ALL USING (true) WITH CHECK (true);

-- 5. Storage Buckets configuration for your images
-- You will need to execute this manually in Supabase SQL editor or via the Dashboard UI 
-- to create the 'files' bucket and give it public access.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Enable public access for files bucket" ON storage.objects
FOR ALL USING (bucket_id = 'files') WITH CHECK (bucket_id = 'files');
