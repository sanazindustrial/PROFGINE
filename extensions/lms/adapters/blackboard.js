// Blackboard Ultra Adapter for Professor GENIE
import {
  ExtractedPayload,
  PageKind
} from "../../types.js";

function txt(el ? : Element | null) {
  return (el?.textContent ?? "").trim();
}

function findButtonByText(texts: string[]) {
  const candidates = Array.from(document.querySelectorAll("button, a, input[type='submit']"));
  return candidates.find((b) => {
    const t = (b.textContent || (b as HTMLInputElement).value || "").toLowerCase();
    return texts.some((x) => t.includes(x.toLowerCase()));
  }) as HTMLElement | undefined;
}

function detectKind(): PageKind {
  const u = location.href.toLowerCase();
  // Ultra discussion/threads patterns can vary
  if (u.includes("discussion") || u.includes("discussions") || u.includes("thread")) return "discussion";
  if (u.includes("gradebook") || u.includes("attempt") || u.includes("submission") || u.includes("grading"))
    return "submission";
  return "unknown";
}

function findUltraEditor(): HTMLElement | null {
  // Ultra uses contenteditable often
  const ce = document.querySelector('[contenteditable="true"]') as HTMLElement | null;
  if (ce) return ce;

  // fallback
  const ta = document.querySelector("textarea") as HTMLTextAreaElement | null;
  return ta as unknown as HTMLElement | null;
}

async function extractDiscussion(url: string): Promise < ExtractedPayload > {
  const title = txt(document.querySelector("h1")) || document.title;

  const post =
    document.querySelector('[data-test="discussion-post"]') ||
    document.querySelector(".discussion-post") ||
    document.querySelector(".message-body") ||
    document.querySelector(".content");

  const studentText = txt(post) || window.getSelection()?.toString().trim() || "";

  const replyBox = findUltraEditor();
  const submitButton = findButtonByText(["reply", "post", "submit", "publish", "save"]);

  return {
    lms: "blackboard",
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

  const prompt =
    txt(document.querySelector('[data-test="instructions"]')) ||
    txt(document.querySelector(".instructions")) ||
    title;

  const submission =
    document.querySelector('[data-test="attempt-content"]') ||
    document.querySelector(".attempt-content") ||
    document.querySelector(".submission-content") ||
    document.querySelector(".content");

  const studentText = txt(submission) || window.getSelection()?.toString().trim() || "";

  const files = Array.from(
      document.querySelectorAll('a[href*="download"], a[href*="attachment"], a[href*="file"]')
    )
    .slice(0, 10)
    .map((a) => ({
      name: (a.textContent || "submission-file").trim(),
      url: (a as HTMLAnchorElement).href
    }));

  // grade input
  const gradeInput =
    (document.querySelector('input[type="number"]') as HTMLInputElement | null) ||
    (document.querySelector('input[aria-label*="Grade"], input[aria-label*="Score"]') as HTMLInputElement | null) ||
    undefined;

  // feedback box: often an editor
  const feedbackBox = findUltraEditor();

  const submitButton = findButtonByText(["save", "submit", "post", "publish", "update"]);

  return {
    lms: "blackboard",
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

export const blackboardAdapter = {
  id: "blackboard",

  matches: (url: string, doc: Document) => {
    const u = url.toLowerCase();
    // Blackboard Ultra often uses /ultra/ and learn domains
    return u.includes("blackboard") || u.includes("/ultra/") || u.includes("learn");
  },

  detectPageType: () => detectKind(),

  extract: async (doc: Document, url: string): Promise < ExtractedPayload > => {
    const kind = detectKind();
    if (kind === "discussion") return extractDiscussion(url);
    if (kind === "submission") return extractSubmission(url);

    return {
      lms: "blackboard",
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
