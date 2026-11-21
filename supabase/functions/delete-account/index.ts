import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return json({ error: "server_misconfigured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authHeader.slice("Bearer ".length);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;

  if (userError || !user) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const { data: files } = await admin.storage.from("avatars").list(user.id);
    if (files?.length) {
      await admin.storage
        .from("avatars")
        .remove(files.map((file) => `${user.id}/${file.name}`));
    }
  } catch {
    // Storage cleanup is best effort; account deletion still proceeds.
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("delete-account failed", deleteError.message);
    return json({ error: "delete_failed" }, 500);
  }

  return json({ ok: true });
});
