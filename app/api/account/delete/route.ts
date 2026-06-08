import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseAuthClient,
  hasSupabaseAdminAccess,
} from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  if (!hasSupabaseAdminAccess()) {
    return NextResponse.json(
      {
        ok: false,
        reason: "not_configured",
        message:
          "Automated account deletion is not configured yet. Add SUPABASE_SERVICE_ROLE_KEY to enable it.",
      },
      { status: 501 }
    );
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, reason: "missing_token", message: "Missing access token." },
      { status: 401 }
    );
  }

  try {
    const authClient = createSupabaseAuthClient(accessToken);
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, reason: "unauthorized", message: "Unable to verify signed-in user." },
        { status: 401 }
      );
    }

    const admin = createSupabaseAdminClient();

    await Promise.all([
      admin.from("workouts").delete().eq("user_id", user.id),
      admin.from("streaks").delete().eq("id", user.id),
      admin.from("user_settings").delete().eq("id", user.id),
    ]);

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      return NextResponse.json(
        {
          ok: false,
          reason: "delete_failed",
          message: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: "unexpected",
        message: error instanceof Error ? error.message : "Unexpected error.",
      },
      { status: 500 }
    );
  }
}
