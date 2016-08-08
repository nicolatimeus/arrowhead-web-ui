var ArrowheadModalityT312Logic = function (control) {
  this.userIdDialog = document.getElementById('user-id-dialog')
  this.startRechargeButton = document.getElementById('start-recharge-button')
  this.userIdCancelButton = document.getElementById('user-id-cancel-button')
  this.userIdInput = document.getElementById('user-id-input')
  this.userIdDialogConfirmButton = document.getElementById('user-id-confirm')
  this.stopRecargheButton = document.getElementById('stop-recharge-button')

  this.idlePane = document.getElementById('idle-pane')
  this.nextBookedRechargeTime = document.getElementById('booked-recharge-time')

  this.bookingFailedAlert = document.getElementById('booking-failed-alert')
  this.bookingFailedAlertCloseButton = document.getElementById('close-booking-failed-alert-button')
  this.chargeNotAuthorizedAlert = document.getElementById('charge-not-authorized-alert')
  this.chargeNotAuthorizedAlertCloseButton = document.getElementById('close-charge-not-authorized-alert-button')

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

  this.bookingFailedAlertCloseButton.onclick = function () {
    self.hideBookingFailedAlert()
  }

  this.chargeNotAuthorizedAlertCloseButton.onclick = function () {
    self.hideChargeNotAuthorizedAlert()
  }

  setInterval(function () {
    getStateT312(function (bookingInfo) {
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
  var rechargeDay = 'today'

  if (now.getDate() !== nextRechargeTime.getDate() || now.getMonth() !== nextRechargeTime.getMonth() || now.getFullYear() !== nextRechargeTime.getFullYear())
    rechargeDay = nextRechargeTime.getDate() + '/' + nextRechargeTime.getMonth() + '/' + nextRechargeTime.getFullYear()

  var nextRechargeMinutes = nextRechargeTime.getMinutes()

  if (nextRechargeMinutes < 10) {
    nextRechargeMinutes = '0' + nextRechargeMinutes
  }

  this.nextBookedRechargeTime.innerHTML = nextRechargeTime.getHours() + ':' + nextRechargeMinutes + ' of ' + rechargeDay
}

ArrowheadModalityT312Logic.prototype.showUserIdDialog = function () {
  this.userIdInput.value = "Please enter user id"
  this.userIdDialog.classList.remove('hidden')
}

ArrowheadModalityT312Logic.prototype.hideUserIdDialog = function() {
    this.userIdDialog.classList.add('hidden')
}

ArrowheadModalityT312Logic.prototype.onStopRechargeRequested = function () {
  console.log('requesting to stop recharge')
  control.stopRechargeT312(this.userIdInput.value, 'null', function (obj, status) {
    if (Math.floor(status / 100) === 2)
      console.log('stop recharge request successfully sent')
  })
}

ArrowheadModalityT312Logic.prototype.showBookingFailedAlert = function () {
  this.bookingFailedAlert.classList.remove('hidden')
}

ArrowheadModalityT312Logic.prototype.hideBookingFailedAlert = function () {
  this.bookingFailedAlert.classList.add('hidden')
}

ArrowheadModalityT312Logic.prototype.showChargeNotAuthorizedAlert = function () {
  this.chargeNotAuthorizedAlert.classList.remove('hidden')
}

ArrowheadModalityT312Logic.prototype.hideChargeNotAuthorizedAlert = function () {
  this.chargeNotAuthorizedAlert.classList.add('hidden')
}

ArrowheadModalityT312Logic.prototype.onLogin = function () {
  this.hideUserIdDialog();
  var self = this
  if (this.userIdDialog.getAttribute('action') === 'request_recharge') {
    checkRechargeAuthT312(this.userIdInput.value, function (obj, status) {
      if (status ===  200 && obj && obj.status === true) {
        console.log('requesting to start recharge')
        control.startRechargeT312(self.userIdInput.value, 'null', function (obj, status) {
          if (Math.floor(status / 100) === 2)
            console.log('start recharge request successfully sent')
        })
      } else {
        self.showChargeNotAuthorizedAlert()
      }
    })
  } else {
    reserveOTFT312(this.userIdInput.value, function (obj, status) {
      if (status === 200 && obj && obj.status === true) {

      } else {
        self.showBookingFailedAlert()
      }
    })
  }
}