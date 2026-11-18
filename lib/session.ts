import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("paisa_auth")?.value;
  return token ? verifyJwt(token) : null;
}
