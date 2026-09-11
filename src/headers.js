export function normalizeHeaderMap(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value == null || value === "") continue;
    out[String(key).toLowerCase()] = String(value);
  }
  return out;
}

export function parseGatewayHeaders(raw) {
  if (raw == null || String(raw).trim() === "") return {};
  const parsed = JSON.parse(String(raw));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("GROK_BOT_GATEWAY_HEADERS must be a JSON object");
  }
  return normalizeHeaderMap(parsed);
}

export function headersFromEnsureSandbox(body) {
  if (!body || typeof body !== "object") return {};
  const mapped = normalizeHeaderMap(body.gatewayHeaders || body.gateway_headers);
  if (Object.keys(mapped).length) return mapped;
  const token = body.anyrunNetworkToken || body.anyrun_network_token || body.networkToken;
  return token ? { "x-anyrun-network-token": String(token) } : {};
}

export function headersFromEnv() {
  return parseGatewayHeaders(process.env.GROK_BOT_GATEWAY_HEADERS);
}

export function mergeGatewayHeaders(sessionHeaders, envHeaders) {
  return { ...(sessionHeaders || {}), ...(envHeaders || {}) };
}

export function requestHeaders(session) {
  return {
    "content-type": "application/json",
    authorization: "Bearer " + session.gatewayToken,
    ...(session.gatewayHeaders || {}),
  };
}

export function ensureSandboxHeaders(accessToken) {
  return {
    "content-type": "application/json",
    "connect-protocol-version": "1",
    authorization: "Bearer " + accessToken,
    "x-cursor-client-type": "sand",
    // Upstream pinned this at "0.20.0", which the backend now rejects with
    // "This version of Grok Bot is no longer supported." Bumped to a version
    // known to work as of this fork; override with SAND_CLIENT_VERSION if it
    // drifts again (the backend enforces a floor, not this exact string).
    "x-cursor-client-version": process.env.SAND_CLIENT_VERSION || "0.39.0",
    "x-sand-box-namespace": process.env.SAND_BOX_NAMESPACE || "prod",
  };
}
