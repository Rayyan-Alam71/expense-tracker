import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, signJwt } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens"),
  password: z.string().min(8).max(72),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? "Please check your registration details", 400);
  try {
    const username = parsed.data.username.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return errorResponse("This username is already registered", 409);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        username,
        passwordHash: hashPassword(parsed.data.password),
      },
    });
    const token = signJwt({ id: user.id, name: user.name, username: user.username });
    return Response.json(
      { token, user: { id: user.id, name: user.name, username: user.username } },
      { headers: { "Set-Cookie": `paisa_auth=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}` } },
    );
  } catch (error) {
    console.error("Registration failed:", error instanceof Error ? error.message : "Unknown error");
    return errorResponse("Unable to register right now. Please try again.", 500);
  }
}
