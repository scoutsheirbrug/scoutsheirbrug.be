let currentPage = 0
let pages = [];

const viewer = document.querySelector('.pdf-viewer[data-pdf]');

/* Read document */
(async () => {
  try {
    const loadingTask = pdfjsLib.getDocument(viewer.getAttribute('data-pdf'));
    const pdf = await loadingTask.promise;
    pages = await Promise.all([...Array(pdf.numPages).keys()].map(i => pdf.getPage(i+1)));
    updatePage()
  } catch (e) {
    pages = []
    viewer.classList.add('failed')
    viewer.querySelector('embed').setAttribute('src', viewer.getAttribute('data-pdf'))
  }
})();

/* Page controls */
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
  const canvas = viewer.querySelector('canvas');
  const canvasContext = canvas.getContext("2d");
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext, viewport });
}

document.querySelector('.pdf-enlarge').addEventListener('click', () => {
  document.body.classList.toggle('pdf-enlarged')
})

document.querySelector('.pdf-external').addEventListener('click', () => {
  location.href = viewer.getAttribute('data-pdf')
})
