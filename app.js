// Mobile menu: the toggle opens and closes the navigation; Escape or a click outside closes it.
const nav = document.querySelector(".site-nav");
const toggle = nav && nav.querySelector(".nav-toggle");

if (nav && toggle) {
  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target)) setOpen(false);
  });
}

// Motion: the header gains a shadow once the page scrolls, and sections below the fold rise in as
// they reach the viewport. Elements already on screen are left alone, so nothing flashes, and
// nothing is hidden without JavaScript. Skipped when the visitor prefers reduced motion.
if (nav) {
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 4);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

const REVEAL = [
  ".section-head",
  ".section > .container > h2",
  ".section .container > .actions",
  ".feature-copy",
  ".shot",
  ".cols > *",
  ".plans > .plan",
  ".plan-free",
  ".table-wrap",
  ".faq details",
  ".surfaces li",
  ".cta .container > *",
].join(", ");

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        observer.unobserve(node);
        node.classList.add("is-in");
        // Hand the element back to its own transitions (hover lifts) once it has arrived.
        const delay = Number(node.style.getPropertyValue("--i") || 0) * 70;
        setTimeout(() => {
          node.classList.remove("reveal", "is-in");
          node.style.removeProperty("--i");
        }, 750 + delay);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );

  const perParent = new Map();
  document.querySelectorAll(REVEAL).forEach((node) => {
    if (node.closest(".hero, .page-head")) return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;
    const index = perParent.get(node.parentElement) || 0;
    perParent.set(node.parentElement, index + 1);
    node.style.setProperty("--i", String(Math.min(index, 6)));
    node.classList.add("reveal");
    observer.observe(node);
  });
}
