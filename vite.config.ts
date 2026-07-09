/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import https from "https";
import type { IncomingHttpHeaders } from "http";
import fs from "fs";
import { spawn } from "child_process";

// ─── RTC Proxy Plugin ────────────────────────────────────────────────────────

const RTC_HOST = "clm.unj.softplan.com.br";
const PROJECT_AREA = "_25vu8GmlEei_JYusy-lmWQ";
// Jazz EWM returns dcterms:type as a plain display-name string (not a URI)
const DEFECT_TYPE_NAMES = ["Defeito", "Defeito Cliente"];

function nodeHttps(
  options: https.RequestOptions,
  body?: string
): Promise<{ status: number; headers: IncomingHttpHeaders; text: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...options, rejectUnauthorized: false }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("error", reject);
      res.on("end", () =>
        resolve({ status: res.statusCode ?? 0, headers: res.headers, text: Buffer.concat(chunks).toString("utf-8") })
      );
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function mergeCookies(existing: string, newSet: string | string[] | undefined): string {
  if (!newSet) return existing;
  const list = Array.isArray(newSet) ? newSet : [newSet];
  let result = existing;
  for (const c of list) {
    const kv = c.split(";")[0];
    const key = kv.split("=")[0];
    if (!result.includes(key + "=")) {
      result = result ? result + "; " + kv : kv;
    }
  }
  return result;
}

