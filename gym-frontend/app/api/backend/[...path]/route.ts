import { auth } from "@/auth";

async function handler(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  const token = (session as any)?.accessToken;
  if (!token) {
    return new Response(JSON.stringify({ message: "Not signed in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { path } = await ctx.params;
  const url = new URL(req.url);
  const target = `${process.env.API_URL}/${path.join("/")}${url.search}`;
  const hasBody = !["GET", "HEAD"].includes(req.method);

  try {
    const res = await fetch(target, {
      method: req.method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ message: "Cannot reach the backend (is it running on port 4000?)" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export { handler as GET, handler as POST, handler as PATCH };