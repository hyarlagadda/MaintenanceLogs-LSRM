import { createClient } from "@supabase/supabase-js"
import { projectId, publicAnonKey } from "../../utils/supabase/info"

export const supabase = createClient(
  `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || projectId
  }.supabase.co`,
  import.meta.env.VITE_SUPABASE_PUBLIC_ANON_KEY || publicAnonKey,
)
