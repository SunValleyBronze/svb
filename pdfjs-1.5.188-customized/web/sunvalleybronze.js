function executeSearch() {
  var re = /search=([^&]+)/
  var m = re.exec(window.location.hash)

  if (m != null) {
    var query = decodeURIComponent(m[1])
    PDFViewerApplication.findBar.open()
    PDFViewerApplication.findBar.findField.value = query
    PDFViewerApplication.findBar.findNextButton.click()
  }
}

document.addEventListener('pagesloaded', executeSearch, false)

function receiveSVBMessage(e) {

  if (e.data == 'svb:getPageNumber') {
    if (PDFViewerApplication && PDFViewerApplication.pdfViewer) {
      var page = PDFViewerApplication.pdfViewer.currentPageNumber
      window.top.postMessage('svb:getPageNumber:' + page, '*')
    }
    else {
      console.warn('PDFViewerApplication.pdfViewer is not available yet.')
    }
  }
}

window.addEventListener('message', receiveSVBMessage, false)

(function PrintOptionsOverlay() {

  var OVERLAY_NAME = 'printOptionsOverlay';

  var container = document.getElementById(OVERLAY_NAME);
  var okButton = document.getElementById('printOptionsOk');
  var cancelButton = document.getElementById('printOptionsCancel');

  okButton.addEventListener('click', function () {

    PDFViewerApplication.overlayManager.close(OVERLAY_NAME);
  });
  
  cancelButton.addEventListener('click', function () {
    PDFViewerApplication.overlayManager.close(OVERLAY_NAME);
  });

  PDFViewerApplication.overlayManager.register(OVERLAY_NAME, container);

})();
