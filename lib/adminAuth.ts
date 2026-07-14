import { getSupabase } from "./supabase";
import { getVerifiedEmail } from "./supabaseAuth";

export type AdminSession = {
  email: string;
  name: string;
  role: "master" | "admin";
};

/** ADMIN_EMAILS 환경변수에 등록된 마스터 이메일 목록(소문자) */
export function getMasterEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isMaster(email: string): boolean {
  return getMasterEmails().includes(String(email).trim().toLowerCase());
}

/**
 * 관리자 신원 확인.
 * 1) 구글 로그인으로 검증된 이메일을 가져오고(위조 불가)
 * 2) 마스터거나, sds_admins에서 승인된(approved) 관리자여야 통과.
 */
export async function resolveAdmin(): Promise<AdminSession | null> {
  const v = await getVerifiedEmail();
  if (!v) return null;

  if (isMaster(v.email)) {
    return { email: v.email, name: v.name || v.email, role: "master" };
  }

  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("sds_admins")
      .select("email,name,status")
      .eq("email", v.email)
      .eq("status", "approved")
      .maybeSingle();
    if (data) {
      return { email: v.email, name: (data as any).name || v.name, role: "admin" };
    }
  } catch {
    // 권한 없음
  }
  return null;
}
