// Professor GENIE Content Script - Main Orchestration
import {
  extractFromPage,
  getAdapter
} from "./src/lms/index.js";
import {
  GradeRequest,
  GradeResponse
} from "./src/types.js";

const PANEL_ID = "genie-overlay-panel";

// Domain allowlist check
async function isAllowedDomain() {
  const host = location.hostname.toLowerCase();
  const KEY = "genie_allowed_domains";

  return new Promise((resolve) => {
    chrome.storage.local.get(KEY, (res) => {
      const items = (res[KEY] ?? []);
      if (!items.length) return resolve(true); // allow if empty (dev mode)
      resolve(items.some((x) => host === x.domain || host.endsWith("." + x.domain)));
    });
  });
}

function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get("genie_token", (res) => resolve(res.genie_token ?? null));
  });
}

async function callBackend(payload) {
  const token = await getToken();
  if (!token) throw new Error("Not logged in to GENIE. Please sign in first.");

  const apiEndpoint = window.__GENIE_API__ || "https://profgenie.ai/api/lms/grade";

  const res = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "GENIE grading failed");
  return data;
}

function mountPanel() {
  if (document.getElementById(PANEL_ID)) return;

  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.style.cssText = `
    position: fixed; right: 16px; top: 16px; z-index: 999999;
    width: 380px; max-height: 85vh; overflow: auto;
    background: white; border: 1px solid #ddd; border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    padding: 16px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto;
    font-size: 14px; line-height: 1.4;
  `;

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
      <strong style="font-size: 16px; color: #2563eb;">Professor GENIE</strong>
      <button id="genie-close" style="border:none;background:transparent;font-size:18px;cursor:pointer;">×</button>
    </div>

    <div style="margin-bottom: 12px; font-size: 12px; color: #666; background: #f8f9fa; padding: 8px; border-radius: 6px;">
      <strong>Tip:</strong> Highlight student post/submission text if auto-detection misses it.
    </div>

    <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom: 12px;">
      <button id="genie-extract" class="genie-btn genie-btn-secondary">1. Extract</button>
      <button id="genie-generate" class="genie-btn genie-btn-primary">2. Generate</button>
      <button id="genie-apply" class="genie-btn genie-btn-success">3. Apply</button>
      <button id="genie-submit" class="genie-btn genie-btn-warning">4. Submit</button>
    </div>

    <div style="display:flex; gap:8px; margin-bottom: 12px;">
      <div style="flex: 1;">
        <label style="font-size:12px; font-weight: 500;">Tone</label>
        <select id="genie-tone" style="width:100%; margin:4px 0; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="supportive">Supportive</option>
          <option value="direct">Direct</option>
        </select>
      </div>
    </div>

    <div id="genie-status" style="margin:8px 0; padding: 8px; font-size:12px; color:#666; background: #f8f9fa; border-radius: 6px; min-height: 20px;"></div>

    <div style="margin-bottom: 12px;">
      <label style="font-size:12px; font-weight: 500;">Extracted Student Text</label>
      <textarea id="genie-studentText" style="width:100%; height:80px; margin: 4px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;" placeholder="Student text will appear here..."></textarea>
    </div>

    <div style="margin-bottom: 12px;">
      <label style="font-size:12px; font-weight: 500;">Prompt/Context</label>
      <textarea id="genie-prompt" style="width:100%; height:60px; margin: 4px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;" placeholder="Assignment prompt or discussion topic..."></textarea>
    </div>

    <div style="margin-bottom: 12px;">
      <label style="font-size:12px; font-weight: 500;">Generated Feedback</label>
      <textarea id="genie-feedback" style="width:100%; height:100px; margin: 4px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;" placeholder="AI-generated feedback will appear here..."></textarea>
    </div>

    <div style="margin-bottom: 12px;">
      <label style="font-size:12px; font-weight: 500;">Score (optional)</label>
      <input id="genie-score" type="number" style="width:100%; margin: 4px 0; padding: 6px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Points or grade..." />
    </div>

    <hr style="margin:12px 0; border: none; border-top: 1px solid #eee;" />

    <div style="font-size:11px; color:#888; line-height: 1.3;">
      <strong>Generic Mode Mapping:</strong> If fields aren't found automatically, use these buttons to map LMS elements once per domain:
    </div>
    <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top: 6px;">
      <button id="genie-map-feedback" class="genie-btn-small">Map Feedback</button>
      <button id="genie-map-reply" class="genie-btn-small">Map Reply</button>
      <button id="genie-map-grade" class="genie-btn-small">Map Grade</button>
      <button id="genie-map-submit" class="genie-btn-small">Map Submit</button>
    </div>

    <style>
      .genie-btn {
        padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; 
        font-size: 12px; font-weight: 500; transition: all 0.2s;
      }
      .genie-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .genie-btn-primary { background: #2563eb; color: white; }
      .genie-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
      .genie-btn-secondary { background: #6b7280; color: white; }
      .genie-btn-secondary:hover:not(:disabled) { background: #4b5563; }
      .genie-btn-success { background: #059669; color: white; }
      .genie-btn-success:hover:not(:disabled) { background: #047857; }
      .genie-btn-warning { background: #d97706; color: white; }
      .genie-btn-warning:hover:not(:disabled) { background: #b45309; }
      .genie-btn-small {
        padding: 4px 8px; border: 1px solid #ddd; background: white; color: #374151;
        border-radius: 4px; cursor: pointer; font-size: 10px;
      }
      .genie-btn-small:hover { background: #f3f4f6; }
    </style>
  `;

  document.body.appendChild(panel);

  const $ = (id) => document.getElementById(id);

  $("#genie-close").onclick = () => panel.remove();

  let lastExtract = null;
  let lastResponse = null;

  // Extract button
  $("#genie-extract").onclick = async () => {
    try {
      $("#genie-status").textContent = "🔍 Extracting content from page...";
      $("#genie-status").style.background = "#e0f2fe";
      $("#genie-status").style.color = "#0277bd";

      lastExtract = await extractFromPage();

      if (!lastExtract) {
        $("#genie-status").textContent = "⚠️ Could not detect page type. Highlight text and try again, or use Generic mapping.";
        $("#genie-status").style.background = "#fff3e0";
        $("#genie-status").style.color = "#ef6c00";
        return;
      }

      $("#genie-studentText").value = lastExtract.studentText ?? "";
      $("#genie-prompt").value = lastExtract.prompt ?? document.title ?? "";

      $("#genie-status").textContent = `✅ Detected: ${lastExtract.lms} / ${lastExtract.kind}`;
      $("#genie-status").style.background = "#e8f5e8";
      $("#genie-status").style.color = "#2e7d32";
    } catch (e) {
      $("#genie-status").textContent = "❌ " + (e?.message ?? "Extract failed");
      $("#genie-status").style.background = "#ffebee";
      $("#genie-status").style.color = "#c62828";
    }
  };

  // Generate button
  $("#genie-generate").onclick = async () => {
    try {
      if (!lastExtract) {
        $("#genie-status").textContent = "⚠️ Click 'Extract' first to detect content.";
        $("#genie-status").style.background = "#fff3e0";
        $("#genie-status").style.color = "#ef6c00";
        return;
      }

      const tone = $("#genie-tone").value;
      const studentText = $("#genie-studentText").value.trim();
      const prompt = $("#genie-prompt").value.trim();

      if (!studentText) {
        $("#genie-status").textContent = "⚠️ No student text found. Highlight the post/submission and click Extract.";
        $("#genie-status").style.background = "#fff3e0";
        $("#genie-status").style.color = "#ef6c00";
        return;
      }

      const payload = {
        kind: lastExtract.kind === "discussion" ? "discussion" : "assignment",
        lms: lastExtract.lms,
        url: lastExtract.url,
        prompt,
        studentText,
        tone
      };

      $("#genie-status").textContent = "🤖 Generating AI feedback and grade...";
      $("#genie-status").style.background = "#e0f2fe";
      $("#genie-status").style.color = "#0277bd";

      lastResponse = await callBackend(payload);

      $("#genie-feedback").value = lastResponse.feedback ?? "";
      $("#genie-score").value = lastResponse.score ?? "";

      $("#genie-status").textContent = `✅ Generated (confidence: ${Math.round(lastResponse.confidence * 100)}%)`;
      $("#genie-status").style.background = "#e8f5e8";
      $("#genie-status").style.color = "#2e7d32";
    } catch (e) {
      $("#genie-status").textContent = "❌ " + (e?.message ?? "Generate failed");
      $("#genie-status").style.background = "#ffebee";
      $("#genie-status").style.color = "#c62828";
    }
  };

  // Apply button
  $("#genie-apply").onclick = async () => {
    try {
      if (!lastExtract) {
        $("#genie-status").textContent = "⚠️ Click 'Extract' first.";
        $("#genie-status").style.background = "#fff3e0";
        $("#genie-status").style.color = "#ef6c00";
        return;
      }

      if (!lastResponse) {
        $("#genie-status").textContent = "⚠️ Click 'Generate' first.";
        $("#genie-status").style.background = "#fff3e0";
        $("#genie-status").style.color = "#ef6c00";
        return;
      }

      const adapter = getAdapter(location.href, document);
      const feedback = $("#genie-feedback").value.trim();
      const scoreRaw = $("#genie-score").value;
      const score = scoreRaw ? Number(scoreRaw) : undefined;

      $("#genie-status").textContent = "📝 Applying to LMS fields...";
      $("#genie-status").style.background = "#e0f2fe";
      $("#genie-status").style.color = "#0277bd";

      // Apply to discussion reply or submission feedback
      if (lastExtract.kind === "discussion") {
        if (!lastExtract.targets.replyBox) {
          throw new Error("Reply box not found. Use 'Map Reply' in Generic mode.");
        }
        await adapter.applyFeedback(lastExtract.targets.replyBox, feedback);
      } else {
        if (!lastExtract.targets.feedbackBox) {
          throw new Error("Feedback box not found. Use 'Map Feedback' in Generic mode.");
        }
        await adapter.applyFeedback(lastExtract.targets.feedbackBox, feedback);

        if (score !== undefined) {
          if (!lastExtract.targets.gradeInput) {
            throw new Error("Grade input not found. Use 'Map Grade' in Generic mode.");
          }
          await adapter.applyGrade(lastExtract.targets.gradeInput, score);
        }
      }

      $("#genie-status").textContent = "✅ Applied to LMS fields. Review carefully, then click Submit to save.";
      $("#genie-status").style.background = "#e8f5e8";
      $("#genie-status").style.color = "#2e7d32";
    } catch (e) {
      $("#genie-status").textContent = "❌ " + (e?.message ?? "Apply failed");
      $("#genie-status").style.background = "#ffebee";
      $("#genie-status").style.color = "#c62828";
    }
  };

  // Submit button
  $("#genie-submit").onclick = async () => {
    try {
      if (!lastExtract) {
        $("#genie-status").textContent = "⚠️ Click 'Extract' first.";
        $("#genie-status").style.background = "#fff3e0";
        $("#genie-status").style.color = "#ef6c00";
        return;
      }

      const adapter = getAdapter(location.href, document);

      if (!lastExtract.targets.submitButton) {
        throw new Error("Submit button not found. Use 'Map Submit' in Generic mode.");
      }

      const actionType = lastExtract.kind === "discussion" ? "post reply" : "save grade";
      const ok = confirm(`Ready to ${actionType}?\\n\\nThis will click the LMS submit/save button. Make sure you've reviewed the content.`);
      if (!ok) return;

      $("#genie-status").textContent = `📤 Submitting to LMS...`;
      $("#genie-status").style.background = "#e0f2fe";
      $("#genie-status").style.color = "#0277bd";

      await adapter.submit(lastExtract.targets.submitButton);

      $("#genie-status").textContent = "🎉 Successfully submitted to LMS!";
      $("#genie-status").style.background = "#e8f5e8";
      $("#genie-status").style.color = "#2e7d32";

      // Auto-close panel after successful submit
      setTimeout(() => panel.remove(), 2000);
    } catch (e) {
      $("#genie-status").textContent = "❌ " + (e?.message ?? "Submit failed");
      $("#genie-status").style.background = "#ffebee";
      $("#genie-status").style.color = "#c62828";
    }
  };

  // Generic mapping buttons
  $("#genie-map-feedback").onclick = async () => {
    const {
      genericAdapter
    } = await import("./src/lms/adapters/generic.js");
    await genericAdapter.pickAndSaveTarget("feedbackBox");
  };

  $("#genie-map-reply").onclick = async () => {
    const {
      genericAdapter
    } = await import("./src/lms/adapters/generic.js");
    await genericAdapter.pickAndSaveTarget("replyBox");
  };

  $("#genie-map-grade").onclick = async () => {
    const {
      genericAdapter
    } = await import("./src/lms/adapters/generic.js");
    await genericAdapter.pickAndSaveTarget("gradeInput");
  };

  $("#genie-map-submit").onclick = async () => {
    const {
      genericAdapter
    } = await import("./src/lms/adapters/generic.js");
    await genericAdapter.pickAndSaveTarget("submitButton");
  };
}

// Initialize content script
(async () => {
  if (!(await isAllowedDomain())) return;

  // Wait a bit for page to load, then mount panel
  setTimeout(mountPanel, 1000);
})();
