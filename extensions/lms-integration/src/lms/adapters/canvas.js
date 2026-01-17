// Canvas LMS Adapter for Professor GENIE
import {
  ExtractedPayload,
  PageKind
} from "../../types.js";

function textFrom(el) {
  return (el?.textContent ?? "").trim();
}

function findButtonByText(texts) {
  const buttons = Array.from(document.querySelectorAll("button, a, input[type='submit']"));
  return buttons.find((b) =>
    texts.some((t) => (b.textContent || b.value || "").toLowerCase().includes(t.toLowerCase()))
  );
}

function queryByLabelText(label) {
  // Look for aria-label first
  const ariaLabeled = document.querySelector(`[aria-label*="${label}" i]`);
  if (ariaLabeled) return ariaLabeled;

  // Look for labels
  const labels = Array.from(document.querySelectorAll("label"));
  for (const labelEl of labels) {
    if (labelEl.textContent?.toLowerCase().includes(label.toLowerCase())) {
      const forAttr = labelEl.getAttribute("for");
      if (forAttr) {
        const target = document.getElementById(forAttr);
        if (target) return target;
      }
      // Also check if input is nested inside label
      const nested = labelEl.querySelector("input, textarea");
      if (nested) return nested;
    }
  }

  return null;
}

function findTextareaNearText(text) {
  const textElements = Array.from(document.querySelectorAll("div, span, label, p"));
  const matching = textElements.filter((el) =>
    (el.textContent || "").toLowerCase().includes(text.toLowerCase())
  );

  for (const el of matching) {
    // Check same container
    const container = el.closest("div") ?? el.parentElement;
    if (container) {
      const textarea = container.querySelector("textarea");
      if (textarea) return textarea;
    }
  }

  return null;
}

function detectKind(doc) {
  const url = location.pathname.toLowerCase();

  // Canvas Discussion URLs often include /discussion_topics/
  if (url.includes("/discussion_topics/")) return "discussion";

  // Submissions often include /assignments/ and /submissions/
  if (url.includes("/assignments/") && (url.includes("/submissions/") || url.includes("/gradebook/"))) {
    return "submission";
  }

  // Also check SpeedGrader
  if (url.includes("/gradebook/speed_grader")) return "submission";

  return "unknown";
}

