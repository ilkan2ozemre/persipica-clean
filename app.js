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
