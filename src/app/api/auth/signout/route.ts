import { apiError, apiJson, createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return apiError("SIGNOUT_FAILED", 500, error.message);
    }
    return apiJson({ ok: true });
  } catch (err) {
    return apiError(
      "SIGNOUT_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to sign out"
    );
  }
}
