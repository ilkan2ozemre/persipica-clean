const reveals = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && reveals.length) {
  let delayStack = [];
  let delayTimer = null;

  const processStack = () => {
    delayStack.forEach((el, index) => {
      el.style.transitionDelay = `${index * 100}ms`;
      el.classList.add("on");
      // Reset delay after animation finishes so it doesn't affect subsequent interactions
      setTimeout(() => {
        el.style.transitionDelay = "";
      }, 1000);
    });
    delayStack = [];
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          delayStack.push(entry.target);
          observer.unobserve(entry.target);
          
          clearTimeout(delayTimer);
          delayTimer = setTimeout(processStack, 50);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
  );

  reveals.forEach((node) => observer.observe(node));
} else {
  reveals.forEach((node) => node.classList.add("on"));
}

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");

if (hamburger && navLinks) {
  const closeMenu = () => {
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("open");
  };

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
      closeMenu();
    }
  });
}
