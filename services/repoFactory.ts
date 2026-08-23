import { IncidentsRepo } from '../types';
import { InMemoryRepo } from './InMemoryRepo';

// Declare require to avoid TypeScript errors when @types/node is not available
declare const require: any;

/**
 * Repository Factory - Automatically selects the best storage backend
 *
 * Priority order:
 * 1. Supabase (if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set)
 * 2. Google Sheets (if GOOGLE_SHEETS_* env vars are set) - Server-side only
 * 3. InMemory/localStorage (default fallback)
 *
 * For users who want to use their own backend:
 * - Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
 * - Run the SQL schema in /database/supabase-schema.sql
 */
export function createIncidentsRepo(): IncidentsRepo {
  // Option 1: Check for Supabase configuration (works in browser)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const { SupabaseRepo } = require('./SupabaseRepo');
      console.log('✅ Using Supabase backend');
      return new SupabaseRepo(supabaseUrl, supabaseKey);
    } catch (error) {
      console.warn('⚠️ Failed to load SupabaseRepo. Install @supabase/supabase-js. Falling back to InMemory.', error);
    }
  }

  // Option 2: Check for Google Sheets configuration (server-side only)
  const hasGoogleSheetsEnv =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (hasGoogleSheetsEnv) {
    try {
      const { GoogleSheetsRepo } = require('./GoogleSheetsRepo');
      console.log('✅ Using Google Sheets backend');
      return new GoogleSheetsRepo(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
        process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!,
        process.env.GOOGLE_SHEETS_SPREADSHEET_ID!
      );
    } catch (error) {
      console.warn('⚠️ Failed to load GoogleSheetsRepo. Falling back to InMemory.', error);
    }
  }

  // Option 3: Default fallback - localStorage (works everywhere)
  console.log('📦 Using localStorage backend (no cloud config detected)');
  return new InMemoryRepo();
}