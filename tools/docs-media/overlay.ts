// Injected into every page: a visible cursor, a highlight ring and a caption bar, drawn into the
// page itself so the recording needs no editing step. `window.__docs` controls them.
export function installOverlay() {
  const css = `
    #__docs-cursor{position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transform:translate(-3px,-2px);transition:transform 40ms linear}
    #__docs-cursor svg{filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
    #__docs-cursor.down svg{transform:scale(.85)}
    #__docs-ring{position:fixed;z-index:2147483646;pointer-events:none;border:1.5px solid rgba(17,17,20,.28);border-radius:10px;opacity:0;transition:opacity 180ms ease,left 220ms ease,top 220ms ease,width 220ms ease,height 220ms ease}
    #__docs-caption{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483646;pointer-events:none;max-width:78%;padding:12px 22px;border-radius:14px;background:rgba(17,17,20,.88);color:#fff;font:500 19px/1.4 Inter,ui-sans-serif,system-ui,sans-serif;text-align:center;opacity:0;transition:opacity 200ms ease}
    html.__docs-hidden #__docs-cursor,html.__docs-hidden #__docs-ring,html.__docs-hidden #__docs-caption{display:none!important}`;
  const mount = () => {
    if (document.getElementById("__docs-cursor")) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    const cursor = document.createElement("div");
    cursor.id = "__docs-cursor";
    cursor.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.6-3.6 6.9z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    const ring = document.createElement("div");
    ring.id = "__docs-ring";
    const caption = document.createElement("div");
    caption.id = "__docs-caption";
    document.body.append(cursor, ring, caption);
    window.addEventListener("mousemove", (e) => (cursor.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 2}px)`), true);
    window.addEventListener("mousedown", () => cursor.classList.add("down"), true);
    window.addEventListener("mouseup", () => cursor.classList.remove("down"), true);
  };
  (window as any).__docs = {
    caption(text: string) {
      mount();
      const el = document.getElementById("__docs-caption")!;
      el.textContent = text;
      el.style.opacity = text ? "1" : "0";
    },
    ring(r: { x: number; y: number; width: number; height: number } | null) {
      mount();
      const el = document.getElementById("__docs-ring")!;
      if (!r) return void (el.style.opacity = "0");
      const pad = 4;
      Object.assign(el.style, { left: `${r.x - pad}px`, top: `${r.y - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px`, opacity: "1" });
    },
    hidden(on: boolean) {
      document.documentElement.classList.toggle("__docs-hidden", on);
    },
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
}
