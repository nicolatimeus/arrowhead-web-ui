var idleUi = document.getElementById('idle-pane')
var chargingUi = document.getElementById('charging-pane')
var faultDialog = document.getElementById('fault-dialog')

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

var showFaultDialog = function () {
  faultDialog.classList.remove('hidden')
}

var hideFaultDialog = function () {
  faultDialog.classList.add('hidden')
}

var cloudClient = new CloudClient(arrowheadConfig.cloudBaseUri, arrowheadConfig.cloudCredentials)
var bindings = new MetricBinding(cloudClient, dataTopicName, ['Recharge_In_Progress'])

bindings.addUpdateListener(function () {
  var isRechargeInProgress = bindings.metrics['Recharge_In_Progress']
  if (bindings.metrics['Recharge_In_Progress'] === '1') {
    showChargingUi()
  }
  else {
    showIdleUi()
  }
  if (bindings.messageIsNew) {
    var powerPV = bindings.metrics['Power_PV']
    if (powerPV) {
      plot.push(bindings.timestamp, powerPV)
      plot.update()
    }
  }
  if (bindings.metrics['Fault_Flag'] === '1') {
    showFaultDialog()
  } else {
    hideFaultDialog()
  }
})

var modalityLogic;

var control = new ArrowheadControl(controlTopicName, cloudClient)

if (arrowheadConfig.modality === 't3.1.2') {
  modalityLogic = new ArrowheadModalityT312Logic(control)
}

/* setInterval(function () {
  var d = new Date()
plot.push(d, 100 + 10*Math.sin(2*Math.PI*(d.getTime())/30/1000))
plot.update()
}, 100) */

bindings.update()
bindings.updatePeriodically(arrowheadConfig.statusPollPeriodMs)
