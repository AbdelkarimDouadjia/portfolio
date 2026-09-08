(function () {
    "use strict";
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");

    function navigate(hash, updateHistory) {
        let id;
        try { id = decodeURIComponent(hash.slice(1)); } catch { return false; }
        const target = document.getElementById(id);
        if (!target) return false;
        // Layout offsets exclude the legacy smooth-scroller's interpolated transform.
        let top = 0;
        for (let node = target; node; node = node.offsetParent) top += node.offsetTop;
        if (id === "t") top = 0;
        else if (id === "skills" && !reduced.matches) top += Math.max(0, target.offsetHeight - innerHeight) * .85;
        else top -= 108;
        const wrap = document.querySelector("[data-scroll]");
        if (wrap) wrap.scrollTop = 0;
        if (updateHistory && location.hash !== hash) history.pushState(null, "", hash);
        // The page already interpolates scrolling; avoid a second native smooth animation.
        window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
        target.querySelectorAll("[class^='s-'], [class^='p-']").forEach(el => el.classList.add("active"));
        if (updateHistory) {
            if (!target.hasAttribute("tabindex")) {
                target.tabIndex = -1;
                target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
            }
            target.focus({ preventScroll: true });
        }
        return true;
    }

    document.addEventListener("click", event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target.closest('a[href^="#"]');
        if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
        if (navigate(link.getAttribute("href"), true)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
    window.addEventListener("popstate", () => navigate(location.hash || "#t", false));
    window.addEventListener("hashchange", () => navigate(location.hash || "#t", false));
    window.addEventListener("load", () => {
        if (!location.hash) return;
        const loader = document.getElementById("loader");
        function restoreAnchor() {
            if (loader && getComputedStyle(loader).visibility !== "hidden") {
                requestAnimationFrame(restoreAnchor);
                return;
            }
            navigate(location.hash, false);
        }
        restoreAnchor();
    });
}());
