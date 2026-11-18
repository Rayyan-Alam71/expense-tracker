import { errorMessage, errorResponse } from "@/lib/api";
import { getReport } from "@/lib/queries";
import { isValidYear } from "@/lib/validators";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  const session = getAuthenticatedUser(request);
  if (!session) return errorResponse("Please sign in", 401);
  const year = new URL(request.url).searchParams.get("year");
  const house = new URL(request.url).searchParams.get("house");
  if (!year || !isValidYear(year)) return errorResponse("Year must use YYYY", 400);
  if (house && house !== "RAYYAN" && house !== "HAMID" && house !== "SHARED") {
    return errorResponse("Invalid house filter", 400);
  }
  try {
    return Response.json(await getReport(year, session.id, house as "RAYYAN" | "HAMID" | "SHARED" | undefined));
  } catch (error) {
    return errorResponse(errorMessage(error), 500);
  }
}
