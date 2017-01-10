/** Customized PDF viewer for printing and downloading single pages. **/

(function () {

  /** Gets any URL parameters. **/
  function getUrlParams() {
    var result = {};
    var params = (window.location.search.split('?')[1] || '').split('&');
    for (var param in params) {
      if (params.hasOwnProperty(param)) {
        paramParts = params[param].split('=');
        result[paramParts[0]] = decodeURIComponent(paramParts[1] || "");
      }
    }
    return result;
  }

  /** Gets a page from a PDF. */
  function getPage(page, pdf) {
    return pdf.getPage(page)
  }

  /** Renders the PDF. **/
  function renderPage(page) {

    var viewport = page.getViewport(2.0);
    var canvas = document.getElementById('pdf-canvas');
    var context = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    var renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    return page.render(renderContext);
  }

  /** Main load sequence. **/
  var params = getUrlParams();

  if (!params.path || !params.page || !params.action) {
    alert('The "path", "action", and "page" url parameters must be provided.');
    return;
  }

  params.page = parseInt(params.page);

  PDFJS.workerSrc = '../build/pdf.worker.js';
  PDFJS.cMapUrl = '../web/cmaps/';
  PDFJS.cMapPacked = true;

  console.log('Loading "' + params.path + '".');
  PDFJS.getDocument(params.path)
  .then(getPage.bind(window, params.page))
  .then(renderPage);

  var title = PDFJS.getFilenameFromUrl(params.path) || params.path;
  try {
    title = decodeURIComponent(title);
  } catch (e) {
    // decodeURIComponent may throw URIError,
    // fall back to using the unprocessed url in that case
  }
  document.title = title;
  
})();