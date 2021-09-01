
/* Header */
const header = document.querySelector("header");
const showcase = document.querySelector(".showcase");
const scrollIcon = document.querySelector(".scroll-icon");

const scroller = (el) => (entries) => {
  entries.forEach((entry) => {
    el.classList.toggle('scrolled', !entry.isIntersecting)
  });
}

new IntersectionObserver(scroller(header), { rootMargin: '-150px 0px 0px 0px' }).observe(showcase);
new IntersectionObserver(scroller(scrollIcon), { threshold: 0.9 }).observe(showcase);

/* Groepsadmin */
function updateGroepsadminNav() {
  const match = location.hash.match(/individuele-steekkaart(?:-(\d))?/);
  if (match !== null) {
    const groepsadmin = document.querySelector('.groepsadmin');
    // Scroll
    const y = groepsadmin.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo({behavior: 'smooth', top: y - 65})
    setTimeout(() => {
      const y2 = groepsadmin.getBoundingClientRect().top + window.pageYOffset;
      if (y2 !== y) {
        window.scrollTo({behavior: 'smooth', top: y2 - 65})
      }
    }, 200)
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
