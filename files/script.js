const header = document.querySelector("header");
const showcase = document.querySelector(".showcase");

const showcaseObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      header.classList.remove("header-transparant");
    } else {
      header.classList.add("header-transparant");
    }
  });
}, { threshold: 0.5 });

showcaseObserver.observe(showcase);
