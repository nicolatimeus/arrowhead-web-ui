var idleUi = document.getElementById('idle-pane')
var chargingUi = document.getElementById('charging-pane')
var busyMessage = document.getElementById('cs-busy-message')
var idleMessage = document.getElementById('cs-idle-message')

var plot = new Plot('time-series-plot', 'Time', 'PV Power (W)', 'PV Power')

var configureUiForModality = function (modality) {
  var elements = document.querySelectorAll('[data-modality]')
  elements.forEach(function (element) {
    if (element.getAttribute('data-modality') !== modality)
      element.style.display = 'none'
  })
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

var cloudClient = new CloudClient(arrowheadConfig.cloudBaseUri, arrowheadConfig.cloudCredentials)
var bindings = new MetricBinding(cloudClient, dataTopicName, ['Recharge_In_Progress'])

bindings.addUpdateListener(function () {
  var isRechargeInProgress = bindings.metrics['Recharge_In_Progress']
  if (bindings.metrics['Recharge_In_Progress'] === '1') {
    busyMessage.style.display = 'inline'
    idleMessage.style.display = 'none'
    showChargingUi()
  }
  else {
    busyMessage.style.display = 'none'
    idleMessage.style.display = 'inline'
    showIdleUi()
  }
  if (bindings.messageIsNew) {
    var powerPV = bindings.metrics['Power_PV']
    if (powerPV) {
      plot.push(bindings.timestamp, powerPV)
      plot.update()
    }
  }
})

var modalityLogic;

var control = new ArrowheadControl(controlTopicName, cloudClient)

if (arrowheadConfig.modality === 't3.1.2') {
  modalityLogic = new ArrowheadModalityT312Logic(control)
}

bindings.update()
bindings.updatePeriodically(arrowheadConfig.statusPollPeriodMs)
