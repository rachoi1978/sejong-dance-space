import { cookies } from "next/headers";
import { getSupabase } from "./supabase";

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

/** 로그인 세션 쿠키(sds_admin)에서 이메일을 읽는다. (Next 표준 cookies() 사용) */
export async function getSessionEmail(): Promise<string | null> {
  try {
    const store = await cookies();
    const raw = store.get("sds_admin")?.value;
    if (!raw) return null;
    let email = raw;
    try { email = decodeURIComponent(raw); } catch {}
    email = email.trim().toLowerCase();
    if (!email || email === "1") return null;
    return email;
  } catch {
    return null;
  }
}

/**
 * 현재 요청의 관리자 신원 확인.
 * - 마스터: ADMIN_EMAILS 포함 이메일
 * - 일반관리자: sds_admins 에서 status === "approved"
 * (req 인자는 호환용이며 사용하지 않는다)
 */
export async function resolveAdmin(_req?: Request): Promise<AdminSession | null> {
  const email = await getSessionEmail();
  if (!email) return null;

  if (isMaster(email)) {
    return { email, name: email, role: "master" };
  }

  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("sds_admins")
      .select("email,name,status")
      .eq("email", email)
      .eq("status", "approved")
      .maybeSingle();
    if (data) return { email, name: (data as any).name || email, role: "admin" };
  } catch {
    // 권한 없음 처리
  }
  return null;
}
