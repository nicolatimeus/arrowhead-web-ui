var ArrowheadModalityT311Logic = function (control) {

  subscribeToStationTopic()
  setOnlineCheckEnabled(true)

  this.control = control

  var self = this

  this.proposeScheduleButton = document.getElementById('schedule-button')

  this.scheduleStartTimeInput = document.getElementById('schedule-start-time')
  this.scheduleEndTimeInput = document.getElementById('schedule-end-time')
  this.scheduleTotalEnergyInput = document.getElementById('schedule-total-energy')

  this.scheduleConfirmButton = document.getElementById('schedule-confirm-button')
  this.scheduleEditorCancelButton = document.getElementById('schedule-editor-cancel-button')

  this.scheduleEditor = document.getElementById('schedule-editor')

  this.idlePane = document.getElementById('idle-pane')
  this.flexofferMinStartTimeSpan = document.getElementById('flexoffer-proposed-min-start-time')
  this.flexofferMaxStartTimeSpan = document.getElementById('flexoffer-proposed-max-start-time')
  this.flexofferTimeSpan = document.getElementById('flexoffer-recharge-time')
  this.flexofferDurationSpan = document.getElementById('flexoffer-recharge-duration')
  this.flexofferEnergySpan = document.getElementById('flexoffer-recharge-energy')

  this.stopRecargheButton = document.getElementById('stop-recharge-button')
  this.startRechargeButton = document.getElementById('start-recharge-button')

  document.getElementById('station-average-power').textContent = arrowheadConfig.avgChargePowerOutKw

  this.startRechargeButton.onclick = function () {
    self.onStartRechargeRequested()
  }

  this.stopRecargheButton.onclick = function () {
    self.onStopRechargeRequested()
  }

  this.proposeScheduleButton.onclick = function () {
    self.scheduleEditor.classList.remove('hidden')
  }

  this.scheduleEditorCancelButton.onclick = function () {
    self.scheduleEditor.classList.add('hidden')
  }

  this.scheduleStartTimeInput.onblur = function() {
    self.onInputDataChanged()
  }

  this.scheduleEndTimeInput.onblur = function() {
    self.onInputDataChanged()
  }

  this.scheduleTotalEnergyInput.onblur = function () {
    self.onInputDataChanged()
  }

  this.scheduleConfirmButton.onclick = function () {
    self.scheduleEditor.classList.add('hidden')

    var inputData = self.parseInput()

    if (!inputData) {
      alert('failed to parse input data')
      return
    }

    var inputValidation = self.validateInput(inputData)
    self.updateInputs(inputValidation)

    if (!inputValidation.isValid) {
      self.showFieldInvalidAlert(inputValidation)
      return
    }

    self.flexOffer = self.getFlexOfferFromInput(inputData)

    postFlexOffer(self.flexOffer, function (obj, status) {
        if (status / 100 != 2) {
          alert('failed to post offer, status: ' + status)
          self.flexOffer = null
          self.updateFlexOfferStatusUi()
          return
        }

        self.updateFlexOfferStatusUi()
        self.startFlexOfferPolling()
    })

  }



  var now = new Date().getTime()

  this.scheduleStartTimeInput.value = this.formatDateForInput(new Date(now + 10*60*1000))
  this.scheduleEndTimeInput.value = this.formatDateForInput(new Date(now + 40*60*1000))

  var inputData = this.parseInput()
  var validation = this.validateInput(inputData)
  this.updateInputs(validation)
}

ArrowheadModalityT311Logic.prototype.formatDateForInput = function (date) {
  var fixedDate = fixDateToMultipleOf(date, arrowheadConfig.flexOfferIntervalDurationSeconds)
  return toInputDateFormat(fixedDate)
}

ArrowheadModalityT311Logic.prototype.startFlexOfferPolling = function () {

  this.stopFlexOfferPolling()
  var self = this

  this.flexOfferPollTimer = setInterval(function () {
    getFlexOffer(1, function (offer) {
      if (!offer) {
        console.log('failed to get flexOffer!')
        return
      }

      self.flexOffer = offer
      self.onFlexOfferUpdated()
    })
  }, arrowheadConfig.flexOfferPollRateMs)

}

ArrowheadModalityT311Logic.prototype.onInputDataChanged = function () {
  var inputData = this.parseInput()
  var validation = this.validateInput(inputData)
  this.updateInputs(validation)
}

ArrowheadModalityT311Logic.prototype.showFieldInvalidAlert = function (validationData) {
  if (!validationData.isMinTimeBeforeMaxTime) {
      alert('Start time must be before end time')
      return
  }
  if (!validationData.isStartMinTimeValid) {
      alert('Invalid value for minimum start time')
      return
  }
  if (!validationData.isStartMaxTimeValid) {
      alert('Invalid value for maximum start time')
      return
  }
  if (!validationData.isTotalEnergyValid) {
      alert('Invalid value for total energy field')
      return
  }
}

ArrowheadModalityT311Logic.prototype.stopFlexOfferPolling = function () {
  if (this.flexOfferPollTimer) {
    clearInterval(this.flexOfferPollTimer)
    this.flexOfferPollTimer = null
  }
}

ArrowheadModalityT311Logic.prototype.updateInputs = function (validationData) {
  if (!validationData.isStartMinTimeValid) {
    this.scheduleStartTimeInput.setAttribute('data-valid', 'false')
  }
  if (!validationData.isStartMaxTimeValid) {
    this.scheduleEndTimeInput.setAttribute('data-valid', 'false')
  }
  if (!validationData.isTotalEnergyValid) {
    this.scheduleTotalEnergyInput.setAttribute('data-valid', 'false')
  }
}

