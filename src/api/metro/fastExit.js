import { supabase } from '../../lib/supabaseClient';

export async function getFastExitInfo(start, end) {
  try {
    const { data, error } = await supabase.functions.invoke('fast-exit', {
      body: { start, end },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching fast exit info:', err);
    return null;
  }
}
