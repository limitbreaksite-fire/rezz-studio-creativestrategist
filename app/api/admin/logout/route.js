import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";
import { json } from "@/lib/api-helpers";

export async function POST() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return json({ ok: true });
}
