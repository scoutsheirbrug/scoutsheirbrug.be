const header = document.querySelector("header");
const showcase = document.querySelector(".showcase");

const showcaseObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}, { rootMargin: '-150px 0px 0px 0px' });

showcaseObserver.observe(showcase);
