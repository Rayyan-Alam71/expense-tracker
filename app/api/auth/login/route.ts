import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signJwt, verifyPassword } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  username: z.string().trim().min(1).max(40),
  password: z.string().min(1).max(72),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("Username and password are required", 400);
  try {
    const user = await prisma.user.findUnique({ where: { username: parsed.data.username.toLowerCase() } });
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return errorResponse("Invalid username or password", 401);
    }
    const token = signJwt({ id: user.id, name: user.name, username: user.username });
    return Response.json(
      { token, user: { id: user.id, name: user.name, username: user.username } },
      { headers: { "Set-Cookie": `paisa_auth=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}` } },
    );
  } catch {
    return errorResponse("Unable to sign in right now. Please try again.", 500);
  }
}
