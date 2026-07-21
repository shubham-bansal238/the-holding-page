// Integration shim: html2canvas (used by html2pdf.js in each per-company
// pdfGenerator*.ts) crashes on Tailwind v4's oklch() colors. It renders by
// creating an iframe clone of the document, which re-fetches every
// <link rel="stylesheet">, so runtime CSSOM mutations do NOT propagate.
//
// Fix: fetch each linked stylesheet, rewrite oklch(...) literals to sRGB
// equivalents (computed by the browser), and swap the <link> for an inline
// <style> that carries the sanitized CSS. The clone iframe inherits the
// inline <style> and never sees oklch. Restore on completion.

type Restore = () => Promise<void> | void;

const OKLCH_RE = /oklch\([^)]*\)/gi;

function toSrgb(value: string, probe: HTMLSpanElement): string {
  probe.style.color = "";
  probe.style.color = value;
  if (!probe.style.color) return "rgb(0, 0, 0)";
  const rgb = getComputedStyle(probe).color;
  return rgb || "rgb(0, 0, 0)";
}

function sanitizeCss(css: string, probe: HTMLSpanElement): string {
  return css.replace(OKLCH_RE, (m) => toSrgb(m, probe));
}

export async function neutraliseOklchColors(): Promise<Restore> {
  if (typeof document === "undefined") return () => {};

  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);

  const swaps: Array<{ link: HTMLLinkElement; style: HTMLStyleElement; parent: Node; next: Node | null }> = [];

  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  await Promise.all(
    links.map(async (link) => {
      try {
        const res = await fetch(link.href, { credentials: "include" });
        if (!res.ok) return;
        const css = await res.text();
        if (!css.includes("oklch")) return;
        const sanitized = sanitizeCss(css, probe);
        const style = document.createElement("style");
        style.setAttribute("data-oklch-shim", "1");
        style.textContent = sanitized;
        const parent = link.parentNode;
        if (!parent) return;
        const next = link.nextSibling;
        parent.insertBefore(style, link);
        parent.removeChild(link);
        swaps.push({ link, style, parent, next });
      } catch {
        /* ignore */
      }
    }),
  );

  // Also sanitize inline <style> elements that already exist.
  const inlineRestores: Array<[HTMLStyleElement, string]> = [];
  for (const styleEl of Array.from(document.querySelectorAll("style"))) {
    if (styleEl.getAttribute("data-oklch-shim")) continue;
    const text = styleEl.textContent || "";
    if (!text.includes("oklch")) continue;
    inlineRestores.push([styleEl, text]);
    styleEl.textContent = sanitizeCss(text, probe);
  }

  probe.remove();

  return () => {
    for (const s of swaps) {
      if (s.next && s.next.parentNode === s.parent) s.parent.insertBefore(s.link, s.next);
      else s.parent.appendChild(s.link);
      if (s.style.parentNode === s.parent) s.parent.removeChild(s.style);
    }
    for (const [el, text] of inlineRestores) {
      el.textContent = text;
    }
  };
}
