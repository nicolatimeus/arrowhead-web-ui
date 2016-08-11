var genQueryString = function (data) {
  var result = '?'
  for (var p in data) {
    result += encodeURIComponent(p) + '=' + encodeURIComponent(data[p]) + '&'
  }
  return result.substring(0, result.length-1)
}

var doRequest = function(uri, data, method, callback, options) {
  options = options || {}
  var queryString
  var body

  var xhr = new XMLHttpRequest()

  if (data && !options.useBody)
      queryString = genQueryString(data)

  uri = uri + (queryString ? queryString : '')
  xhr.open(method, uri)
  xhr.setRequestHeader('Accept', 'application/json')
  if (data && options.useBody) {
    if (!options.raw) {
      body = JSON.stringify(data)
      xhr.setRequestHeader('Content-Type', 'application/json')
    }
    else {
      body = data
      xhr.setRequestHeader('Content-Type', options.contentType)
    }
  }

  if (options.credentials) {
    xhr.withCredentials = true
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(options.credentials.userName + ':' + options.credentials.password))
  }

  xhr.onreadystatechange = function () {
    if(xhr.readyState !== XMLHttpRequest.DONE) return
    if(xhr.status === 200) {
      if (!options.getAsString)
        callback(JSON.parse(xhr.responseText), xhr.status)
      else
        callback(xhr.responseText, xhr.status)
    }
    else
      callback(null, xhr.status)
  }

  xhr.onerror = function () {
    callback(null, -1)
  }

  xhr.send(body)
}
