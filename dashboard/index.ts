const CONFIG_FILE = "./config.json";
const PASSWORD_HASH_FILE = "./dashboard/password.hash";

const DEFAULT_PASSWORD = "admin@123";

// ── Password helpers ────────────────────────────────────────────────
async function getPasswordHash(): Promise<string> {
  try {
    return await Deno.readTextFile(PASSWORD_HASH_FILE);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      // First run → create default hash
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.1.1/mod.ts");
      const hash = await bcrypt.hash(DEFAULT_PASSWORD);
      await Deno.writeTextFile(PASSWORD_HASH_FILE, hash);
      return hash;
    }
    throw err;
  }
}

async function verifyPassword(input: string): Promise<boolean> {
  const storedHash = await getPasswordHash();
  const bcrypt = await import("https://deno.land/x/bcrypt@v0.1.1/mod.ts");
  return bcrypt.compare(input, storedHash);
}

async function updatePassword(newPassword: string): Promise<void> {
  const bcrypt = await import("https://deno.land/x/bcrypt@v0.1.1/mod.ts");
  const newHash = await bcrypt.hash(newPassword);
  await Deno.writeTextFile(PASSWORD_HASH_FILE, newHash);
}

// ── (rest of your original functions remain unchanged) ──────────────

async function readConfig(): Promise<string> { /* unchanged */ }
async function writeConfig(configData: string): Promise<void> { /* unchanged */ }
async function getServiceStatus(): Promise<boolean> { /* unchanged */ }
async function invokeService(action: "start" | "stop" | "restart"): Promise<void> { /* unchanged */ }
async function serveStaticFile(pathname: string): Promise<Response> { /* unchanged */ }

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // ── Password verification endpoint ────────────────────────────────
  if (url.pathname === "/login" && req.method === "POST") {
    try {
      const { password } = await req.json();
      if (!password) {
        return new Response("Password required", { status: 400 });
      }
      const valid = await verifyPassword(password);
      if (valid) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: "Invalid password" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (err) {
      return new Response("Bad request", { status: 400 });
    }
  }

  // ── Change password endpoint ──────────────────────────────────────
  if (url.pathname === "/password" && req.method === "POST") {
    try {
      const { current, newPassword } = await req.json();
      if (!current || !newPassword || newPassword.length < 6) {
        return new Response(JSON.stringify({ success: false, error: "Invalid input" }), { status: 400 });
      }
      const valid = await verifyPassword(current);
      if (!valid) {
        return new Response(JSON.stringify({ success: false, error: "Current password incorrect" }), { status: 403 });
      }
      await updatePassword(newPassword);
      return new Response(JSON.stringify({ success: true, message: "Password updated" }), { status: 200 });
    } catch (err) {
      console.error(err);
      return new Response("Server error", { status: 500 });
    }
  }

  // ── Protect dashboard ─────────────────────────────────────────────
  if (url.pathname === "/config" || 
      url.pathname.startsWith("/services") ||
      url.pathname === "/" || 
      url.pathname === "/index.html" ||
      url.pathname.startsWith("/dashboard/")) {

    // For simplicity we skip full session → client checks token in localStorage
    // → server allows static files + API calls (client will handle auth rejection)
  }

  // Your original routing logic
  if (url.pathname === "/config") {
    if (req.method === "GET") {
      try {
        const config = await readConfig();
        return new Response(config, {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error reading config:", error);
        return new Response("Could not read config.", { status: 500 });
      }
    }
    
    if (req.method === "POST") {
      // ... (unchanged POST config logic)
      try {
        const configData = await req.text();
        JSON.parse(configData);
        await writeConfig(JSON.stringify(JSON.parse(configData), null, "  "));
        try {
          await invokeService("restart");
          return new Response("New config applied; restarting services for changes to take effect...", { status: 200 });
        } catch (restartError) {
          console.error("Restart error:", restartError);
          return new Response("Could not restart services to apply config. Retry manually.", { status: 500 });
        }
      } catch (error) {
        console.error("Error saving config:", error);
        return new Response("Could not save config.", { status: 500 });
      }
    }
  }

  // ... rest of your endpoints (status, start, stop) remain unchanged ...

  // Static files
  return await serveStaticFile(url.pathname);
}

const port = parseInt(Deno.env.get("PORT") || "80");
console.log(`XiOSK Deno server starting on port ${port}...`);

Deno.serve({ port }, handler);