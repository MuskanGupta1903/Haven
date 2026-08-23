-- CrisisKit Lite - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Incident responses table
CREATE TABLE IF NOT EXISTS incident_responses (
  id UUID PRIMARY KEY,
  "incidentId" UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  needs TEXT NOT NULL,
  location TEXT NOT NULL,
  "submittedAt" BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  "assignedTo" TEXT,
  notes TEXT,
  "resolvedAt" BIGINT,
  "aiClassification" JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_incident_responses_incident_id
  ON incident_responses("incidentId");

CREATE INDEX IF NOT EXISTS idx_incident_responses_submitted_at
  ON incident_responses("submittedAt");

CREATE INDEX IF NOT EXISTS idx_incident_responses_status
  ON incident_responses(status);

-- Row Level Security (RLS) Policies
-- Note: Adjust these policies based on your security requirements

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_responses ENABLE ROW LEVEL SECURITY;

-- Public read access for incidents
CREATE POLICY "Public incidents are viewable by everyone"
  ON incidents FOR SELECT
  USING (true);

-- Anyone can create incidents (for demo purposes)
-- In production, you might want to require authentication
CREATE POLICY "Anyone can create incidents"
  ON incidents FOR INSERT
  WITH CHECK (true);

-- Public read access for responses
CREATE POLICY "Public responses are viewable by everyone"
  ON incident_responses FOR SELECT
  USING (true);

-- Anyone can submit responses
CREATE POLICY "Anyone can submit responses"
  ON incident_responses FOR INSERT
  WITH CHECK (true);

-- Anyone can update responses (for status changes, AI classification)
-- In production, you might want to restrict this
CREATE POLICY "Anyone can update responses"
  ON incident_responses FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Optional: Add authentication later
-- For production use, uncomment these and remove the "Anyone" policies above:
/*
-- Only authenticated users can create incidents
CREATE POLICY "Authenticated users can create incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update responses
CREATE POLICY "Authenticated users can update responses"
  ON incident_responses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
*/
