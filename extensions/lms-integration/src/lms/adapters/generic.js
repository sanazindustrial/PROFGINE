// Generic Fallback Adapter for Professor GENIE
import {
  ExtractedPayload,
  PageKind
} from "../../types.js";

function getSelectionText() {
  return window.getSelection()?.toString().trim() || "";
}

function isLikelyDiscussion() {
  const url = location.href.toLowerCase();
  return url.includes("discussion") || url.includes("forum") || url.includes("thread") || url.includes("topic");
}

function isLikelySubmission() {
  const url = location.href.toLowerCase();
  return url.includes("assignment") || url.includes("submission") || url.includes("grade") || url.includes("attempt");
}

function cssPath(el) {
  // Generate CSS path for element persistence
  const parts = [];
  let cur: Element | null = el;
  while (cur && parts.length < 5) {
    const id = cur.getAttribute("id");
    if (id) {
      parts.unshift(`#${CSS.escape(id)}`);
      break;
    }

    const name = cur.nodeName.toLowerCase();
    const cls = (cur.getAttribute("class") || "")
      .split(/\\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((c) => `.${CSS.escape(c)}`)
      .join("");
    parts.unshift(`${name}${cls}`);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

async function storeSelector(key: string, selector: string) {
  const domain = location.hostname;
  const storageKey = `genie_selectors:${domain}`;

  return new Promise < void > ((resolve) => {
    chrome.storage.local.get(storageKey, (data) => {
      const current = data[storageKey] || {};
      current[key] = selector;
      chrome.storage.local.set({
        [storageKey]: current
      }, () => resolve());
    });
  });
}

async function loadSelector(key: string): Promise < string | undefined > {
  const domain = location.hostname;
  const storageKey = `genie_selectors:${domain}`;

  return new Promise((resolve) => {
    chrome.storage.local.get(storageKey, (data) => {
      resolve(data[storageKey]?. [key] as string | undefined);
    });
  });
}

function dispatchEvents(target: HTMLElement, value: string) {
  const el = target as any;

  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    el.value = value;
    el.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    el.dispatchEvent(new Event("change", {
      bubbles: true
    }));
    el.dispatchEvent(new KeyboardEvent("keydown", {
      bubbles: true
    }));
    return;
  }

  if (el.isContentEditable) {
    el.textContent = value;
    el.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    return;
  }

  // Try to find nested input
  const inner = el.querySelector("textarea, input") as HTMLTextAreaElement | HTMLInputElement | null;
  if (inner) {
    (inner as any).value = value;
    inner.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    inner.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  }
}

export const genericAdapter = {
  id: "generic",

  matches: () => true, // Always matches as fallback

  detectPageType: (): PageKind => {
    if (isLikelyDiscussion()) return "discussion";
    if (isLikelySubmission()) return "submission";
    return "unknown";
  },

  extract: async (doc: Document, url: string): Promise < ExtractedPayload > => {
    const kind = genericAdapter.detectPageType();
    const selected = getSelectionText();

    // Try to reuse saved selectors
    const feedbackSel = await loadSelector("feedbackBox");
    const replySel = await loadSelector("replyBox");
    const gradeSel = await loadSelector("gradeInput");
    const submitSel = await loadSelector("submitButton");

    const feedbackBox = feedbackSel ? (doc.querySelector(feedbackSel) as HTMLElement | null) : null;
    const replyBox = replySel ? (doc.querySelector(replySel) as HTMLElement | null) : null;
    const gradeInput = gradeSel ? (doc.querySelector(gradeSel) as HTMLInputElement | null) : null;
    const submitButton = submitSel ? (doc.querySelector(submitSel) as HTMLElement | null) : null;

    return {
      lms: "generic",
      kind: kind === "discussion" ? "discussion" : "submission",
      url,
      prompt: doc.title || "Generic LMS Content",
      studentText: selected || "Please highlight the student text and click Extract again",
      targets: {
        feedbackBox: feedbackBox ?? undefined,
        replyBox: replyBox ?? undefined,
        gradeInput: gradeInput ?? undefined,
        submitButton: submitButton ?? undefined
      }
    };
  },

  // User-assisted element mapping
  pickAndSaveTarget: async (key: "feedbackBox" | "replyBox" | "gradeInput" | "submitButton"): Promise < void > => {
    const descriptions = {
      feedbackBox: "feedback/comment textarea or editor",
      replyBox: "discussion reply editor",
      gradeInput: "grade/points input field",
      submitButton: "save/submit/post button"
    };

    return new Promise < void > ((resolve) => {
      // Create overlay instructions
      const overlay = document.createElement("div");
      overlay.id = "genie-mapping-overlay";
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 9999999; display: flex;
        align-items: center; justify-content: center; font-family: system-ui;
      `;

      overlay.innerHTML = `
        <div style="background: white; padding: 24px; border-radius: 12px; max-width: 400px; text-align: center;">
          <h3 style="margin: 0 0 16px 0; color: #2563eb;">Map LMS Element</h3>
          <p style="margin: 0 0 16px 0; color: #4b5563;">
            Click on the <strong>${descriptions[key]}</strong> on this page.
          </p>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">
            This will be remembered for ${location.hostname}
          </p>
          <button id="cancel-mapping" style="
            background: #6b7280; color: white; border: none; padding: 8px 16px; 
            border-radius: 6px; cursor: pointer; margin-right: 8px;
          ">Cancel</button>
        </div>
      `;

      document.body.appendChild(overlay);

      // Cancel button
      document.getElementById("cancel-mapping") !.onclick = () => {
        overlay.remove();
        resolve();
      };

      // Click handler for element selection
      const clickHandler = async (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Remove highlight from previous element
        document.querySelectorAll('.genie-highlight').forEach(el => {
          el.classList.remove('genie-highlight');
        });

        const target = e.target as Element;
        const selector = cssPath(target);

        await storeSelector(key, selector);

        document.removeEventListener("click", clickHandler, true);
        overlay.remove();

        // Show success feedback
        const success = document.createElement("div");
        success.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999999;
          background: #059669; color: white; padding: 12px 16px; border-radius: 8px;
          font-family: system-ui; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        success.textContent = `✅ ${key} mapped successfully!`;
        document.body.appendChild(success);

        setTimeout(() => success.remove(), 3000);
        resolve();
      };

      // Mouse over handler for highlighting
      const hoverHandler = (e: MouseEvent) => {
        // Remove previous highlights
        document.querySelectorAll('.genie-highlight').forEach(el => {
          el.classList.remove('genie-highlight');
        });

        // Add highlight to current target
        const target = e.target as Element;
        target.classList.add('genie-highlight');
      };

      // Add CSS for highlighting
      if (!document.getElementById('genie-highlight-styles')) {
        const styles = document.createElement('style');
        styles.id = 'genie-highlight-styles';
        styles.textContent = `
          .genie-highlight {
            outline: 2px solid #2563eb !important;
            outline-offset: 2px;
            background: rgba(37, 99, 235, 0.1) !important;
            cursor: crosshair !important;
          }
        `;
        document.head.appendChild(styles);
      }

      document.addEventListener("click", clickHandler, true);
      document.addEventListener("mouseover", hoverHandler, true);

      // Cleanup on overlay removal
      const observer = new MutationObserver(() => {
        if (!document.contains(overlay)) {
          document.removeEventListener("click", clickHandler, true);
          document.removeEventListener("mouseover", hoverHandler, true);
          document.querySelectorAll('.genie-highlight').forEach(el => {
            el.classList.remove('genie-highlight');
          });
          observer.disconnect();
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  },

  applyFeedback: async (target: HTMLElement, text: string): Promise < void > => {
    dispatchEvents(target, text);
  },

  applyGrade: async (target: HTMLInputElement, score: number): Promise < void > => {
    target.value = String(score);
    target.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    target.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  },

  submit: async (button: HTMLElement): Promise < void > => {
    (button as any).click?.();
  }
};
