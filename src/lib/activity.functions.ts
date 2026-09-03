import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ActivityRow = {
  id: string;
  feature: string;
  title: string;
  preview: string | null;
  created_at: string;
};

const LogInput = z.object({
  feature: z.enum(["email", "meeting", "planner", "research", "chat"]),
  title: z.string().trim().min(1).max(160),
  preview: z.string().trim().max(400).optional(),
});

export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => LogInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase.from("activities").insert({
      user_id: context.userId,
      feature: data.feature,
      title: data.title,
      preview: data.preview ?? null,
    });
    if (error) throw new Error("Could not save this to your activity history.");
    return { ok: true };
  });

export const listActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ActivityRow[]> => {
    const { data, error } = await context.supabase
      .from("activities")
      .select("id, feature, title, preview, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error("Could not load your activity history.");
    return (data ?? []) as ActivityRow[];
  });

export const clearActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("activities")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw new Error("Could not clear your activity history.");
    return { ok: true };
  });

const ProfileInput = z.object({
  full_name: z.string().trim().max(120).optional(),
  job_title: z.string().trim().max(120).optional(),
  organisation: z.string().trim().max(160).optional(),
});

export type ProfileRow = {
  id: string;
  full_name: string | null;
  job_title: string | null;
  organisation: string | null;
};

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileRow | null> => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, job_title, organisation")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Could not load your profile.");
    return (data as ProfileRow) ?? null;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ProfileInput.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data }, { onConflict: "id" });
    if (error) throw new Error("Could not save your profile.");
    return { ok: true };
  });
