import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support multiple env var names used in this repo and local setups
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY;

function makeMissingEnvError() {
  return new Error(
    'Missing Supabase URL or Service Key in environment variables. Expected one of: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL, and one of SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY, or SUPABASE_ANON_KEY.',
  );
}

// If env vars are present, create the real client. Otherwise export a lazy proxy
// that throws a descriptive error when any property is accessed. This prevents
// crashing at module import time while still surfacing a clear runtime error
// if code attempts to use the client without configuration.
let supabaseClient: SupabaseClient;

if (supabaseUrl && supabaseKey) {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
} else {
  type EmptyRecord = Record<string, never>;
  const handler: ProxyHandler<EmptyRecord> = {
    get() {
      throw makeMissingEnvError();
    },
    apply() {
      throw makeMissingEnvError();
    },
    construct() {
      throw makeMissingEnvError();
    },
  };
  supabaseClient = new Proxy<EmptyRecord>(
    {},
    handler,
  ) as unknown as SupabaseClient;
}

export const supabase = supabaseClient;
