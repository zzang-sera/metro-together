// src/config/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) console.warn("⚠️ Missing EXPO_PUBLIC_SUPABASE_URL in .env");
if (!SUPABASE_ANON_KEY) console.warn("⚠️ Missing EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
