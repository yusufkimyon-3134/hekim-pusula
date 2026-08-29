import "server-only";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export function isAdminUser(user: User | null | undefined): boolean {
  return user?.app_metadata?.role === "admin";
}

export async function getCurrentAdmin(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return isAdminUser(data.user) ? data.user : null;
}