// HTTP request that follows redirects and accumulates cookies.
// Preserves Accept and custom headers across redirects.
async function nodeHttpsFollow(
  options: https.RequestOptions,
  body?: string,
  accCookie = "",
  maxRedirects = 8
): Promise<{ status: number; headers: IncomingHttpHeaders; text: string; cookie: string }> {
  let cookie = accCookie;
  let currentOpts = options;
  let currentBody = body;

  // Headers to keep on every redirect hop
  const origHeaders = (options.headers ?? {}) as Record<string, string>;
  const persistHeaders: Record<string, string> = {};
  for (const k of ["Accept", "OSLC-Core-Version"]) {
    if (origHeaders[k]) persistHeaders[k] = origHeaders[k];
  }

  for (let i = 0; i < maxRedirects; i++) {
    let res: { status: number; headers: IncomingHttpHeaders; text: string };
    for (let attempt = 1; ; attempt++) {
      try {
        res = await nodeHttps(currentOpts, currentBody);
        break;
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if ((code === "ECONNRESET" || code === "EPIPE") && attempt < 3) {
          const delay = attempt * 1500;
          console.log(`[rtc-proxy]   ECONNRESET (tentativa ${attempt}/3), aguardando ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }
    cookie = mergeCookies(cookie, res!.headers["set-cookie"]);
    console.log(`[rtc-proxy]   follow: ${currentOpts.method} ${currentOpts.path} → ${res!.status}`);

    if (res!.status >= 300 && res!.status < 400 && res!.headers.location) {
      const loc = res!.headers.location as string;
      let p: string;
      try { const u = new URL(loc); p = u.pathname + u.search; }
      catch { p = loc; }
      currentOpts = {
        hostname: RTC_HOST, path: p, method: "GET",
        headers: { Cookie: cookie, ...persistHeaders },
        rejectUnauthorized: false,
      };
      currentBody = undefined;
    } else {
      return { ...res!, cookie };
    }
  }
  throw new Error("Max redirects exceeded");
}

let sessionCookie = "";
let sessionExpiry = 0;

async function ensureRtcSession(user: string, pass: string): Promise<string> {
  if (sessionCookie && Date.now() < sessionExpiry) return sessionCookie;

  // Step 1: POST login, follow all redirects
  const loginBody = `j_username=${encodeURIComponent(user)}&j_password=${encodeURIComponent(pass)}`;
  const r1 = await nodeHttpsFollow(
    {
      hostname: RTC_HOST,
      path: "/ccm/j_security_check",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(loginBody),
      },
      rejectUnauthorized: false,
    },
    loginBody
  );

  // Step 2: GET /ccm/web to ensure session is established
  const r2 = await nodeHttpsFollow(
    { hostname: RTC_HOST, path: "/ccm/web", method: "GET", headers: { Cookie: r1.cookie }, rejectUnauthorized: false },
    undefined,
    r1.cookie
  );

  console.log(`[rtc-proxy] Session cookie length: ${r2.cookie.length}`);
  sessionCookie = r2.cookie;
  sessionExpiry = Date.now() + 18 * 60 * 1000;
  return sessionCookie;
}

async function countDevDefects(
  initialCookie: string,
  userId: string,
  startDate: Date,
  endDate: Date,
  creds: { user: string; pass: string }
): Promise<{ count: number; items: Array<{ id: string; created: string; resolutionDate?: string; type: string; versaoOrigem?: string }> }> {
  const items: Array<{ id: string; created: string; resolutionDate?: string; type: string; versaoOrigem?: string }> = [];
  const baseParams = new URLSearchParams({
    "oslc.where": `dcterms:contributor{foaf:userId="${userId}"}`,
    "oslc.properties": "dcterms:identifier,dcterms:created,oslc_cm:closeDate,dcterms:type,oslc_cm:status,rtc_ext:com.softplan.safe.attribute.defect.versaodeorigem",
    "oslc.pageSize": "50",
  });
  const firstUrl = () => `https://${RTC_HOST}/ccm/oslc/contexts/${PROJECT_AREA}/workitems?${baseParams}`;

  let cookie = initialCookie;
  let nextUrl: string | null = firstUrl();
  let page = 0;
  let sessionRetries = 0;

  while (nextUrl && page < 60) {
    page++;
    const parsedUrl = new URL(nextUrl);
    const res = await nodeHttpsFollow(
      {
        hostname: RTC_HOST,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        headers: { Cookie: cookie, Accept: "application/json", "OSLC-Core-Version": "2.0" },
        rejectUnauthorized: false,
      },
      undefined,
      cookie
    );

    console.log(`[rtc-proxy]   ${userId} p${page}: HTTP ${res.status}, body=${res.text.length}b`);

    // Session/token expired — re-authenticate and restart this developer's query
    if ((res.status === 401 || (res.status === 500 && res.text.includes("expired"))) && sessionRetries < 2) {
      sessionRetries++;
      console.log(`[rtc-proxy]   ${userId}: sessão expirada, re-autenticando (tentativa ${sessionRetries})...`);
      sessionExpiry = 0; // invalida cache para forçar nova autenticação
      cookie = await ensureRtcSession(creds.user, creds.pass);
      items.length = 0;
      nextUrl = firstUrl();
      page = 0;
      continue;
    }

    if (res.status !== 200) {
      console.log(`[rtc-proxy]   ${userId} error body:`, res.text.slice(0, 300));
      break;
    }

    let data: Record<string, unknown>;
    try { data = JSON.parse(res.text); } catch { break; }

    // Jazz EWM uses 'oslc:results'; standard OSLC uses 'rdfs:member'
    const members = (data["oslc:results"] as unknown[]) ?? (data["rdfs:member"] as unknown[]) ?? [];
    const respInfo = data["oslc:responseInfo"] as Record<string, unknown> | undefined;
    const totalCount = respInfo?.["oslc:totalCount"];
    console.log(`[rtc-proxy]   ${userId} p${page}: totalCount=${totalCount}, results=${members.length}`);

    if (page === 1 && members.length > 0) {
      const first = members[0] as Record<string, unknown>;
      console.log(`[rtc-proxy]   ${userId} first item:`, JSON.stringify(first).slice(0, 300));
    }

    let skippedDate = 0, skippedType = 0;
    for (const raw of members) {
      const item = raw as Record<string, unknown>;
      const createdStr = item["dcterms:created"] as string;
      if (!createdStr) continue;
      const created = new Date(createdStr);
      if (created < startDate || created >= endDate) { skippedDate++; continue; }

      // Filter by state — oslc_cm:status is a plain string ("Inválido", "Pronto", etc.)
      const statusStr = item["oslc_cm:status"] as string | undefined;
      if (statusStr === "Inválido") { skippedType++; continue; }

      // dcterms:type is a plain display-name string in Jazz EWM ("Defeito", "Task", etc.)
      const typeStr = (item["dcterms:type"] as string) ?? "";
      if (!DEFECT_TYPE_NAMES.includes(typeStr)) { skippedType++; continue; }

      // oslc_cm:closeDate is the actual resolution/close date (rtc_cm:resolutionDate does not exist in Jazz EWM)
      const resolutionDate = item["oslc_cm:closeDate"] as string | undefined;
      const versaoOrigem = item["rtc_ext:com.softplan.safe.attribute.defect.versaodeorigem"] as string | undefined;
      items.push({
        id: String(item["dcterms:identifier"] ?? ""),
        created: createdStr,
        resolutionDate,
        type: typeStr,
        versaoOrigem,
      });
    }
    console.log(`[rtc-proxy]   ${userId} p${page}: matched=${items.length}, skippedDate=${skippedDate}, skippedType=${skippedType}`);

    // oslc:nextPage is a plain URL string in Jazz EWM responses
    nextUrl = (respInfo?.["oslc:nextPage"] as string | undefined) ?? null;
  }

  return { count: items.length, items };
}

const RECORRENCIA_PROPS = [
  "dcterms:identifier", "dcterms:title", "dcterms:created", "oslc_cm:closeDate",
  "dcterms:type", "oslc_cm:status",
  "rtc_ext:com.softplan.safe.attribute.defect.versaodeorigem",
  "rtc_ext:com.oneforce.safe.attribute.incidente.causa",
  "rtc_ext:com.oneforce.safe.attribute.incidente.solucao",
  "rtc_ext:com.softplan.unj.attribute.funcionalidadeencontrada",
].join(",");

type DefeitoEnriquecido = {
  id: string; title: string; created: string; resolutionDate?: string;
  type: string; versaoOrigem?: string; causa: string; solucao: string; funcionalidade: string;
};

async function fetchDevDefectsEnriched(
  initialCookie: string,
  userId: string,
  startDate: Date,
  endDate: Date,
  creds: { user: string; pass: string }
): Promise<DefeitoEnriquecido[]> {
  const items: DefeitoEnriquecido[] = [];
  const baseParams = new URLSearchParams({
    "oslc.where": `dcterms:contributor{foaf:userId="${userId}"}`,
    "oslc.properties": RECORRENCIA_PROPS,
    "oslc.pageSize": "50",
  });
  const firstUrl = () => `https://${RTC_HOST}/ccm/oslc/contexts/${PROJECT_AREA}/workitems?${baseParams}`;

  let cookie = initialCookie;
  let nextUrl: string | null = firstUrl();
  let page = 0;
  let sessionRetries = 0;

  while (nextUrl && page < 60) {
    page++;
    const parsedUrl = new URL(nextUrl);
    const res = await nodeHttpsFollow(
      {
        hostname: RTC_HOST,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        headers: { Cookie: cookie, Accept: "application/json", "OSLC-Core-Version": "2.0" },
        rejectUnauthorized: false,
      },
      undefined,
      cookie
    );

    if ((res.status === 401 || (res.status === 500 && res.text.includes("expired"))) && sessionRetries < 2) {
      sessionRetries++;
      sessionExpiry = 0;
      cookie = await ensureRtcSession(creds.user, creds.pass);
      items.length = 0;
      nextUrl = firstUrl();
      page = 0;
      continue;
    }
    if (res.status !== 200) break;

    let data: Record<string, unknown>;
    try { data = JSON.parse(res.text); } catch { break; }

    const members = (data["oslc:results"] as unknown[]) ?? (data["rdfs:member"] as unknown[]) ?? [];
    const respInfo = data["oslc:responseInfo"] as Record<string, unknown> | undefined;

    for (const raw of members) {
      const item = raw as Record<string, unknown>;
      const createdStr = item["dcterms:created"] as string;
      if (!createdStr) continue;
      const created = new Date(createdStr);
      if (created < startDate || created >= endDate) continue;

      const statusStr = item["oslc_cm:status"] as string | undefined;
      if (statusStr === "Inválido") continue;

      const typeStr = (item["dcterms:type"] as string) ?? "";
      if (!DEFECT_TYPE_NAMES.includes(typeStr)) continue;

      items.push({
        id: String(item["dcterms:identifier"] ?? ""),
        title: (item["dcterms:title"] as string) ?? "",
        created: createdStr,
        resolutionDate: item["oslc_cm:closeDate"] as string | undefined,
        type: typeStr,
        versaoOrigem: item["rtc_ext:com.softplan.safe.attribute.defect.versaodeorigem"] as string | undefined,
        causa: (item["rtc_ext:com.oneforce.safe.attribute.incidente.causa"] as string) ?? "",
        solucao: (item["rtc_ext:com.oneforce.safe.attribute.incidente.solucao"] as string) ?? "",
        funcionalidade: (item["rtc_ext:com.softplan.unj.attribute.funcionalidadeencontrada"] as string) ?? "",
      });
    }

    nextUrl = (respInfo?.["oslc:nextPage"] as string | undefined) ?? null;
  }

  return items;
}

function callClaudeViaCli(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("claude", ["-p"], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const settle = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(stdout.trim());
    };

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      settle(new Error("claude CLI timeout (120s)"));
    }, 120_000);

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("error", (err: Error) => settle(err));
    proc.on("close", (code: number | null) => {
      if (code === 0) settle();
      else settle(new Error(`claude CLI erro (código ${code}): ${stderr.slice(0, 300)}`));
    });

    proc.stdin.write(prompt, "utf-8");
    proc.stdin.end();
  });
}

function sanitizeJsonString(str: string): string {
  let result = '';
  let inStr = false;
  let escaped = false;
  for (const ch of str) {
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === '\\' && inStr) { result += ch; escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; result += ch; continue; }
    if (inStr && ch.charCodeAt(0) < 0x20) {
      if (ch === '\n') result += '\\n';
      else if (ch === '\r') result += '\\r';
      else if (ch === '\t') result += '\\t';
      continue;
    }
    result += ch;
  }
  return result;
}

function safeParseJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { /* */ }
  try { return JSON.parse(sanitizeJsonString(match[0])); } catch { /* */ }
  return null;
}

function readKeyFromDotEnv(keyName: string): string {
  try {
    const content = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf-8");
    const match = content.match(new RegExp(`^${keyName}=["']?([^"'\\r\\n]+)["']?`, "m"));
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

function callClaude(key: string, body: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.anthropic.com",
      port: 443,
      path: "/v1/messages",
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body, "utf-8"),
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString("utf-8") }));
      res.on("error", reject);
    });
    req.setTimeout(90_000, () => {
      req.destroy(new Error("Anthropic API timeout (90s) — verifique se a rede permite acesso a api.anthropic.com"));
    });
    req.on("error", (err) => {
      console.error("[claude-proxy] Erro na conexão com api.anthropic.com:", err.message);
      reject(new Error(`Falha ao conectar em api.anthropic.com: ${err.message}. Verifique se o firewall permite a conexão.`));
    });
    req.write(body, "utf-8");
    req.end();
  });
}

function readBody(req: { on: (e: string, cb: (c: Buffer | string) => void) => void }): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer | string) => { body += chunk.toString(); });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const CARD_PROPS = [
  "dcterms:identifier", "dcterms:title", "dcterms:description",
  "dcterms:created", "oslc_cm:closeDate", "oslc_cm:status",
  "rtc_ext:com.softplan.safe.attribute.defect.versaodeorigem",
  "rtc_ext:com.oneforce.safe.attribute.incidente.causa",
  "rtc_ext:com.oneforce.safe.attribute.incidente.solucao",
  "rtc_ext:com.softplan.unj.attribute.funcionalidadeencontrada",
].join(",");

