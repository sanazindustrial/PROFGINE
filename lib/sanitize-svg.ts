/**
 * SVG Sanitizer — strips dangerous elements/attributes from AI-generated SVG
 * Prevents XSS via dangerouslySetInnerHTML with untrusted SVG content.
 */

const ALLOWED_SVG_ELEMENTS = new Set([
    "svg", "g", "path", "circle", "ellipse", "line", "polyline", "polygon",
    "rect", "text", "tspan", "defs", "clippath", "lineargradient",
    "radialgradient", "stop", "use", "symbol", "marker", "pattern",
    "mask", "filter", "fegaussianblur", "feoffset", "feblend",
    "fecolormatrix", "fecomposite", "feflood", "femerge", "femergenode",
    "femorphology", "feturbulence", "title", "desc",
])

const DANGEROUS_ATTRIBUTES = new Set([
    "onload", "onerror", "onclick", "onmouseover", "onmouseout", "onmouseenter",
    "onmouseleave", "onmousedown", "onmouseup", "onmousemove", "onfocus",
    "onblur", "onkeydown", "onkeyup", "onkeypress", "onsubmit", "onreset",
    "onchange", "oninput", "onscroll", "onresize", "onabort", "onanimationend",
    "onanimationstart", "oncontextmenu", "ondblclick", "ondrag", "ondrop",
    "ontouchstart", "ontouchend", "ontouchmove",
])

const DANGEROUS_URI_PATTERN = /^\s*(javascript|data|vbscript)\s*:/i

export function sanitizeSVG(svgString: string): string {
    if (!svgString || typeof svgString !== "string") return ""

    // Parse using regex-based approach (no DOM in server/edge context)
    // Remove <script> tags and their content entirely
    let cleaned = svgString.replace(/<script[\s>][\s\S]*?<\/script>/gi, "")

    // Remove <foreignObject> (can embed arbitrary HTML)
    cleaned = cleaned.replace(/<foreignObject[\s>][\s\S]*?<\/foreignObject>/gi, "")

    // Remove <iframe>, <object>, <embed>, <applet>, <form>, <input>, <button>
    cleaned = cleaned.replace(/<(iframe|object|embed|applet|form|input|button|textarea|select|link|meta|style|base)\b[\s\S]*?(?:\/>|<\/\1>)/gi, "")

    // Remove event handler attributes (on*)
    cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")

    // Remove javascript: / data: / vbscript: URIs in href and xlink:href
    cleaned = cleaned.replace(
        /(href|xlink:href)\s*=\s*(?:"[^"]*(?:javascript|data|vbscript)\s*:[^"]*"|'[^']*(?:javascript|data|vbscript)\s*:[^']*')/gi,
        ""
    )

    // Remove <set> and <animate> that could change href to javascript:
    cleaned = cleaned.replace(/<(set|animate)\b[^>]*attributeName\s*=\s*["'](?:href|xlink:href)["'][^>]*\/?>/gi, "")

    return cleaned
}
