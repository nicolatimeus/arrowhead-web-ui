webshim.polyfill('forms-ext')

var idleUi = document.getElementById('idle-pane')
var chargingUi = document.getElementById('charging-pane')
var faultDialog = document.getElementById('fault-dialog')
var currentDate = document.getElementById('current-date')
var offlineMessage = document.getElementById('charging-station-down-message')
var fullscreenButton = document.getElementById('fullscreen-button')

var lastMessageDate = null
var isFullscreen = false

fullscreenButton.onclick = function () {
  if (!document.mozFullScreenElement) {
    document.documentElement.mozRequestFullScreen()
  } else {
    document.mozCancelFullScreen()
  }
}

var statusDialog = document.getElementById('status-dialog')
statusDialogHideButton = document.getElementById('status-dialog-cancel-button')


statusDialogHideButton.onclick = function () {
  statusDialog.setAttribute('data-status', 'idle')
}

var configureUiForModality = function (modality) {
  var elements = document.querySelectorAll('[data-modality]')

  for (var i=0; i<elements.length; i++) {
    var element = elements[i]
    var modalities = (element.getAttribute('data-modality') || '').split(',')

    if (modalities.length && modalities[0] == '') modalities = []

    if (!modalities.length) continue
    var hide = true

    modalities.forEach(function (desiredModality) {
      if (desiredModality === modality)
        hide = false
    })

    if (hide)
      element.style.display = 'none'

  }

  var link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('type', 'text/css')
  link.setAttribute('href', 'arrowhead-modality-' + modality + '.css')

  console.log(link)

  document.getElementsByTagName('head')[0].appendChild(link)

}

configureUiForModality(arrowheadConfig.modality)

var baseTopic = arrowheadConfig.cloudCredentials.userName + '/'
                        + arrowheadConfig.targetDevice + '/'
                        + arrowheadConfig.appName

var controlTopicName = baseTopic + '/control'
var dataTopicName = baseTopic

if (arrowheadConfig.modality === 't3.1.1')
  dataTopicName += '/privatecsdata'
else if (arrowheadConfig.modality == 't3.1.2')
  dataTopicName += '/publiccsdata'
else if (arrowheadConfig.modality == 't3.2')
  dataTopicName += '/chargeonthego'
else
  throw new Error('invalid modality')

var showIdleUi = function() {
  chargingUi.classList.remove('current')
  idleUi.classList.add('current')
}

var showChargingUi = function() {
  chargingUi.classList.add('current')
  idleUi.classList.remove('current')
}

var showFaultDialog = function () {
  faultDialog.classList.remove('hidden')
}

var hideFaultDialog = function () {
  faultDialog.classList.add('hidden')
}

var cloudClient = new CloudClient(arrowheadConfig.cloudBaseUri, arrowheadConfig.cloudCredentials)
var bindings = new MetricBinding(cloudClient, dataTopicName, ['Recharge_In_Progress', 'Fault_String', 'Recharge_Control_Status', 'Fault_Flag'])

var plot

var plotSettings

var initPlot = function () {
  if (arrowheadConfig.modality === 't3.1.1') {
    plotSettings = arrowheadConfig.t311GraphSettings
  } else {
    plotSettings = arrowheadConfig.t312GraphSettings
  }

  if (!plotSettings.graphEnabled) {
    var plotDiv = document.getElementById('time-series-plot')
    plotDiv.parentNode.removeChild(plotDiv)
    return
  }


  if (arrowheadConfig.graphBackend === 'canvas') {
    plot = new CanvasPlot('time-series-plot', plotSettings.xLabel, plotSettings.yLabel, plotSettings.title)
  } else {
    plot = new Plot('time-series-plot', plotSettings.xLabel, plotSettings.yLabel, plotSettings.title)
  }
}

var updatePlot = function() {
  var plottedMetric = bindings.metrics[plotSettings.metric]
  if (plottedMetric) {
    plot.push(bindings.timestamp, plottedMetric)
    plot.update()
  }
}

var interval = setInterval( function () {
  initPlot()

  bindings.addUpdateListener(chargeControl)
  clearInterval(interval)
})

var onlineCheckTimer

var setOnlineCheckEnabled = function (enabled) {
  if (!enabled) {
    offlineMessage.style.display = 'none'
    if (onlineCheckTimer) {
      window.clearInterval(onlineCheckTimer)
      onlineCheckTimer = null
    }
    return
  }

  offlineMessage.style.display = 'flex'
  onlineCheckTimer = setInterval(function () {
    if (!bindings.messageIsNew) {
      offlineMessage.style.display = 'flex'
    } else {
      offlineMessage.style.display = 'none'
    }
  }, 5000)
}

var modalityLogic;

var subscribeToStationTopic = function () {
  bindings.update()
  bindings.updatePeriodically(arrowheadConfig.statusPollPeriodMs)
}

if (arrowheadConfig.modality === 't3.1.2') {
  var control = new ArrowheadControl(controlTopicName, cloudClient)
  modalityLogic = new ArrowheadModalityT312Logic(control)
} else if (arrowheadConfig.modality === 't3.1.1') {
  var control = new ArrowheadControl(controlTopicName, cloudClient)
  modalityLogic = new ArrowheadModalityT311Logic(control)
}

var dateTime = setInterval(function () {
  currentDate.textContent = new Date().toLocaleString()
}, 1000)
