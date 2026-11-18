export async function POST() {
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": "paisa_auth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" } },
  );
}
