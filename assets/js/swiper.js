
function unify(e) { return e.changedTouches ? e.changedTouches[0] : e };

document.querySelectorAll('.swiper').forEach(swiper => {
  if (!swiper.style.getPropertyValue('--i')) {
    swiper.style.setProperty('--i', 0);
  }

  const swiperFor = document.querySelector(swiper.getAttribute('swiper-for'));
  if (swiperFor) {
    if (swiperFor.children.length === 0) {
      const nav = '<label></label>'.repeat(swiper.style.getPropertyValue('--n'));
      swiperFor.insertAdjacentHTML('beforeend', nav);
    }
    [...swiperFor.children].forEach((e, i) => {
      e.addEventListener('click', e => {
        swiper.style.setProperty('--i', i);
        [...swiperFor.children].forEach(e => e.classList.remove('active'));
        swiperFor.children[i]?.classList?.add('active');
      });
    });
    swiperFor.children[swiper.style.getPropertyValue('--i')]?.classList.add('active');
  }

  swiper.addEventListener('mousedown', lock, false);
  swiper.addEventListener('touchstart', lock, false);
  swiper.addEventListener('mouseup', move, false);
  swiper.addEventListener('touchend', move, false);

  let x0 = null;
  function lock(e) {
    x0 = unify(e).clientX
  };
  function move(e) {
    if(x0 !== null) {
      const dir = Math.sign(unify(e).clientX - x0);
      const target = swiper.style.getPropertyValue('--i') - dir;
      if(target >= 0 && target < swiper.style.getPropertyValue('--n')) {
        swiper.style.setProperty('--i', target);

        if (swiperFor) {
          const controls = [...swiperFor.children];
          controls.forEach(e => e.classList.remove('active'));
          controls[target]?.classList?.add('active');
        }
      }
      x0 = null
    }
  };
})
