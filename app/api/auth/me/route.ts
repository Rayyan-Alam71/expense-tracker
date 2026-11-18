import { prisma } from "@/lib/prisma";
import { tokenFromRequest, verifyJwt } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(request: Request) {
  const token = tokenFromRequest(request);
  const session = token ? verifyJwt(token) : null;
  if (!session) return errorResponse("Please sign in", 401);
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, username: true },
    });
    if (!user) return errorResponse("Please sign in", 401);
    return Response.json({ user });
  } catch {
    return errorResponse("Unable to verify your session", 500);
  }
}
