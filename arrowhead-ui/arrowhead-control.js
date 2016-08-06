
var MESSAGE_TYPE_METRIC_NAME = 'messageType'
var USER_NAME_METRIC_NAME = 'userName'
var RESERVATION_ID_METRIC_NAME = 'reservationId'

var T312_START_RECHARGE = 0x101;
var T312_STOP_RECHARGE = 0x102;

var ArrowheadControl = function (controlTopicName, cloudClient) {
  this.controlTopicName = controlTopicName;
  this.cloudClient = cloudClient;
}

ArrowheadControl.prototype.startRechargeT312 = function(userId, reservationId, callback) {
  var payload = new CloudPayload(this.controlTopicName)
  payload.addMetric(MESSAGE_TYPE_METRIC_NAME, T312_START_RECHARGE, 'int')
  payload.addMetric(USER_NAME_METRIC_NAME, userId, 'string')
  payload.addMetric(RESERVATION_ID_METRIC_NAME, reservationId, 'string')

  this.cloudClient.publish(payload, callback)
}

ArrowheadControl.prototype.stopRechargeT312 = function(userId, reservationId, callback) {
  var payload = new CloudPayload(this.controlTopicName)
  payload.addMetric(MESSAGE_TYPE_METRIC_NAME, T312_STOP_RECHARGE, 'int')
  payload.addMetric(USER_NAME_METRIC_NAME, userId, 'string')
  payload.addMetric(RESERVATION_ID_METRIC_NAME, reservationId, 'string')

  this.cloudClient.publish(payload, callback)
}