function rtcPlugin(rtcUser: string, rtcPass: string, anthropicKey: string): Plugin {
  console.log(`[rtc-proxy] Credenciais carregadas: RTC_USER=${rtcUser ? "✓" : "✗ AUSENTE"}, RTC_PASS=${rtcPass ? "✓" : "✗ AUSENTE"}, ANTHROPIC_API_KEY=${anthropicKey ? `✓ (${anthropicKey.slice(0, 14)}...)` : "✗ AUSENTE"}`);
  return {
    name: "rtc-proxy",
    configureServer(server) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = (req.url as string) ?? "";

        if (url === "/api/rtc/squads") {
          try {
            const cfg = fs.readFileSync(path.resolve(__dirname, ".claude/squad-config.json"), "utf-8");
            res.setHeader("Content-Type", "application/json");
            res.end(cfg);
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "squad-config.json not found" }));
          }
          return;
        }

        if (url.startsWith("/api/rtc/recorrentes")) {
          try {
            const qs = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
            const params = new URLSearchParams(qs);
            const squadId = params.get("squadId");
            const months = Math.max(1, Math.min(24, parseInt(params.get("months") ?? "6") || 6));

            if (!squadId) { res.statusCode = 400; res.end(JSON.stringify({ error: "Missing squadId" })); return; }
            if (!rtcUser || !rtcPass) { res.statusCode = 500; res.end(JSON.stringify({ error: "RTC_USER/RTC_PASS not set" })); return; }

            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);

            const squadConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, ".claude/squad-config.json"), "utf-8"));
            const squad = squadConfig.squads.find((s: { id: string }) => s.id === squadId);
            if (!squad) { res.statusCode = 404; res.end(JSON.stringify({ error: "Squad not found" })); return; }

            console.log(`[rtc-proxy] Recorrentes: ${squad.name} — últimos ${months} meses`);
            const cookie = await ensureRtcSession(rtcUser, rtcPass);

            const seen = new Set<string>();
            const allItems: DefeitoEnriquecido[] = [];
            for (const dev of squad.developers as Array<{ email: string }>) {
              const userId = dev.email.split("@")[0];
              const items = await fetchDevDefectsEnriched(cookie, userId, startDate, endDate, { user: rtcUser, pass: rtcPass });
              for (const item of items) {
                if (!seen.has(item.id)) { seen.add(item.id); allItems.push(item); }
              }
              console.log(`[rtc-proxy]   ${userId}: ${items.length} defeito(s), total único: ${allItems.length}`);
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ squad: squad.id, squadName: squad.name, months, startDate: startDate.toISOString(), total: allItems.length, items: allItems }));
          } catch (e) {
            console.error("[rtc-proxy] Recorrentes error:", e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        if (url.startsWith("/api/rtc/defects")) {
          try {
            const qs = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
            const params = new URLSearchParams(qs);
            const squadId = params.get("squadId");
            const startStr = params.get("startDate");
            const endStr = params.get("endDate");

            if (!squadId || !startStr || !endStr) {
              res.statusCode = 400; res.end(JSON.stringify({ error: "Missing params" })); return;
            }
            if (!rtcUser || !rtcPass) {
              res.statusCode = 500; res.end(JSON.stringify({ error: "RTC_USER/RTC_PASS not set in .env" })); return;
            }

            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            const squadConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, ".claude/squad-config.json"), "utf-8"));
            const squad = squadConfig.squads.find((s: { id: string }) => s.id === squadId);
            if (!squad) { res.statusCode = 404; res.end(JSON.stringify({ error: "Squad not found" })); return; }

            console.log(`[rtc-proxy] Autenticando no RTC...`);
            const cookie = await ensureRtcSession(rtcUser, rtcPass);
            console.log(`[rtc-proxy] Buscando defeitos para ${squad.developers.length} desenvolvedores...`);

            // Sequential to avoid token expiry (Jazz EWM tokens expire within seconds)
            const results = [];
            for (const dev of squad.developers as Array<{ email: string }>) {
              const userId = dev.email.split("@")[0];
              console.log(`[rtc-proxy] → ${userId}`);
              const { count, items } = await countDevDefects(cookie, userId, startDate, endDate, { user: rtcUser, pass: rtcPass });
              console.log(`[rtc-proxy]   ${userId}: ${count} defeito(s)`);
              results.push({ email: dev.email, userId, count, items });
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ squad: squad.id, squadName: squad.name, startDate: startStr, endDate: endStr, developers: results }));
          } catch (e) {
            console.error("[rtc-proxy] Error:", e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        // GET /api/rtc/card/:id — busca card individual pelo ID
        const cardMatch = url.match(/^\/api\/rtc\/card\/(\d+)/);
        if (cardMatch) {
          try {
            if (!rtcUser || !rtcPass) { res.statusCode = 500; res.end(JSON.stringify({ error: "RTC_USER/RTC_PASS não configurado" })); return; }
            const cardId = cardMatch[1];
            const cookie = await ensureRtcSession(rtcUser, rtcPass);
            const params = new URLSearchParams({
              "oslc.where": `dcterms:identifier="${cardId}"`,
              "oslc.properties": CARD_PROPS,
              "oslc.pageSize": "5",
            });
            const apiUrl = `https://${RTC_HOST}/ccm/oslc/contexts/${PROJECT_AREA}/workitems?${params}`;
            const parsed = new URL(apiUrl);
            const resp = await nodeHttpsFollow({
              hostname: RTC_HOST, path: parsed.pathname + parsed.search, method: "GET",
              headers: { Cookie: cookie, Accept: "application/json", "OSLC-Core-Version": "2.0" },
              rejectUnauthorized: false,
            }, undefined, cookie);
            if (resp.status !== 200) { res.statusCode = 502; res.end(JSON.stringify({ error: `RTC ${resp.status}` })); return; }
            const data = JSON.parse(resp.text);
            const members = (data["oslc:results"] ?? data["rdfs:member"] ?? []) as Record<string, unknown>[];
            if (members.length === 0) { res.statusCode = 404; res.end(JSON.stringify({ error: `Card #${cardId} não encontrado` })); return; }
            const item = members[0];
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              id: String(item["dcterms:identifier"] ?? ""),
              title: (item["dcterms:title"] as string) ?? "",
              description: (item["dcterms:description"] as string) ?? "",
              status: (item["oslc_cm:status"] as string) ?? "",
              created: (item["dcterms:created"] as string) ?? "",
              resolutionDate: (item["oslc_cm:closeDate"] as string) ?? null,
              versaoOrigem: (item["rtc_ext:com.softplan.safe.attribute.defect.versaodeorigem"] as string) ?? "",
              causa: (item["rtc_ext:com.oneforce.safe.attribute.incidente.causa"] as string) ?? "",
              solucao: (item["rtc_ext:com.oneforce.safe.attribute.incidente.solucao"] as string) ?? "",
              funcionalidade: (item["rtc_ext:com.softplan.unj.attribute.funcionalidadeencontrada"] as string) ?? "",
            }));
          } catch (e) {
            res.statusCode = 500; res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        // POST /api/claude/analyze — análise de defeito/cluster com IA
        if (url === "/api/claude/analyze" && req.method === "POST") {
          try {
            const body = await readBody(req);
            const payload = JSON.parse(body) as { type: string; defect?: Record<string, unknown>; cluster?: Record<string, unknown> };

            let systemPrompt = "Você é um especialista em qualidade de software para sistemas Delphi/Pascal (VCL, FireMonkey, DUnit/DUnitX). Responda sempre em português brasileiro. Seja direto e prático.";
            let userPrompt = "";

            if (payload.type === "defect" && payload.defect) {
              const d = payload.defect;
              userPrompt = `Analise este defeito de software e responda em formato JSON com as chaves:
- "causaRaiz": string — análise da causa raiz provável (2-3 parágrafos)
- "testesUnitarios": string[] — lista de 3-5 testes unitários que teriam detectado este defeito (cada item: descrição do teste)
- "testesIntegracao": string[] — lista de 2-3 testes de integração/e2e relevantes
- "exemploTeste": string — exemplo de código DUnit/DUnitX (Delphi/Pascal) do teste mais importante
- "comoEvitar": string[] — lista de 3-5 práticas/refatorações para evitar recorrência
- "checklistReview": string[] — lista de 4-6 pontos para o code review

Card RTC: #${d.id}
Título: ${d.title}
Funcionalidade: ${d.funcionalidade || "não informado"}
Versão: ${d.versaoOrigem || "não informada"}
Status: ${d.status}

Causa (como foi descrito): ${d.causa || "não preenchido"}

Solução aplicada: ${d.solucao || "não preenchida"}

${d.description ? `Descrição adicional: ${String(d.description).replace(/<[^>]+>/g, " ").trim().slice(0, 800)}` : ""}`;
            } else if (payload.type === "cluster" && payload.cluster) {
              const c = payload.cluster as Record<string, unknown>;
              const defeitos = (c.defeitos as Array<Record<string, unknown>>) ?? [];
              userPrompt = `Analise este cluster de defeitos similares e responda em JSON com as chaves:
- "causaRaizComum": string — o que une estes defeitos, padrão de problema (2-3 parágrafos)
- "tipoProblema": string — categoria (ex: "Validação de entrada", "Race condition", "Cache stale", etc.)
- "solucaoEstrutural": string — o que deve mudar na arquitetura/código para eliminar esta classe de defeitos
- "testesRegressao": string[] — lista de 3-5 testes de regressão para cobrir o cenário
- "exemploTeste": string — exemplo de código do teste de regressão mais importante
- "acaoPrioritaria": string — próximo passo concreto recomendado

Cluster: ${c.tipo} — Funcionalidade: ${c.funcionalidade}
Causa representativa: ${c.causaRepresentativa}
Número de ocorrências: ${defeitos.length}

Defeitos no cluster:
${defeitos.slice(0, 10).map((d) => `- #${d.id}: ${d.title} (${String(d.created ?? "").slice(0, 10)})`).join("\n")}`;
            } else {
              res.statusCode = 400; res.end(JSON.stringify({ error: "Payload inválido: informe type='defect' ou type='cluster'" })); return;
            }

            console.log(`[claude-proxy] Chamando claude CLI para análise (${payload.type})...`);
            const cliOutput = await callClaudeViaCli(`${systemPrompt}\n\n${userPrompt}`);
            console.log(`[claude-proxy] Resposta CLI recebida: ${cliOutput.length} chars`);

            const parsed = safeParseJson(cliOutput) ?? { raw: cliOutput.slice(0, 500) };

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(parsed));
          } catch (e) {
            res.statusCode = 500; res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        // POST /api/claude/validate-tests — valida testes sugeridos contra o código-fonte do GitLab
        if (url === "/api/claude/validate-tests" && req.method === "POST") {
          try {
            const body = await readBody(req);
            const payload = JSON.parse(body) as {
              testes: string[];
              cluster: { funcionalidade: string; causaRepresentativa?: string; tipo: string };
              gitlabToken: string;
            };
            const { testes, cluster, gitlabToken, analysis } = payload as {
              testes: string[];
              cluster: { funcionalidade: string; causaRepresentativa?: string; tipo: string };
              gitlabToken: string;
              analysis?: { causaRaizComum?: string; tipoProblema?: string; solucaoEstrutural?: string };
            };
            if (!gitlabToken) { res.statusCode = 400; res.end(JSON.stringify({ error: "Token GitLab não fornecido" })); return; }

            // Texto técnico da análise IA contém termos que aparecem no código (CamelCase, nomes de classes)
            const analysisText = [
              analysis?.tipoProblema ?? '',
              analysis?.causaRaizComum ?? '',
              analysis?.solucaoEstrutural ?? '',
            ].join(' ');

            // 1) Palavras CamelCase/PascalCase do texto da IA (prováveis identificadores Delphi)
            const camelTerms = (analysisText.match(/[A-Z][a-zA-Z]{3,}/g) ?? [])
              .filter((w: string) => !['Como','Para','Quando','Isso','Este','Essa','Deve','Cada','Toda','Toda'].includes(w))
              .slice(0, 4);

            // 2) Palavras técnicas sem acento da funcionalidade (fallback)
            const diacriticsRe = new RegExp('[\\u0300-\\u036f]', 'g');
            const removeAccents = (s: string) => s.normalize('NFD').replace(diacriticsRe, '');
            const stopwords = new Set(["de","do","da","dos","das","em","no","na","por","para","com","que","e","o","a","os","as","um","uma","se","ao","ou","nao","quando","mesmo","este","essa","deve","toda","sendo","isso","este"]);
            const funcWords = (cluster.funcionalidade ?? '').split(/[\s\/\-,().]+/)
              .map((w: string) => removeAccents(w))
              .filter((w: string) => w.length > 4 && !stopwords.has(w.toLowerCase()))
              .slice(0, 2);

            const keywords = [...new Set([...camelTerms, ...funcWords])].slice(0, 6);
            console.log(`[validate-proxy] Buscando por: ${keywords.join(", ")}`);

            const PROJECT = "softplan%2Fjustica%2Fprocuradorias%2Fsaj-procuradorias%2Fpge-net";
            const DELPHI_EXTS = [".pas", ".dfm"];
            const filesFound: { path: string; content: string }[] = [];

            // Helper: busca blobs e coleta .pas/.dfm
            const searchAndCollect = async (term: string, limit = 5) => {
              if (filesFound.length >= 6) return;
              const r = await nodeHttps({
                hostname: "gitlab.com", port: 443,
                path: `/api/v4/projects/${PROJECT}/search?scope=blobs&search=${encodeURIComponent(term)}&per_page=${limit}`,
                method: "GET",
                headers: { "PRIVATE-TOKEN": gitlabToken, "Accept": "application/json" },
              });
              if (r.status !== 200) return;
              const results = JSON.parse(r.text) as Array<{ filename: string; path: string; ref: string }>;
              for (const file of results.filter((f: { filename: string }) => DELPHI_EXTS.some(ext => f.filename.endsWith(ext)))) {
                if (filesFound.length >= 6 || filesFound.some(f => f.path === file.path)) continue;
                const fr = await nodeHttps({
                  hostname: "gitlab.com", port: 443,
                  path: `/api/v4/projects/${PROJECT}/repository/files/${encodeURIComponent(file.path)}/raw?ref=${file.ref}`,
                  method: "GET",
                  headers: { "PRIVATE-TOKEN": gitlabToken },
                });
                if (fr.status === 200) {
                  filesFound.push({ path: file.path, content: fr.text.slice(0, 5000) });
                  console.log(`[validate-proxy] + ${file.path}`);
                }
              }
            };

            // Estratégia 1: módulos explícitos da causa (PGEMS, PGMREC, PGEAM, etc.)
            // Captura siglas como PGEMS, PGMREC, PGEAM, UNJ_PROC etc.
            const modulePattern = /\b(PG[A-Z]{2,5}|[A-Z]{2,4}_[A-Z]{2,6})\b/g;
            const allText = `${cluster.funcionalidade} ${cluster.causaRepresentativa ?? ''} ${analysis?.causaRaizComum ?? ''}`;
            const modules = [...new Set((allText.match(modulePattern) ?? []))];
            console.log(`[validate-proxy] Módulos detectados: ${modules.join(', ') || 'nenhum'}`);
            for (const mod of modules.slice(0, 3)) await searchAndCollect(mod, 3);

            // Estratégia 2: termos Delphi específicos do problema
            const delphiTerms = ['InitialDir', 'TOpenDialog', 'dlgAnexo', 'dlgArquivo', 'Juntada', 'Anexo'];
            for (const term of delphiTerms) {
              if (filesFound.length >= 6) break;
              await searchAndCollect(term, 4);
            }

            // Estratégia 3: keywords da análise IA (CamelCase)
            for (const kw of keywords) {
              if (filesFound.length >= 6) break;
              await searchAndCollect(kw, 3);
            }

            console.log(`[validate-proxy] Total de arquivos encontrados: ${filesFound.length}`);
            if (filesFound.length > 0) {
              console.log(`[validate-proxy] Arquivos: ${filesFound.map(f => f.path.split('/').pop()).join(', ')}`);
            }

            if (filesFound.length === 0) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: `Nenhum arquivo Delphi (.pas/.dfm) encontrado. Estratégias usadas: módulos [${modules.join(',')}], termos Delphi [InitialDir, TOpenDialog, Juntada, Anexo], keywords [${keywords.join(',')}]. Verifique se o token GitLab tem acesso ao repositório pge-net.` }));
              return;
            }

            const codeContext = filesFound.map(f => `=== ${f.path} ===\n${f.content}`).join("\n\n");
            const testList = testes.map((t, i) => `${i + 1}. ${t}`).join("\n");

            const prompt = `Você é um especialista em testes de software Delphi/Pascal (DUnit, DUnitX, TestInsight). Analise o código-fonte real do repositório pge-net abaixo e avalie se cada teste sugerido é implementável.

CLUSTER DE DEFEITOS:
- Funcionalidade: ${cluster.funcionalidade}
- Tipo: ${cluster.tipo}
- Causa: ${(cluster.causaRepresentativa ?? "").slice(0, 400)}

CÓDIGO-FONTE REAL DO REPOSITÓRIO pge-net (Delphi/Pascal):
${codeContext}

TESTES SUGERIDOS:
${testList}

Responda SOMENTE com JSON válido, sem texto fora do JSON:
{
  "arquivosAnalisados": ["caminho/arquivo.pas"],
  "testes": [
    {
      "teste": "texto exato do teste sugerido",
      "status": "implementavel",
      "motivo": "explicação de 1-2 frases baseada no código real analisado",
      "comoImplementar": "dica concreta de como escrever o teste"
    }
  ]
}

Valores de status:
- "implementavel": pode ser escrito agora com o código como está
- "requer-refatoracao": faz sentido mas o código precisa de ajuste antes (ex: extrair interface, tornar mockável)
- "nao-testavel": não é viável como teste automatizado com esta arquitetura

Baseie sua avaliação no código Delphi real. Se o código não for suficiente para avaliar, diga isso no motivo. Sugira frameworks Delphi (DUnit, DUnitX, TestInsight) quando aplicável.`;

            console.log(`[validate-proxy] Chamando Claude CLI com ${filesFound.length} arquivo(s)...`);
            const cliOutput = await callClaudeViaCli(prompt);
            const parsed = safeParseJson(cliOutput);
            if (!parsed) { res.statusCode = 500; res.end(JSON.stringify({ error: "IA não retornou JSON válido", raw: cliOutput.slice(0, 500) })); return; }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(parsed));
          } catch (e) {
            console.error("[validate-proxy] Erro:", e);
            res.statusCode = 500; res.end(JSON.stringify({ error: String(e) }));
          }
          return;
        }

        next();
      });
    },
  };
}

