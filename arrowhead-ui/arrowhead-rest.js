var checkRechargeAuthT312 = function (userId, callback) {
var uri = arrowheadConfig.bookingProxyUri + '/evses/' + arrowheadConfig.EVSEId + '/check'
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
  var uri = arrowheadConfig.bookingProxyUri + '/evses/' + arrowheadConfig.EVSEId
  var requestObj = {}
  doRequest(uri, requestObj, 'GET', callback)
}

var postFlexOffer = function(flexOffer, callback) {
  var uri = arrowheadConfig.flexOfferBaseUri + '/api/flexoffers/' + arrowheadConfig.flexOfferId
  var xmlString = serializeXml(flexOffer.toXml())
  doRequest(uri, xmlString, 'POST', callback, {
    contentType: 'application/xml',
    raw: true,
    getAsString: true,
    useBody: true
  })
}

var getFlexOffer = function (id, callback) {
  var uri = arrowheadConfig.flexOfferBaseUri + '/api/flexoffers/' + arrowheadConfig.flexOfferId + '/' + id
  var requestObj = {}
  doRequest(uri, requestObj, 'GET', function (obj, status) {
    if (Math.floor(status / 100) !== 2) {
      callback()
      return
    }
    var xml = parseXmlString(obj)

    if (!xml) {
      callback(null)
      return
    }

    callback(new FlexOffer(xml))
  }, {
    getAsString: true,
    accept: 'application/xml'
  })
}
