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

/** 요청 헤더에서 쿠키 한 개 읽기 */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === name) {
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return null;
}

/** 로그인 세션 쿠키에서 이메일 추출 (없으면 null) */
export function getSessionEmail(req: Request): string | null {
  const raw = readCookie(req, "sds_admin");
  if (!raw) return null;
  const email = raw.trim().toLowerCase();
  if (!email || email === "1") return null;
  return email;
}

/**
 * 현재 요청의 관리자 신원을 확인한다.
 * - 마스터: ADMIN_EMAILS에 포함된 이메일
 * - 일반관리자: admins 테이블에서 status === "approved"
 * 둘 다 아니면 null
 */
export async function resolveAdmin(req: Request): Promise<AdminSession | null> {
  const email = getSessionEmail(req);
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
    if (data) {
      return { email, name: (data as any).name || email, role: "admin" };
    }
  } catch {
    // 오류 시 권한 없음 처리
  }
  return null;
}
