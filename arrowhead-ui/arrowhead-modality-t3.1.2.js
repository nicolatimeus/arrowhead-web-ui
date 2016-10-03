var ArrowheadModalityT312Logic = function (control) {

  subscribeToStationTopic()
  setOnlineCheckEnabled(false)

  document.getElementById('evse-id').textContent = arrowheadConfig.EVSEId

  this.userIdDialog = document.getElementById('user-id-dialog')
  this.startRechargeButton = document.getElementById('start-recharge-button')
  this.userIdCancelButton = document.getElementById('user-id-cancel-button')
  this.userIdInput = document.getElementById('user-id-input')
  this.userIdDialogConfirmButton = document.getElementById('user-id-confirm')
  this.stopRecargheButton = document.getElementById('stop-recharge-button')

  this.idlePane = document.getElementById('idle-pane')
  this.nextBookedRechargeTime = document.getElementById('booked-recharge-time')

  this.bookButton = document.getElementById('book-button')

  this.control = control

  var self = this

  this.startRechargeButton.onclick = function () {
    self.showUserIdDialog()
    self.userIdDialog.setAttribute('action', 'request_recharge')
  }

  this.userIdDialogConfirmButton.onclick = function () {
    self.onLogin()
  }

  this.userIdCancelButton.onclick = function () {
    self.hideUserIdDialog()
  }

  this.stopRecargheButton.onclick = function () {
    self.onStopRechargeRequested()
  }

  this.bookButton.onclick = function () {
    self.showUserIdDialog()
    self.userIdDialog.setAttribute('action', 'book')
  }

  this.pollInProgress = false

  setInterval(function () {
    if (self.pollInProgress)
      return
    self.pollInProgress = true
    getStateT312(function (bookingInfo) {
      self.pollInProgress = false
      self.bookingInfo = bookingInfo
      self.updateBookingInfo()
    })
  }, 1000)
}

ArrowheadModalityT312Logic.prototype.updateBookingInfo = function () {

  if (!this.bookingInfo) {
    this.idlePane.setAttribute('data-booking-status', 'unknown')
    return
  }
  if (this.bookingInfo.isReservedNow) {
    this.idlePane.setAttribute('data-booking-status', 'reserved')
    return
  }
  if (!this.bookingInfo.nextReservationIn) {
    this.idlePane.setAttribute('data-booking-status', 'no-recharge-booked')
    return
  }

  this.idlePane.setAttribute('data-booking-status', 'recharge-booked')

  var now = new Date()
  var nextRechargeTime = new Date(now.getTime() + this.bookingInfo.nextReservationIn)

  this.nextBookedRechargeTime.innerHTML = formatDateForUi(nextRechargeTime)
}

ArrowheadModalityT312Logic.prototype.showUserIdDialog = function () {
  this.userIdInput.value = ""
  this.userIdDialog.classList.remove('hidden')
}

ArrowheadModalityT312Logic.prototype.hideUserIdDialog = function() {
    this.userIdDialog.classList.add('hidden')
}

ArrowheadModalityT312Logic.prototype.onStopRechargeRequested = function () {
  statusDialog.setAttribute('data-status', 'stopping-recharge')
  control.stopRechargeT312(this.userIdInput.value, 'null', function (obj, status) {
    if (Math.floor(status / 100) === 2)
      console.log('stop recharge request successfully sent')
  })
}

ArrowheadModalityT312Logic.prototype.onLogin = function () {
  this.hideUserIdDialog();
  var self = this
  if (this.userIdDialog.getAttribute('action') === 'request_recharge') {

    setStartRechargeTimer()

    statusDialog.setAttribute('data-status', 'sending-booking-req')

    checkRechargeAuthT312(this.userIdInput.value, function (obj, status) {
      if (status ===  200 && obj && obj.status === true) {

        statusDialog.setAttribute('data-status', 'sending-request')

        control.startRechargeT312(self.userIdInput.value, 'null', function (obj, status) {

          if (Math.floor(status / 100) === 2) {
            statusDialog.setAttribute('data-status', 'request-sent')
            return
          }

          clearStartRechargeTimer()
          statusDialog.setAttribute('data-status', 'error-request-failed')
        })

        return
      }

      clearStartRechargeTimer()

      if (status === 403 || (obj !== null && obj.status === false)) {
        statusDialog.setAttribute('data-status', 'error-not-authorized')
        return
      }

      statusDialog.setAttribute('data-status', 'error-booking-failed')

    })
  } else {

    statusDialog.setAttribute('data-status', 'sending-booking-req')
    reserveOTFT312(this.userIdInput.value, function (obj, status) {

      if (status === 200 && obj && obj.status === true) {
        statusDialog.setAttribute('data-status', 'idle')
        return
      }

      if (status === 403  || (obj !== null && obj.status === false)) {
        statusDialog.setAttribute('data-status', 'error-not-authorized')
        return
      }

      statusDialog.setAttribute('data-status', 'error-booking-failed')

    })
  }
}
