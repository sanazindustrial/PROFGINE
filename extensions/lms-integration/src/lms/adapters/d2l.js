// D2L Brightspace Adapter for Professor GENIE
import {
  ExtractedPayload,
  PageKind
} from "../../types.js";

function txt(el ? : Element | null) {
  return (el?.textContent ?? "").trim();
}

function findButtonByText(texts: string[]) {
  const candidates = Array.from(document.querySelectorAll("button, d2l-button, a, input[type='submit']"));
  return candidates.find((b) => {
    const t = (b.textContent || (b as HTMLInputElement).value || "").toLowerCase();
    return texts.some((x) => t.includes(x.toLowerCase()));
  }) as HTMLElement | undefined;
}

function detectKind(): PageKind {
  const url = location.href.toLowerCase();
  // Discussions often include /d2l/le/ or discussions tool paths
  if (url.includes("discussions") || url.includes("discussion") || url.includes("topic")) return "discussion";
  // Assignments often include "dropbox" (Brightspace legacy term) or "assignments"
  if (url.includes("dropbox") || url.includes("assignments") || url.includes("evaluate")) return "submission";
  return "unknown";
}

function findD2LEditor() {
  // Brightspace uses d2l-htmleditor sometimes with an iframe or contenteditable
  const editable = document.querySelector('[contenteditable="true"]') as HTMLElement | null;

  // Some pages provide a textarea fallback
  const ta = document.querySelector("textarea") as HTMLTextAreaElement | null;

  return editable || (ta as unknown as HTMLElement | null);
}

async function extractDiscussion(url: string): Promise < ExtractedPayload > {
  const title = txt(document.querySelector("h1")) || document.title;

  // Post content containers vary; try common patterns
  const post =
    document.querySelector('[data-test="message-content"]') ||
    document.querySelector(".d2l-htmlblock") ||
    document.querySelector(".d2l-body-small") ||
    document.querySelector(".d2l-typography");

  const studentText = txt(post) || window.getSelection()?.toString().trim() || "";

  const replyBox = findD2LEditor();
  const submitButton = findButtonByText(["post", "publish", "reply", "submit", "save"]);

  return {
    lms: "d2l",
    kind: "discussion",
    url,
    prompt: title || undefined,
    studentText: studentText || undefined,
    targets: {
      replyBox: replyBox ?? undefined,
      submitButton: submitButton ?? undefined
    }
  };
}

async function extractSubmission(url: string): Promise < ExtractedPayload > {
  const title = txt(document.querySelector("h1")) || document.title;

  // Prompt: try to capture assignment description panel
  const prompt =
    txt(document.querySelector('[data-test="assignment-description"]')) ||
    txt(document.querySelector(".d2l-htmlblock")) ||
    title;

  // Student submission text (if visible)
  const submission =
    document.querySelector('[data-test="submission-text"]') ||
    document.querySelector(".d2l-htmlblock") ||
    document.querySelector(".d2l-typography");

  const studentText = txt(submission) || window.getSelection()?.toString().trim() || "";

  // File links
  const files = Array.from(
      document.querySelectorAll('a[href*="d2l/common/dialogs/quickLink/quickLink.d2l"], a[href*="download"], a[href*="view"]')
    )
    .slice(0, 10)
    .map((a) => ({
      name: (a.textContent || "submission-file").trim(),
      url: (a as HTMLAnchorElement).href
    }));

  // Feedback box: Brightspace often has a rich editor for feedback
  const feedbackBox = findD2LEditor();

  // Grade input: search for number inputs / points fields
  const gradeInput =
    (document.querySelector('input[type="number"]') as HTMLInputElement | null) ||
    (
      document.querySelector('input[aria-label*="Score"], input[aria-label*="Grade"], input[name*="score"]') as HTMLInputElement | null
    ) ||
    undefined;

  const submitButton = findButtonByText(["publish", "save", "update", "submit"]);

  return {
    lms: "d2l",
    kind: "submission",
    url,
    prompt: prompt || undefined,
    studentText: studentText || undefined,
    files: files.length ? files : undefined,
    targets: {
      feedbackBox: feedbackBox ?? undefined,
      gradeInput: gradeInput ?? undefined,
      submitButton: submitButton ?? undefined
    }
  };
}

function applyText(target: HTMLElement, value: string) {
  const el: any = target;
  if (!el) return;

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

  const inner = el.querySelector("textarea, input, [contenteditable='true']") as HTMLElement | null;
  if (inner) applyText(inner, value);
}

export const d2lAdapter = {
  id: "d2l",

  matches: (url: string) => {
    const u = url.toLowerCase();
    return u.includes("brightspace") || u.includes("/d2l/") || u.includes("d2lsession");
  },

  detectPageType: () => detectKind(),

  extract: async (doc: Document, url: string): Promise < ExtractedPayload > => {
    const kind = detectKind();
    if (kind === "discussion") return extractDiscussion(url);
    if (kind === "submission") return extractSubmission(url);

    return {
      lms: "d2l",
      kind: "submission",
      url,
      prompt: document.title,
      studentText: window.getSelection()?.toString().trim() || undefined,
      targets: {}
    };
  },

  applyFeedback: async (target: HTMLElement, text: string): Promise < void > => {
    applyText(target, text);
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
