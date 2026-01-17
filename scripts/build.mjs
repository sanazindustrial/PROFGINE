// scripts/build.mjs
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const PUBLIC_DIR = path.join(ROOT, "public");
const MANIFESTS_DIR = path.join(ROOT, "manifests");
const DIST_DIR = path.join(ROOT, "dist");

const STORES = ["chrome", "firefox", "edge", "opera", "safari"];

// ---------- helpers ----------
async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function rimraf(p) {
  if (!(await exists(p))) return;
  await fsp.rm(p, { recursive: true, force: true });
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

function deepMerge(base, override) {
  const out = { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    if (Array.isArray(v)) {
      out[k] = v;
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge(base?.[k] ?? {}, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function copyDir(src, dest) {
  if (!(await exists(src))) return;
  await ensureDir(dest);
  const entries = await fsp.readdir(src, { withFileTypes: true });

  for (const e of entries) {
    const from = path.join(src, e.name);
    const to = path.join(dest, e.name);

    if (e.isDirectory()) {
      await copyDir(from, to);
    } else if (e.isFile()) {
      await ensureDir(path.dirname(to));
      await fsp.copyFile(from, to);
    }
  }
}

async function readJson(p) {
  const raw = await fsp.readFile(p, "utf8");
  return JSON.parse(raw);
}

async function writeJson(p, obj) {
  await ensureDir(path.dirname(p));
  await fsp.writeFile(p, JSON.stringify(obj, null, 2), "utf8");
}

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optionalEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

async function zipFolder(folderPath, zipPath) {
  await ensureDir(path.dirname(zipPath));

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
}

// ---------- external config generation ----------
function makeConfig(store) {
  const API_BASE_URL = requiredEnv("EXT_API_BASE_URL");
  const APP_BASE_URL = requiredEnv("EXT_APP_BASE_URL");
  const GOOGLE_OAUTH_CLIENT_ID = optionalEnv("EXT_GOOGLE_CLIENT_ID", "");
  const ENVIRONMENT = optionalEnv("EXT_ENV", "production");
  const ANALYTICS_KEY = optionalEnv(`EXT_ANALYTICS_KEY_${store.toUpperCase()}`, optionalEnv("EXT_ANALYTICS_KEY", ""));

  return {
    store,
    environment: ENVIRONMENT,
    apiBaseUrl: API_BASE_URL,
    appBaseUrl: APP_BASE_URL,
    googleClientId: GOOGLE_OAUTH_CLIENT_ID,
    analyticsKey: ANALYTICS_KEY,
    features: {
      aiGrading: optionalEnv("EXT_FEATURE_AI_GRADING", "true") === "true",
      discussionResponses: optionalEnv("EXT_FEATURE_DISCUSSION", "true") === "true",
      bulkGrading: optionalEnv("EXT_FEATURE_BULK_GRADING", "true") === "true",
      plagiarismCheck: optionalEnv("EXT_FEATURE_PLAGIARISM", "false") === "true",
      analytics: optionalEnv("EXT_FEATURE_ANALYTICS", "true") === "true"
    },
    security: {
      enableAuditLogs: optionalEnv("EXT_SECURITY_AUDIT_LOGS", "true") === "true",
      enforceHTTPS: optionalEnv("EXT_SECURITY_HTTPS", "true") === "true",
      tokenRefreshInterval: parseInt(optionalEnv("EXT_TOKEN_REFRESH_MINUTES", "30")) * 60 * 1000
    }
  };
}

// ---------- manifest adjustments per store ----------
function patchManifestForStore(manifest, store) {
  const out = { ...manifest };

  if (!out.version) out.version = "1.0.0";

  if (store === "firefox") {
    out.browser_specific_settings = out.browser_specific_settings ?? {};
    out.browser_specific_settings.gecko = out.browser_specific_settings.gecko ?? {};
    out.browser_specific_settings.gecko.id =
      out.browser_specific_settings.gecko.id || optionalEnv("FIREFOX_EXTENSION_ID", "profgini@profgini.com");
    out.browser_specific_settings.gecko.strict_min_version =
      out.browser_specific_settings.gecko.strict_min_version || "109.0";
  }

  if (store === "chrome" && out.key === "DEV_CHROME_KEY_PLACEHOLDER") {
    const chromeKey = optionalEnv("CHROME_EXTENSION_KEY", "");
    if (chromeKey) {
      out.key = chromeKey;
    } else {
      delete out.key;
    }
  }

  if (out.oauth2?.client_id === "CHROME_OAUTH_CLIENT_ID_PLACEHOLDER") {
    const clientId = optionalEnv("CHROME_OAUTH_CLIENT_ID", "");
    if (clientId) {
      out.oauth2.client_id = clientId;
    } else {
      delete out.oauth2;
    }
  }

  return out;
}

async function buildStore(store) {
  const outDir = path.join(DIST_DIR, store);
  await rimraf(outDir);
  await ensureDir(outDir);

  const baseManifestPath = path.join(MANIFESTS_DIR, "manifest.base.json");
  const storeManifestPath = path.join(MANIFESTS_DIR, `manifest.${store}.json`);

  if (!(await exists(baseManifestPath))) {
    throw new Error(`Missing ${baseManifestPath}`);
  }
  if (!(await exists(storeManifestPath))) {
    throw new Error(`Missing ${storeManifestPath}`);
  }

  const baseManifest = await readJson(baseManifestPath);
  const storeManifest = await readJson(storeManifestPath);

  const merged = deepMerge(baseManifest, storeManifest);
  const finalManifest = patchManifestForStore(merged, store);

  await writeJson(path.join(outDir, "manifest.json"), finalManifest);

  await copyDir(SRC_DIR, outDir);
  await copyDir(PUBLIC_DIR, outDir);

  const config = makeConfig(store);
  await writeJson(path.join(outDir, "config.json"), config);

  const zipPath = path.join(DIST_DIR, `${store}.zip`);
  await zipFolder(outDir, zipPath);

  console.log(`✅ Built ${store}: ${outDir}`);
  console.log(`📦 Zipped: ${zipPath}`);
}

async function main() {
  await ensureDir(DIST_DIR);

  requiredEnv("EXT_API_BASE_URL");
  requiredEnv("EXT_APP_BASE_URL");

  for (const store of STORES) {
    await buildStore(store);
  }

  console.log("\n✅ All store builds complete.");
  console.log("Next: upload chrome.zip to Chrome Web Store, firefox.zip to AMO, edge.zip to Edge Add-ons, opera.zip to Opera.");
  console.log("Safari: use Xcode 'Safari Web Extension' wrapper and point it at dist/safari.");
}

main().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
