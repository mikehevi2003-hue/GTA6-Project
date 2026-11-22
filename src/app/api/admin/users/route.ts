import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  loadAdminUsersV2,
  requireAdminUser
} from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    const rl = checkRateLimit(`admin-users:${user.id}`, 120, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many user search requests; please wait a moment.");
    }

    const query = sanitizePlainText(request.nextUrl.searchParams.get("q") ?? "", 100);
    const users = await loadAdminUsersV2(supabase, query);

    return apiJson({ users });
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "42501") {
      return apiError("FORBIDDEN", 403, "Admin privileges required.");
    }
    return apiError(
      "ADMIN_USERS_SEARCH_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to search users"
    );
  }
}
