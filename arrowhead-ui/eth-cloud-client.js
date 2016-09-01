var parser = new DOMParser()

var CloudClient = function (baseUri, credentials) {
  this.baseUri = baseUri
  this.credentials = credentials
}

CloudClient.prototype.req = function(resource, data, callback) {
  var uri = this.baseUri + resource
  doRequest(uri, data, 'GET', callback, {
    credentials: this.credentials
  })
}

CloudClient.prototype.subscribeToTopic = function (topic, callback) {

  var self = this
  this.req('/streams/subscribe.json', {
    topic: topic,
    fetch: 'metrics'
  }, function (data, status) {
    if (Math.floor(status / 100) !== 2 || !data) {
      console.log('retrying')
      self.subscribeToTopic(topic, callback)
      return
    }

    var metricsArray
    var timestamp
    try {
    timestamp = new Date(data.payload.sentOn)
    metricsArray = data.payload.metrics.metric
    } catch (err) {
    console.log('stream rest api: bad response, retrying')
    callback()
    self.subscribeToTopic(topic, callback)
    return
    }

    callback(metricsArray, timestamp)
    self.subscribeToTopic(topic, callback)
  }, {credentials: this.credentials})
}

CloudClient.prototype.getLastMessageMetrics = function (topic, asset, callback) {
  this.req('/messages/searchByAsset.json', {
    asset: asset,
    limit: 1,
    offset: 0,
    fetch: 'metrics'
  }, function (data, status) {
    if (Math.floor(status / 100) !== 2 || !data) {
      callback()
      return
    }

    var metricsArray
    var timestamp
    try {
    timestamp = new Date(data.message[0].payload.sentOn)
    metricsArray = data.message[0].payload.metrics.metric
    } catch (err) {
    console.log(err)
    callback()
    return
    }

    callback(metricsArray, timestamp)

  }, {credentials: this.credentials})
}

CloudClient.prototype.getLastValue = function (topic, metric, callback) {
  this.req('/metrics/values.json', {
    topic: topic,
    metric: metric
  }, callback)
}

CloudClient.prototype.publish = function (payload, callback) {
  var uri = this.baseUri + '/messages/publish'
  doRequest(uri, payload.toXMLString(), 'POST', callback, {
    credentials: this.credentials,
    useBody: true,
    contentType: 'application/xml',
    raw: true
  })
}

var CloudPayload = function (topic) {
  this.topic = topic
  this.payload = {
    metrics: []
  }
}

CloudPayload.prototype.addMetric = function (name, value, type) {
  var obj = {
    name: name,
    value: value+'',
    type: type
  }
  this.payload.metrics[this.payload.metrics.length] = obj
}

CloudPayload.prototype.toXMLString = function () {
  var xml = document.implementation.createDocument(null, null)

  var message = xml.createElement('message')
  message.setAttribute('xmlns_in', 'http://eurotech.com/edc/2.0')
  xml.appendChild(message);

  var xmlTopic = xml.createElement('topic')

  xmlTopic.textContent = this.topic
  message.appendChild(xmlTopic)

  var xmlPayload = xml.createElement('payload')
  message.appendChild(xmlPayload)

  var metrics = xml.createElement('metrics')
  xmlPayload.appendChild(metrics)

  this.payload.metrics.forEach(function (metric) {
    var xmlMetric = xml.createElement('metric')
    for (var p in metric) {
      var n = xml.createElement(p)
      n.textContent = metric[p]
      xmlMetric.appendChild(n)
    }
    metrics.appendChild(xmlMetric)
  })

  var resultString = '<?xml version="1.0" encoding="UTF-8"?>' + new XMLSerializer().serializeToString(xml)
  resultString = resultString.replace('xmlns_in', 'xmlns')

  return resultString
}