async function extractDiscussion(doc, url) {
  // Prompt/title - try multiple selectors
  const titleSelectors = [
    "h1",
    ".discussion-title",
    "[data-testid='discussion-topic-title']",
    ".discussion-topic-title",
    ".page-title"
  ];

  let title = "";
  for (const selector of titleSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      title = textFrom(el);
      if (title) break;
    }
  }

  // Student post content - Canvas discussion entry selectors
  const postSelectors = [
    "[data-testid='discussion-topic-message']",
    ".discussion_entry .message.user_content",
    ".discussion-entry .message",
    ".message.user_content",
    ".discussion-post .user_content",
    ".discussion-root-entry .message"
  ];

  let studentText = "";
  for (const selector of postSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      studentText = textFrom(el);
      if (studentText) break;
    }
  }

  // If no auto-detected content, try selected text
  if (!studentText) {
    studentText = window.getSelection()?.toString().trim() || "";
  }

  // Reply editor - Canvas reply area selectors
  const replySelectors = [
    'textarea[aria-label*="Reply" i]',
    'textarea[name*="reply" i]',
    'div[aria-label*="Reply" i]',
    ".discussion-reply textarea",
    "#discussion_topic_reply textarea",
    'textarea[placeholder*="reply" i]'
  ];

  let replyBox = null;
  for (const selector of replySelectors) {
    replyBox = doc.querySelector(selector);
    if (replyBox) break;
  }

  // Also check for rich text editors
  if (!replyBox) {
    const richEditors = doc.querySelectorAll('[contenteditable="true"]');
    for (const editor of richEditors) {
      const container = editor.closest('[data-testid*="reply"], [class*="reply"], [id*="reply"]');
      if (container) {
        replyBox = editor;
        break;
      }
    }
  }

  // Submit button
  const submitButton = findButtonByText(["post reply", "reply", "submit", "save", "post"]);

  return {
    lms: "canvas",
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

async function extractSubmission(doc, url) {
  // Assignment title and instructions
  const titleSelectors = [
    "h1",
    ".assignment-title",
    "[data-testid='assignment-name']",
    ".page-title",
    ".assignment_title"
  ];

  let title = "";
  for (const selector of titleSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      title = textFrom(el);
      if (title) break;
    }
  }

  const instructionSelectors = [
    ".assignment-description .user_content",
    ".description.user_content",
    "[data-testid='assignment-description']",
    ".assignment_description",
    ".instructions"
  ];

  let instructions = "";
  for (const selector of instructionSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      instructions = textFrom(el);
      if (instructions) break;
    }
  }

  const prompt = [title, instructions].filter(Boolean).join("\\n\\n");

  // Student submission content
  const submissionSelectors = [
    ".submission-details .user_content",
    ".submission-content",
    "[data-testid='submission-content']",
    ".submission_details .user_content",
    ".submission_text",
    ".student_submission"
  ];

  let studentText = "";
  for (const selector of submissionSelectors) {
    const el = doc.querySelector(selector);
    if (el) {
      studentText = textFrom(el);
      if (studentText) break;
    }
  }

  // If no submission text, try selected text
  if (!studentText) {
    studentText = window.getSelection()?.toString().trim() || "";
  }

  // File links
  const fileSelectors = [
    'a[href*="files"]',
    'a[href*="download"]',
    '.submission_attachment a',
    '.attachments a',
    '[data-testid="attachment"] a'
  ];

  const files = [];
  for (const selector of fileSelectors) {
    const links = doc.querySelectorAll(selector);
    for (const link of Array.from(links).slice(0, 5)) {
      const href = link.href;
      if (href && href.includes('download') || href.includes('files')) {
        files.push({
          name: (link.textContent || "submission-file").trim(),
          url: href
        });
      }
    }
    if (files.length) break;
  }

  // Grade input - multiple strategies
  const gradeSelectors = [
    'input[aria-label*="Grade" i]',
    'input[name*="grade" i]',
    'input[id*="grade" i]',
    '.grading_value input',
    '#grading-box input[type="number"]',
    '#grade input'
  ];

  let gradeInput = null;
  for (const selector of gradeSelectors) {
    gradeInput = doc.querySelector(selector);
    if (gradeInput) break;
  }

  // Feedback box - multiple strategies
  let feedbackBox = null;

  // Try by label first
  feedbackBox = queryByLabelText("Comment") || queryByLabelText("Feedback");

  if (!feedbackBox) {
    feedbackBox = findTextareaNearText("Comment") || findTextareaNearText("Feedback");
  }

  // Fallback selectors
  if (!feedbackBox) {
    const feedbackSelectors = [
      'textarea[aria-label*="Comment" i]',
      'textarea[name*="comment" i]',
      'textarea[id*="comment" i]',
      'textarea[aria-label*="Feedback" i]',
      '.comment_textarea textarea',
      '#speedgrader_comment_textarea',
      '.grading_comment textarea'
    ];

    for (const selector of feedbackSelectors) {
      feedbackBox = doc.querySelector(selector);
      if (feedbackBox) break;
    }
  }

  // Submit button
  const submitButton = findButtonByText(["save", "submit", "update", "post", "save comment"]);

  return {
    lms: "canvas",
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

async function applyTextToTarget(target, value) {
  const el = target;

  if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
    el.value = value;

    // Dispatch events for React/Vue
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

  // contenteditable
  if (el.isContentEditable) {
    el.textContent = value;
    el.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    return;
  }

  // fallback: try find textarea inside
  const inner = el.querySelector("textarea, input");
  if (inner) {
    inner.value = value;
    inner.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    inner.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  }
}

export const canvasAdapter = {
  id: "canvas",

  matches: (url, doc) => {
    return url.includes("instructure.com") ||
      url.includes("canvas.") ||
      doc.querySelector('meta[name="generator"][content*="Canvas"]') !== null ||
      !!doc.querySelector("#application[class*='canvas']");
  },

  detectPageType: (doc) => detectKind(doc),

  extract: async (doc, url) => {
    const kind = detectKind(doc);
    if (kind === "discussion") return extractDiscussion(doc, url);
    return extractSubmission(doc, url);
  },

  applyFeedback: async (target, text) => {
    await applyTextToTarget(target, text);
  },

  applyGrade: async (target, score) => {
    target.value = String(score);
    target.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    target.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  },

  submit: async (button) => {
    button.click?.();
  },

  // Helper methods
  findButtonByText,
  queryByLabelText,
  findTextareaNearText: (text) => findTextareaNearText(text)
};
