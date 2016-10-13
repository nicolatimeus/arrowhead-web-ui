var startRechargeTimeout
var rechargeCompletedTimeout
var stoppingRechargeTimeuot

var rechargeStartTime
var outputEnergy
var lastRechargeInProgress

var chargeTotalEnergySpan = document.getElementById('charge-total-energy')
var chargeTotalTimeSpan = document.getElementById('charge-total-time')

var rechargeTimeAboveOneMinute = document.getElementById('recharge-time-above-one-minute')
var rechargeTimeBelowOneMinute = document.getElementById('recharge-time-below-one-minute')

var RechargeState = {
  IDLE: 'IDLE',
  STARTING: 'STARTING',
  IN_PROGRESS: 'IN_PROGRESS',
  STOPPING: 'STOPPING',
  COMPLETED: 'COMPLETED'
}

var rechargeState = RechargeState.IDLE

var setStartRechargeTimer = function() {
  startRechargeTimeout = setTimeout(function () {
    statusDialog.setAttribute('data-status', 'error-request-failed')
    clearTimeout(startRechargeTimeout)
    requestRechargeStateChange(RechargeState.IDLE)
  }, 15000)
}

var startRecharge = function (userName) {
  statusDialog.setAttribute('data-status', 'start-request-sending')
  control.startRechargeT312(userName || 'null', 'null', function (obj, status) {

    if (Math.floor(status / 100) === 2) {
      statusDialog.setAttribute('data-status', 'start-request-sent')
      return
    }

    requestRechargeStateChange(RechargeState.IDLE)
    statusDialog.setAttribute('data-status', 'error-request-failed')
  })
}

var stopRecharge = function (userName) {
  statusDialog.setAttribute('data-status', 'stop-request-sending')
  control.stopRechargeT312(userName || 'null', 'null', function (obj, status) {
    if (Math.floor(status / 100) === 2) {
      console.log('stop recharge request successfully sent')
      statusDialog.setAttribute('data-status', 'stop-request-sent')
      requestRechargeStateChange(RechargeState.STOPPING)
    }
  })
}

var clearStartRechargeTimer = function () {
  if (startRechargeTimeout)
    clearTimeout(startRechargeTimeout)
}

var setStopRechargeTimeout = function () {
  stoppingRechargeTimeuot = setTimeout(function () {
    statusDialog.setAttribute('data-status', 'error-stop-recharge-failed')
  }, 15000)
}

var clearStopRechargeTimeout = function () {
  if (stoppingRechargeTimeuot)
    clearTimeout(stoppingRechargeTimeuot)
}

var requestRechargeStateChange = function (targetState) {
  switch (targetState) {
    case RechargeState.IDLE:
      if (statusDialog.getAttribute('data-status') !== 'error-request-failed')
        statusDialog.setAttribute('data-status', 'idle')
      showIdleUi()
      clearStopRechargeTimeout()
    break
    case RechargeState.STARTING:
      setStartRechargeTimer()
    break
    case RechargeState.IN_PROGRESS:
      showChargingUi()
      rechargeStartTime = new Date()
      updateRemainingTime()
      outputEnergy = bindings.metrics['Energy_Out']
      statusDialog.setAttribute('data-status', 'idle')
      chargingUi.setAttribute('data-status', 'charging')
    break
    case RechargeState.STOPPING:
      setStopRechargeTimeout()
    break
    case RechargeState.COMPLETED:
      chargeTotalEnergySpan.textContent = outputEnergy
      chargeTotalTimeSpan.textContent = formatTimeInterval(Math.floor((new Date().getTime() - rechargeStartTime.getTime())/1000))
      chargingUi.setAttribute('data-status', 'completed')
      statusDialog.setAttribute('data-status', 'idle')
      clearStopRechargeTimeout()
      rechargeCompletedTimeout = setTimeout(function () {
        requestRechargeStateChange(RechargeState.IDLE)
        clearTimeout(rechargeCompletedTimeout)
      }, arrowheadConfig.rechargeCompletedMessageDurationMs)
    break
  }
  this.rechargeState = targetState

}

var updateRemainingTime = function () {
  var hoursToRecharge = bindings.metrics['Hours_to_Recharge_Estimated'] || '0'
  var minutesToRecharge = bindings.metrics['Minutes_to_Recharge_Estimated'] || '0'

  if (parseInt(hoursToRecharge)+parseInt(minutesToRecharge) > 0) {
    rechargeTimeAboveOneMinute.style.display = 'inline'
    rechargeTimeBelowOneMinute.style.display = 'none'
  } else {
    rechargeTimeAboveOneMinute.style.display = 'none'
    rechargeTimeBelowOneMinute.style.display = 'inline'
  }
}

var updateRechargeState = function () {
  var isRechargeInProgress = (bindings.metrics['Recharge_In_Progress'] === '1')
  console.log('recharge state: ' + rechargeState)

  switch (rechargeState) {
    case RechargeState.IDLE:
      if (isRechargeInProgress)
        requestRechargeStateChange(RechargeState.IN_PROGRESS)
    break
    case RechargeState.STARTING:
      if (isRechargeInProgress) {
        clearStartRechargeTimer()
        requestRechargeStateChange(RechargeState.IN_PROGRESS)
      }
    break
    case RechargeState.IN_PROGRESS:

      updateRemainingTime()

      if (!isRechargeInProgress)
        requestRechargeStateChange(RechargeState.COMPLETED)
      else
        outputEnergy = bindings.metrics['Energy_Out']
    break
    case RechargeState.STOPPING:
    if (!isRechargeInProgress)
      requestRechargeStateChange(RechargeState.COMPLETED)
    break
    case RechargeState.COMPLETED:
    break
  }
}

var chargeControl = function () {

  updateRechargeState()

  if (bindings.messageIsNew && plotSettings.graphEnabled) {
    updatePlot()
  }
  if (bindings.metrics['Recharge_Control_Status'] === 'RECHARGE_STARTING' && statusDialog.getAttribute('data-status') === 'start-request-sent') {
    statusDialog.setAttribute('data-status', 'start-request-received')
  }
  if (bindings.metrics['Fault_Flag'] === '1') {
    faultDialog.removeAttribute('fault-reason')
    var faultString = parseInt(bindings.metrics['Fault_String'])
    if (faultString === (1 << 0)) {
      faultDialog.setAttribute('fault-reason', 'converter-fault')
    } else if (faultString === (1 << 1)) {
      faultDialog.setAttribute('fault-reason', 'panel-fault')
    } else if (faultString === (1 << 2)) {
      faultDialog.setAttribute('fault-reason', 'vehicle-fault')
    } else if (faultString === (1 << 3)) {
      faultDialog.setAttribute('fault-reason', 'plug-fault')
    }
    showFaultDialog()
  } else {
    hideFaultDialog()
  }
}
