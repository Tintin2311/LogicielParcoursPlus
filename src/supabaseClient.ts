// supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ⚠️ Idéalement, mets ces valeurs dans des variables d'env Vite
// VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://aswhubzprehjnunbpkwc.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzd2h1YnpwcmVoam51bmJwa3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDg5ODcsImV4cCI6MjA2NzU4NDk4N30.rNsW9i0jxtOxHYsoagVXjqz_yMHmVmKumf8c8LKuB0Q";

// Sécurise l'accès à localStorage (utile si rendu côté serveur ou tests)
const safeStorage =
  typeof window !== "undefined" && "localStorage" in window
    ? window.localStorage
    : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "sb-parcoursplus-auth-token", // clé stable 🔒
    storage: safeStorage, // <-- crucial pour survivre au F5
  },
});
