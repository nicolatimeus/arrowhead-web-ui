var serializer = new XMLSerializer()
var parser = new DOMParser()

var toXml = function (object, doc) {
  var tag = object['$tag']
  if (!tag)
    throw new Error('$tag property not set in object ' + object)

  var xml

  if (!doc) {
    doc = document.implementation.createDocument(null, tag)
    xml = doc.childNodes[0]
  } else {
    xml = doc.createElement(tag)
  }

  for (var p in object) {
    if (p === '$tag' || p === '$children' || p === '$textContent')
      continue

      var value = object[p]
      if (value instanceof Date) {
        value = value.toISOString()
      }

      xml.setAttribute(p, value)
  }

  var children = object['$children']
  if (children)
    children.forEach(function (child) {
      childNode = toXml(child, doc)
      xml.appendChild(childNode)
    })

  var textContent = object['$textContent']
  if (textContent)
    xml.textContent = textContent

  return xml
}

var serializeXml = function (xml) {
  var result = serializer.serializeToString(xml)
  result = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + result
  return result
}

var parseXmlString = function (str) {
  return parser.parseFromString(str, 'text/xml').childNodes[0]
}

var fromXml = function (xml) {
  var result = {}
  result['$tag'] = xml.nodeName

  if (xml.attributes)
  for (var att, i = 0, atts = xml.attributes; i < atts.length; i++){
    var att = atts[i]
    result[att.nodeName] = att.nodeValue
  }

  var children = []
  if (xml.childNodes && xml.childNodes.length) {
    result['$children'] = children
    for(var i =0; i < xml.childNodes.length; i++) {
      var child = fromXml(xml.childNodes[i])
      if (child['$tag'] !== '#text')
        children[children.length] = child
    }
  }

  if (!children.length)
    result['$textContent'] = xml.textContent

  return result
}
