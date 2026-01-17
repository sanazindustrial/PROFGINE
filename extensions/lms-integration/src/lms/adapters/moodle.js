// Moodle LMS Adapter for Professor GENIE
import {
  ExtractedPayload,
  PageKind
} from "../../types.js";

function txt(el ? : Element | null) {
  return (el?.textContent ?? "").trim();
}

function findButtonByText(texts: string[]) {
  const candidates = Array.from(document.querySelectorAll("button, input[type='submit'], a"));
  return candidates.find((b) => {
    const t = (b.textContent || (b as HTMLInputElement).value || "").toLowerCase();
    return texts.some((x) => t.includes(x.toLowerCase()));
  }) as HTMLElement | undefined;
}

function findTextareaByNameLike(names: string[]) {
  const tas = Array.from(document.querySelectorAll("textarea"));
  return tas.find((ta) =>
    names.some((n) => ((ta.getAttribute("name") || "") + " " + (ta.getAttribute("id") || "")).includes(n))
  ) as HTMLTextAreaElement | undefined;
}

function findInputByNameLike(names: string[]) {
  const ins = Array.from(document.querySelectorAll("input"));
  return ins.find((i) =>
    names.some((n) => ((i.getAttribute("name") || "") + " " + (i.getAttribute("id") || "")).includes(n))
  ) as HTMLInputElement | undefined;
}

function detectKind(): PageKind {
  const p = location.pathname.toLowerCase();
  const qs = location.search.toLowerCase();

  // forum discussion thread
  if (p.includes("mod/forum/discuss.php") || p.includes("mod/forum/view.php") || qs.includes("mod=forum")) {
    return "discussion";
  }

  // assignment grading/submission view
  if (p.includes("mod/assign/view.php") || qs.includes("mod=assign")) return "submission";

  return "unknown";
}

async function extractDiscussion(url: string): Promise < ExtractedPayload > {
  // Prompt/title
  const title = txt(document.querySelector("h1")) || txt(document.querySelector(".page-header-headings h1"));

  // Student post content: Moodle often uses .forumpost .content
  const post =
    document.querySelector(".forumpost .content") ||
    document.querySelector(".forumpost .post-content-container") ||
    document.querySelector(".forum-post-container .post-content");

  const studentText = txt(post) || window.getSelection()?.toString().trim() || "";

  // Reply editor: Moodle can use textarea[name="message"] or contenteditable editor
  const replyTa =
    findTextareaByNameLike(["message", "reply"]) ||
    (document.querySelector('textarea[id*="id_message"]') as HTMLTextAreaElement | null) ||
    undefined;

  const replyEditor =
    (document.querySelector('[contenteditable="true"]') as HTMLElement | null) ||
    (replyTa as unknown as HTMLElement | undefined);

  // Post/Save button
  const submitButton =
    findButtonByText(["post", "save", "submit", "add a reply"]) ||
    (document.querySelector('button[type="submit"]') as HTMLElement | null) ||
    undefined;

  return {
    lms: "moodle",
    kind: "discussion",
    url,
    prompt: title || undefined,
    studentText: studentText || undefined,
    targets: {
      replyBox: replyEditor ?? undefined,
      submitButton: submitButton ?? undefined
    }
  };
}

async function extractSubmission(url: string): Promise < ExtractedPayload > {
  const title = txt(document.querySelector("h1")) || txt(document.querySelector(".page-header-headings h1"));

  const prompt =
    txt(document.querySelector(".activity-description")) ||
    txt(document.querySelector(".intro")) ||
    title;

  // Student submission content (text online)
  const submission =
    document.querySelector(".submissionstatustable") ||
    document.querySelector(".assignsubmission_onlinetext") ||
    document.querySelector(".submission-full") ||
    document.querySelector(".usertext");

  const studentText = txt(submission) || window.getSelection()?.toString().trim() || "";

  // Files
  const files = Array.from(document.querySelectorAll('a[href*="pluginfile.php"], a[href*="/draftfile.php/"]'))
    .slice(0, 8)
    .map((a) => ({
      name: (a.textContent || "submission-file").trim(),
      url: (a as HTMLAnchorElement).href
    }));

  // Feedback box
  const feedbackBox =
    findTextareaByNameLike(["feedback", "comment", "assignfeedbackcomments"]) ||
    (document.querySelector('textarea[id*="assignfeedbackcomments"]') as HTMLTextAreaElement | null) ||
    undefined;

  // Grade input
  const gradeInput =
    findInputByNameLike(["grade", "assigngrade"]) ||
    (document.querySelector('input[id*="id_grade"]') as HTMLInputElement | null) ||
    undefined;

  // Save/Submit grading
  const submitButton =
    findButtonByText(["save changes", "save", "submit", "save grade"]) ||
    (document.querySelector('button[type="submit"]') as HTMLElement | null) ||
    undefined;

  return {
    lms: "moodle",
    kind: "submission",
    url,
    prompt: prompt || undefined,
    studentText: studentText || undefined,
    files: files.length ? files : undefined,
    targets: {
      feedbackBox: (feedbackBox as unknown as HTMLElement) ?? undefined,
      gradeInput: gradeInput ?? undefined,
      submitButton: submitButton ?? undefined
    }
  };
}

function applyText(target: HTMLElement, value: string) {
  const el: any = target;

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
  const inner = el.querySelector("textarea, input,[contenteditable='true']") as any;
  if (inner) applyText(inner, value);
}

export const moodleAdapter = {
  id: "moodle",

  matches: (url: string, doc: Document) => {
    const host = new URL(url).hostname.toLowerCase();
    const path = new URL(url).pathname.toLowerCase();
    // Moodle often has /mod/assign/ or /mod/forum/
    return (
      path.includes("/mod/assign/") ||
      path.includes("/mod/forum/") ||
      doc.querySelector('meta[name="generator"][content*="Moodle"]') !== null ||
      host.includes("moodle")
    );
  },

  detectPageType: () => detectKind(),

  extract: async (doc: Document, url: string): Promise < ExtractedPayload > => {
    const kind = detectKind();
    if (kind === "discussion") return extractDiscussion(url);
    if (kind === "submission") return extractSubmission(url);
    // fallback: treat as submission with selection-based content
    return {
      lms: "moodle",
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
