// LMS Adapter Index for Professor GENIE
import {
  ExtractedPayload,
  LMSId
} from "../types.js";
import {
  canvasAdapter
} from "./adapters/canvas.js";
import {
  moodleAdapter
} from "./adapters/moodle.js";
import {
  d2lAdapter
} from "./adapters/d2l.js";
import {
  blackboardAdapter
} from "./adapters/blackboard.js";
import {
  genericAdapter
} from "./adapters/generic.js";

const adapters = [canvasAdapter, moodleAdapter, d2lAdapter, blackboardAdapter, genericAdapter];

export function getAdapter(url, doc) {
  return adapters.find((a) => a.matches(url, doc)) ?? genericAdapter;
}

export async function extractFromPage() {
  const url = location.href;
  const adapter = getAdapter(url, document);
  const kind = adapter.detectPageType(document);

  if (kind === "unknown") return null;
  return adapter.extract(document, url);
}
