var checkRechargeAuthT312 = function (userId, callback) {
var uri = arrowheadConfig.bookingBaseUri + '/evses/' + arrowheadConfig.EVSEId + '/check'
  var requestObj = {
    'user_id': userId,
    'tolerance': arrowheadConfig.tolerance+""
  }
  doRequest(uri, requestObj, 'POST', callback, {
    useBody: true
  })
}

var reserveOTFT312 = function (userId, callback) {
  var uri = arrowheadConfig.bookingProxyUri + '/treservations/onthefly'
  var requestObj = {
    'evse_id': arrowheadConfig.EVSEId,
    'user_id': userId
  }
  doRequest(uri, requestObj, 'POST', callback, {
    useBody: true
  })
}

var getStateT312 = function (callback) {
  var uri = arrowheadConfig.bookingBaseUri + '/evses/' + arrowheadConfig.EVSEId
  var requestObj = {}
  doRequest(uri, requestObj, 'GET', callback)
}
