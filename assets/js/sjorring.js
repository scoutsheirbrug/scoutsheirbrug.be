const canvas = document.querySelector('canvas[data-pdf]');
const loadingTask = pdfjsLib.getDocument(canvas.getAttribute('data-pdf'));
(async () => {
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({scale: 1});
  console.log(page, viewport)

  // Apply page dimensions to the <canvas> element.
  const context = canvas.getContext("2d");
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  // Render the page into the <canvas> element.
  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  await page.render(renderContext);
  console.log("Page rendered!");
})();
