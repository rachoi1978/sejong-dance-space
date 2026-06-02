import { getSupabase } from "./supabase";

/** 승인 기록(감사 로그)을 sds_logs에 한 줄 남긴다. 실패해도 본 동작은 막지 않는다. */
export async function logAction(
  actorEmail: string,
  actorName: string,
  action: string,
  target: string
) {
  try {
    const sb = getSupabase();
    await sb.from("sds_logs").insert({
      actor_email: actorEmail,
      actor_name: actorName,
      action,
      target,
    });
  } catch {
    // 로깅 실패는 무시
  }
}
