var configureUiForModality = function (modality) {
  var elements = document.querySelectorAll('[data-modality]')
  element.forEach(function (element) {
    if (element.getAttribute('data-modality') !== modality)
      element.style.display = 'none'
  })
}