ArrowheadModalityT311Logic.prototype.validateInput = function (data) {

  console.log(data)

  var result = {
    isValid: true,
    isStartMinTimeValid: true,
    isStartMaxTimeValid: true,
    isTotalEnergyValid: true,
    isMinTimeBeforeMaxTime: true
  }

  this.scheduleStartTimeInput.setAttribute('data-valid', 'true')
  this.scheduleEndTimeInput.setAttribute('data-valid', 'true')
  this.scheduleTotalEnergyInput.setAttribute('data-valid', 'true')

  var now = new Date().getTime()
  var temp
  if (isNaN(temp = data.rechargeStartMinTime.getTime()) || temp < now ) {
    console.log(new Date() + ' ' + data.rechargeStartMinTime)
    result.isStartMinTimeValid = false
    result.isValid = false
  }
  if (isNaN(temp = data.rechargeStartMaxTime.getTime()) || temp < now) {
    result.isStartMaxTimeValid = false
    result.isValid = false
  }

  if (isNaN(data.totalEnergy) || data.totalEnergy <= 0) {
    result.isTotalEnergyValid = false
    result.isValid = false
  }

  if (result.isStartMinTimeValid && result.isStartMaxTimeValid && data.rechargeStartMinTime.getTime() >= data.rechargeStartMaxTime.getTime()) {
    result.isStartMaxTimeValid = false
    result.isStartMinTimeValid = false
    result.isMinTimeBeforeMaxTime = false
    result.isValid = false
  }

  return result
}

ArrowheadModalityT311Logic.prototype.parseInput = function () {
  console.log(fromInputDateFormat(this.scheduleStartTimeInput.value))
  console.log(fromInputDateFormat(this.scheduleEndTimeInput.value))

  return {
    rechargeStartMinTime: fromInputDateFormat(this.scheduleStartTimeInput.value),
    rechargeStartMaxTime: fromInputDateFormat(this.scheduleEndTimeInput.value),
    totalEnergy: parseInt(this.scheduleTotalEnergyInput.value)
  }

}

ArrowheadModalityT311Logic.prototype.getFlexOfferFromInput = function (inputData) {
  var f = new FlexOffer()

  f.setId(1)

  var expectedRechargeTimeSlices = Math.ceil((inputData.totalEnergy / arrowheadConfig.avgChargePowerOutKw)*60*60 / f.data.numSecondsPerInterval)
  var energyPerInterval = arrowheadConfig.avgChargePowerOutKw*f.data.numSecondsPerInterval/3600

  console.log(expectedRechargeTimeSlices)

  while (expectedRechargeTimeSlices > 0) {
    var sliceDuration = Math.min(4, expectedRechargeTimeSlices)
    f.addSlice(sliceDuration, 1, [energyPerInterval*sliceDuration, energyPerInterval*sliceDuration])
    expectedRechargeTimeSlices -= sliceDuration
  }

  f.setCreationTime(new Date())

  f.setStartAfterTime(inputData.rechargeStartMinTime)
  f.setStartBeforeTime(inputData.rechargeStartMaxTime)

  f.setAcceptanceBeforeTime(inputData.rechargeStartMinTime)
  f.setAssignmentBeforeTime(inputData.rechargeStartMinTime)

  f.finalize()

  return f
}

ArrowheadModalityT311Logic.prototype.onFlexOfferUpdated = function () {
  console.log('got flex offer')
  console.log(this.flexOffer)

  if (this.flexOffer.isAssigned()) {
    this.stopFlexOfferPolling()
    this.updateFlexOfferStatusUi()

    console.log('flex offer assigned')
    console.log('start at: ' + this.flexOffer.getSchedule().startTime.toLocaleString())
  }
}

ArrowheadModalityT311Logic.prototype.onStartRechargeRequested = function () {
  control.startRechargeT312('null', 'null', function (obj, status) {
    if (Math.floor(status / 100) === 2)
      console.log('start recharge request successfully sent')
  })
}

ArrowheadModalityT311Logic.prototype.onStopRechargeRequested = function () {
  console.log('requesting to stop recharge')
  control.stopRechargeT312('null', 'null', function (obj, status) {
    if (Math.floor(status / 100) === 2)
      console.log('stop recharge request successfully sent')
  })
}

ArrowheadModalityT311Logic.prototype.updateFlexOfferStatusUi = function () {
  if (!this.flexOffer) {
    this.idlePane.setAttribute('data-booking-status', 'no-recharge-booked')
    return
  }
  this.flexofferDurationSpan.textContent = formatTimeInterval(this.flexOffer.data.durationSeconds)

  if (!this.flexOffer.isAssigned()) {
    this.idlePane.setAttribute('data-booking-status', 'schedule-proposed')

    this.flexofferMinStartTimeSpan.textContent = formatDateForUi(this.flexOffer.getStartAfterTime())
    this.flexofferMaxStartTimeSpan.textContent = formatDateForUi(this.flexOffer.getStartBeforeTime())

  } else {
    this.idlePane.setAttribute('data-booking-status', 'schedule-accepted')
    var schedule = this.flexOffer.getSchedule()

    this.flexofferTimeSpan.textContent = formatDateForUi(schedule.startTime)
  }


  this.flexofferEnergySpan.textContent = this.flexOffer.getTotalEnergy()
}
