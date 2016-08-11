var MetricBinding = function (cloudClient, topic, additionalMetrics) {
  this.cloudClient = cloudClient
  this.metrics = {}
  this.elements = {}
  this.listeners = []
  this.topic = topic
  var self = this
  if (additionalMetrics)
    additionalMetrics.forEach(function (metric) {
      self.metrics[metric] = true
    })
  this.detectElements()
}

MetricBinding.prototype.addUpdateListener = function (listener) {
  this.listeners = this.listeners.concat([listener])
}

MetricBinding.prototype.detectElements = function () {
  var elementList = document.querySelectorAll('[data-metric]');
  var self = this
  console.log(self.elements)
  for (var i=0; i<elementList.length; i++) {
    var elm = elementList[i]
    var metricName = elm.getAttribute('data-metric')
    var elementModality = elm.getAttribute('data-modality')
    if (elementModality && elementModality !== arrowheadConfig.modality)
      continue
    self.metrics[metricName] = true
    if (self.elements[metricName])
      (self.elements[metricName])[self.elements[metricName].length] = elm
    else
      self.elements[metricName] = [elm]
  }
}

MetricBinding.prototype.update = function() {
  var self = this
  this.cloudClient.getLastMessageMetrics(this.topic, arrowheadConfig.targetDevice, function (metrics, timestamp) {

    if (!metrics)
      return

    metrics.forEach(function (receivedMetric) {
      var metric = receivedMetric.name
      var value = receivedMetric.value

      self.metrics[metric] = value

      if (self.elements[metric])
        self.elements[metric].forEach(function (elm) {
        elm.textContent = (arrowheadConfig.metricNamesDebug) ? ('{' + metric + ': ' + value + '}') : (''+value)
      })
    })

    if (timestamp && isFinite(timestamp) && timestamp !== self.timestamp) {
      self.timestamp = timestamp
      self.messageIsNew = true
    } else {
      self.messageIsNew = false
    }

    self.listeners.forEach(function (listener) {
      listener()
    })
})
}

MetricBinding.prototype.updatePeriodically = function(periodMs) {
  this.stopUpdates();
  var self = this;
  this.timer = setInterval(function () {
    self.update()
  }, periodMs)
}

MetricBinding.prototype.stopUpdates = function () {
  if (this.timer)
    clearInterval(this.timer)
}

MetricBinding.prototype.updateUi = function () {
  var self = this
  for (var metric in this.metrics) {
    var elms = this.elements[metric]
    if (!elms) continue
    elms.forEach(function (element) {
      element.innerHTML = self.metrics[metric]
    })
  }
}
