let currentPage = 0;
let pages = [];
let renderedPages = [];
let renderTasks = [];

const viewer = document.querySelector('.pdf-viewer[data-pdf]');

/* Read document */
(async () => {
  try {
    const loadingTask = pdfjsLib.getDocument(viewer.getAttribute('data-pdf'));
    const pdf = await loadingTask.promise;
    pages = await Promise.all([...Array(pdf.numPages).keys()].map(i => pdf.getPage(i+1)));
    updatePages();
    renderAllPages();
  } catch (e) {
    console.error('Failed to load PDF: ', e.message)
    pages = []
    viewer.classList.add('failed')
    viewer.querySelector('embed').setAttribute('src', viewer.getAttribute('data-pdf'))
  }
})();

/* Page controls */
document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => {
    let delta = parseInt(el.getAttribute('data-page'));
    visiblePages = numVisiblePages();
    delta *= visiblePages;
    const targetPage = Math.max(0, Math.min(pages.length - visiblePages, currentPage + delta));
    if (targetPage !== currentPage) {
      currentPage = targetPage;
      updatePages();
    }
  })
})

function updatePages() {
  renderPage(viewer.querySelector('.page-left'), currentPage, 0);
  renderPage(viewer.querySelector('.page-right'), currentPage + 1, 1);
}

function numVisiblePages() {
  if (document.body.classList.contains('pdf-enlarged')) {
    return 1;
  }
  return window.matchMedia('(max-aspect-ratio: 8/5)').matches ? 1 : 2;
}

async function renderPage(canvas, index, task) {
  const canvasContext = canvas.getContext("2d");
  if (renderedPages[index]) {
    canvasContext.putImageData(renderedPages[index], 0, 0);
    return;
  }
  const page = pages[index];
  if (!page) {
    canvasContext.fillStyle = 'white';
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const viewport = page.getViewport({ scale: 2 });
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  if (renderTasks[task]) {
    renderTasks[task].cancel();
  }
  const renderTask = page.render({ canvasContext, viewport });
  renderTasks[task] = renderTask;
  return renderTask.promise.then(() => {
    renderedPages[index] = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
  });
}

async function renderAllPages() {
  for (let i = 0; i < pages.length; i += 1) {
    await renderPage(viewer.querySelector('.page-hidden'), i, 2);
  }
}

document.querySelector('.pdf-enlarge').addEventListener('click', () => {
  document.body.classList.toggle('pdf-enlarged')
})

document.querySelector('.pdf-external').addEventListener('click', () => {
  location.href = viewer.getAttribute('data-pdf')
})
