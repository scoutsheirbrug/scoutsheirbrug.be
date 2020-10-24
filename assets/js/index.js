
/* Header */
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

/* Groepsadmin */
function updateGroepsadminNav() {
  const match = location.hash.match(/individuele-steekkaart(?:-(\d))?/);
  if (match !== null) {
    const groepsadmin = document.querySelector('.groepsadmin');
    // Scroll
    const y = groepsadmin.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({behavior: 'smooth', top: y - 65})
    // Update navigation
    const step = (match[1] ?? 1) - 1
    const nav = [...groepsadmin.querySelector('.container nav').children];
    nav.forEach(e => e.classList.remove('active'));
    nav[step].classList.add('active');
    // Update slideshow
    groepsadmin.querySelector('.steps').style.setProperty('--i', step)
  }
}

window.onpopstate = () => {
  updateGroepsadminNav();
};

updateGroepsadminNav();
