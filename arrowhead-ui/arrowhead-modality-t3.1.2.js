var ArrowheadModalityT312Logic = function (control) {
  this.userIdDialog = document.getElementById('user-id-dialog')
  this.startRechargeButton = document.getElementById('start-recharge-button')
  this.userIdInput = document.getElementById('user-id-input')
  this.userIdDialogConfirmButton = document.getElementById('user-id-confirm')
  this.stopRecargheButton = document.getElementById('stop-recharge-button')
  this.noRechargeBookedMessage = document.getElementById('no-recharge-booked-message')

  this.unknownBookingStateMessage = document.getElementById('unknown-booking-state-message')
  this.rechargeBookedMessage = document.getElementById('recharge-booked-message')
  this.nextBookedRechargeTime = document.getElementById('booked-recharge-time')
  this.stationReservedMessage = document.getElementById('station-reserved-message')
  this.noRechargeBookedMessage = document.getElementById('no-recharge-booked-message')

  this.bookButton = document.getElementById('book-button')

  this.control = control

  var self = this

  this.startRechargeButton.onclick = function () {
    self.showUserIdDialog()
    self.action = 'request_recharge'
  }

  this.userIdDialogConfirmButton.onclick = function () {
    self.onLogin()
  }

  this.stopRecargheButton.onclick = function () {
    self.onStopRechargeRequested()
  }

  this.bookButton.onclick = function () {
    self.showUserIdDialog()
    self.action = 'book'
  }

  setInterval(function () {
    getStateT312(function (bookingInfo) {
      self.bookingInfo = bookingInfo
      self.updateBookingInfo()
    })
  }, 1000)
}

ArrowheadModalityT312Logic.prototype.updateBookingInfo = function () {
  this.unknownBookingStateMessage.classList.add('hidden')
  this.rechargeBookedMessage.classList.add('hidden')
  this.noRechargeBookedMessage.classList.add('hidden')
  this.stationReservedMessage.classList.add('hidden')

  this.bookButton.style.display = 'none'
  this.startRechargeButton.style.display = 'none'


  if (!this.bookingInfo) {
    this.unknownBookingStateMessage.classList.remove('hidden')
    return
  }
  if (this.bookingInfo.isReservedNow) {
    this.stationReservedMessage.classList.remove('hidden')
    this.startRechargeButton.style.display = 'inline'
    return
  }
  if (!this.bookingInfo.nextReservationIn) {
    this.noRechargeBookedMessage.classList.remove('hidden')
    this.bookButton.style.display = 'inline'
    return
  }

  this.rechargeBookedMessage.classList.remove('hidden')

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

ArrowheadModalityT312Logic.prototype.onLogin = function () {
  this.hideUserIdDialog();
  var self = this
  if (this.action === 'request_recharge') {
    checkRechargeAuthT312(this.userIdInput.value, function (obj, status) {
      if (status == 200 && obj && obj.status === true) {
        console.log('requesting to start recharge')
        control.startRechargeT312(self.userIdInput.value, 'null', function (obj, status) {
          if (Math.floor(status / 100) === 2)
            console.log('start recharge request successfully sent')
        })
      }
    })
  } else {
    reserveOTFT312(this.userIdInput.value, console.log)
  }
}
