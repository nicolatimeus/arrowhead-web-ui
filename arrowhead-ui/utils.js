var formatDateForUi = function (date) {
  var now = new Date()
  var day = 'today'

  if (now.getDate() !== date.getDate() || now.getMonth() !== date.getMonth() || now.getFullYear() !== date.getFullYear())
    day = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear()

  var minutes = date.getMinutes()

  if (minutes < 10) {
    minutes = '0' + minutes
  }

  return date.getHours() + ':' + minutes + ' of ' + day
}

var formatTimeInterval = function (seconds) {

  var minutes = Math.floor(seconds/60)
  var hours = Math.floor(minutes/60)

  seconds = seconds % 60
  minutes = minutes % 60

  return  ((hours) ? hours + ' hours ' : '') +
          ((minutes) ? minutes + ' minutes ' : '') +
          ((seconds) ? seconds + ' seconds' : '') ;

}

var fixDateToMultipleOf = function (date, timeSecs) {
  var timeMs = date.getTime()

  var d = Math.round(timeMs/timeSecs/1000)

  return new Date(d*timeSecs*1000)
}

var toInputDateFormat = function (date) {

  var month = (date.getMonth() + 1)
  var day = date.getDate()
  var hour = date.getHours()
  var minute = date.getMinutes()

  if (month < 10) month = '0'+month
  if (hour < 10) hour = '0'+hour
  if (minute < 10) minute = '0'+minute
  if (day < 10) day = '0'+day

  return date.getFullYear() + '-' + month + '-' + day + 'T' + hour + ':' + minute
}

var fixDate = function (date) {
  var timeMs = date.getTime()
  timeMs += new Date().getTimezoneOffset()*60*1000
  return new Date(timeMs)
}

var fromInputDateFormat = function (str) {
  str = str.replace('T', ' ')
  return new Date(str)
}
