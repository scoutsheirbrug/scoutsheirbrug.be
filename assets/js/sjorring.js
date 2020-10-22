let currentPage = 0
let pages = [];

const canvas = document.querySelector('canvas[data-pdf]');
const loadingTask = pdfjsLib.getDocument(canvas.getAttribute('data-pdf'));

/* Read document */
(async () => {
  const pdf = await loadingTask.promise;
  pages = await Promise.all([...Array(pdf.numPages).keys()].map(i => pdf.getPage(i+1)));
  updatePage()
})();

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => {
    const targetPage = currentPage + parseInt(el.getAttribute('data-page'))
    if (targetPage >= 0 && targetPage < pages.length) {
      currentPage = targetPage;
      updatePage()
    }
  })
})

async function updatePage() {
  const page = pages[currentPage];
  const viewport = page.getViewport({ scale: 2 });
  const canvasContext = canvas.getContext("2d");
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext, viewport });
}
