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
