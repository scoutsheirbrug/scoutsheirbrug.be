const header = document.querySelector("header");
const showcase = document.querySelector(".showcase");

const showcaseOptions = {
  rootMargin: "-150px 0px 0px 0px",
};

const showcaseObserver = new IntersectionObserver(function (
  entries,
  showcaseObserver
) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      header.classList.remove("header-transparant");
    } else {
      header.classList.add("header-transparant");
    }
  });
},
showcaseOptions);

showcaseObserver.observe(showcase);