// ─── Vite Config ─────────────────────────────────────────────────────────────

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/portal-custo-defeito/",
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      componentTagger(),
      rtcPlugin(env.RTC_USER ?? "", env.RTC_PASS ?? "", env.ANTHROPIC_API_KEY ?? ""),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      css: true,
      ui: true,
      open: false,
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.d.ts",
          "**/*.config.*",
          "**/dist/**",
          "**/build/**",
          "src/components/ui/accordion.tsx",
          "src/components/ui/alert-dialog.tsx",
          "src/components/ui/alert.tsx",
          "src/components/ui/aspect-ratio.tsx",
          "src/components/ui/avatar.tsx",
          "src/components/ui/breadcrumb.tsx",
          "src/components/ui/calendar.tsx",
          "src/components/ui/carousel.tsx",
          "src/components/ui/collapsible.tsx",
          "src/components/ui/command.tsx",
          "src/components/ui/context-menu.tsx",
          "src/components/ui/drawer.tsx",
          "src/components/ui/dropdown-menu.tsx",
          "src/components/ui/form.tsx",
          "src/components/ui/hover-card.tsx",
          "src/components/ui/input-otp.tsx",
          "src/components/ui/menubar.tsx",
          "src/components/ui/navigation-menu.tsx",
          "src/components/ui/pagination.tsx",
          "src/components/ui/popover.tsx",
          "src/components/ui/progress.tsx",
          "src/components/ui/radio-group.tsx",
          "src/components/ui/resizable.tsx",
          "src/components/ui/scroll-area.tsx",
          "src/components/ui/sheet.tsx",
          "src/components/ui/sidebar.tsx",
          "src/components/ui/skeleton.tsx",
          "src/components/ui/slider.tsx",
          "src/components/ui/switch.tsx",
          "src/components/ui/table.tsx",
          "src/components/ui/tabs.tsx",
          "src/components/ui/textarea.tsx",
          "src/components/ui/toggle-group.tsx",
          "src/components/ui/toggle.tsx",
          "src/hooks/use-mobile.tsx",
          "src/sampleData.ts",
          "src/types/**",
          "src/main.tsx",
        ],
        thresholds: {
          global: { branches: 60, functions: 60, lines: 60, statements: 60 },
        },
      },
    },
  };
});
