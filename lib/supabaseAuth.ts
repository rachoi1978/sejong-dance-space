import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버에서 로그인 사용자(구글 인증)를 확인하기 위한 Supabase 클라이언트.
 * 공개(publishable/anon) 키를 쓰지만, 신원 확인은 getUser()로 Supabase 인증서버에
 * 직접 검증하므로 위조가 불가능하다.
 */
export async function createAuthClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시 (미들웨어/라우트에서 갱신됨)
          }
        },
      },
    }
  );
}

/** 구글로 인증된 사용자의 이메일 (없으면 null). 서버에서 검증됨. */
export async function getVerifiedEmail(): Promise<{ email: string; name: string } | null> {
  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.email) return null;
    const email = data.user.email.trim().toLowerCase();
    const name =
      (data.user.user_metadata?.full_name as string) ||
      (data.user.user_metadata?.name as string) ||
      email;
    return { email, name };
  } catch {
    return null;
  }
}
