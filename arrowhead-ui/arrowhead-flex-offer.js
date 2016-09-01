var FlexOffer = function (xml) {
  if (xml) {
    this.fromXml(xml)
    return
  }

  this.data = {
    $tag: 'flexOffer',
    state: 'Initial',
    offeredById: arrowheadConfig.flexOfferId,
    durationSeconds: 0,
    assignmentBeforeDurationSeconds: 0,
    numSecondsPerInterval: 15*60,
    id: 1,
    $children: [
      {
        $tag: 'flexOfferSchedule'
      },
      {
        $tag: 'defaultSchedule'
      }
    ]
  }
}

FlexOffer.prototype.addChild = function (child) {
  if (!this.data['$children'])
    this.data['$children'] = []

  var children = this.data['$children']
  children[children.length] = child
}

FlexOffer.prototype.addToDuration = function (secs) {
  if (!this.data.durationSeconds) {
    this.data.durationSeconds = secs
    return
  }

  if (typeof this.data.durationSeconds === 'string')
    this.data.durationSeconds = parseInt(this.data.durationSeconds)

  this.data.durationSeconds += secs

}

FlexOffer.prototype.addSlice = function ( durationIntervals,
                                          costPerEnergyUnitLimit,
                                          energyConstraint) {
    var self = this
    var slice = {
      $tag: 'slices',
      durationSeconds: durationIntervals*self.data.numSecondsPerInterval,
      $children: [
        {
          $tag: 'costPerEnergyUnitLimit',
          $textContent: costPerEnergyUnitLimit
        },
        {
          $tag: 'energyConstraint',
          lower: energyConstraint[0],
          upper: energyConstraint[1]
        },
        {
          $tag: 'tariffConstraint',
          lower: energyConstraint[0]*costPerEnergyUnitLimit,
          upper: energyConstraint[1]*costPerEnergyUnitLimit
        }
      ]
    }

  this.addChild(slice)
  this.addToDuration(slice.durationSeconds)

}

FlexOffer.prototype.toFlexOfferTime = function (date) {
  var time = date.getTime()
  return Math.floor(time / this.data.numSecondsPerInterval / 1000)
}

FlexOffer.prototype.toActualTime = function (flexOfferTime) {
  return new Date(flexOfferTime*1000*this.data.numSecondsPerInterval)
}

FlexOffer.prototype.fix = function (date) {
  return this.toActualTime(this.toFlexOfferTime(date))
}

FlexOffer.prototype.fromXml = function (xml) {
  this.data = fromXml(xml)
}

FlexOffer.prototype.finalize = function () {
    this.data.endAfterTime = new Date(
      this.data.startAfterTime.getTime() +
      this.data.durationSeconds*1000)

    this.data.endBeforeTime = new Date(
      this.data.startBeforeTime.getTime()
      +this.data.durationSeconds*1000)
}

FlexOffer.prototype.toXml = function () {
  return toXml(this.data)
}

FlexOffer.prototype.findByTag = function (tag, root) {
  root = root || this.data
  if (root['$tag'] === tag) return root

  var self = this
  var children = root['$children']
  if (children)
    for (var i=0; i<children.length; i++) {
      var res = self.findByTag(tag, children[i])
      if (res)
        return res
    }

  return null
}

FlexOffer.prototype.setId = function (id) {
  this.data.id = id
}

FlexOffer.prototype.setCreationTime = function (date) {
  this.data.creationTime = this.fix(date)
}

FlexOffer.prototype.setAcceptanceBeforeTime = function (date) {
  this.data.acceptanceBeforeTime = this.fix(date)
}

FlexOffer.prototype.setStartAfterTime = function (date) {
  this.data.startAfterTime = this.fix(date)
}

FlexOffer.prototype.setAssignmentBeforeTime = function (date) {
  this.data.assignmentBeforeTime = this.fix(date)
}

FlexOffer.prototype.setStartBeforeTime = function (date) {
  this.data.startBeforeTime = this.fix(date)
}

FlexOffer.prototype.isAssigned = function () {
  return this.data.state === 'Assigned'
}

FlexOffer.prototype.getSchedule = function () {
  var schedules = [this.findByTag('flexOfferSchedule'), this.findByTag('defaultSchedule')]

  var schedule
  for (var i=0; i<schedules.length; i++) {
    var s = schedules[i]
    if (s && s['$children'] && s['$children'].length) {
      schedule = s
      break
    }
  }

  if (!schedule)
    return null

  var result = {
    startTime: new Date(schedule.startTime),
    slices: []
  }

  var children = schedule['$children']
  for (var i=0; i<children.length; i++) {
    var child = children[i]
    if (child['$tag'] !== 'energyAmounts')
      continue

    result.slices[result.slices.length] = parseInt(child['$textContent'])
  }

  result.durationSeconds = result.slices.length*this.data.numSecondsPerInterval

  return result
}

/*var f = new FlexOffer()

f.setId(1)

f.addSlice(4, 1, [300, 500])
f.addSlice(4, 1, [300, 500])
f.addSlice(4, 1, [300, 500])
f.addSlice(4, 1, [300, 500])

//f.setCreationTime(new Date(Date.parse('2016-08-31T21:00:00+02:00')))
f.setCreationTime(new Date())
console.log(f.data.creationTime)
var d = f.data.creationTime

d = new Date(d.getTime() + (1+30)*60*1000)
f.setAcceptanceBeforeTime(d)

d = new Date(d.getTime() + 1*60*1000)
f.setAssignmentBeforeTime(d)

d = new Date(d.getTime() + 10*60*1000)
f.setStartAfterTime(d)

d = new Date(d.getTime() + 60*60*1000)
f.setStartBeforeTime(d)

f.finalize()
var xml = f.toXml()

console.log(serializeXml(xml))

getFlexOffer(1, function(offer) {
  console.log('offer received')
  console.log(offer)
  console.log(offer.getSchedule())
})

/**/

/*var receivedXml = '<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><flexOffer id=\"1\" state=\"Initial\" offeredById=\"proxytest\" acceptanceBeforeTime=\"2016-08-31T21:30:00+02:00\" assignmentBeforeDurationSeconds=\"0\" assignmentBeforeTime=\"2016-08-31T21:30:00+02:00\" creationTime=\"2016-08-31T21:00:00+02:00\" durationSeconds=\"14400\" endAfterTime=\"2016-09-01T01:30:00+02:00\" endBeforeTime=\"2016-09-01T02:30:00+02:00\" numSecondsPerInterval=\"900\" startAfterTime=\"2016-08-31T21:30:00+02:00\" startBeforeTime=\"2016-08-31T22:30:00+02:00\">    <slices durationSeconds=\"3600\">        <costPerEnergyUnitLimit>1.0</costPerEnergyUnitLimit>        <energyConstraint lower=\"300.0\" upper=\"500.0\"/>        <tariffConstraint lower=\"300.0\" upper=\"500.0\"/>    </slices>    <slices durationSeconds=\"3600\">        <costPerEnergyUnitLimit>1.0</costPerEnergyUnitLimit>        <energyConstraint lower=\"300.0\" upper=\"500.0\"/>        <tariffConstraint lower=\"300.0\" upper=\"500.0\"/>    </slices>    <slices durationSeconds=\"3600\">        <costPerEnergyUnitLimit>1.0</costPerEnergyUnitLimit>        <energyConstraint lower=\"300.0\" upper=\"500.0\"/>        <tariffConstraint lower=\"300.0\" upper=\"500.0\"/>    </slices>    <slices durationSeconds=\"3600\">        <costPerEnergyUnitLimit>1.0</costPerEnergyUnitLimit>        <energyConstraint lower=\"300.0\" upper=\"500.0\"/>        <tariffConstraint lower=\"300.0\" upper=\"500.0\"/>    </slices>    <flexOfferSchedule xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xsi:nil=\"true\"/>    <defaultSchedule startTime=\"2016-08-31T21:30:00+02:00\">        <energyAmounts>400.0</energyAmounts>        <energyAmounts>400.0</energyAmounts>        <energyAmounts>400.0</energyAmounts>        <energyAmounts>400.0</energyAmounts>        <startInterval>1636302</startInterval>    </defaultSchedule></flexOffer>'
var parser = new DOMParser()
var doc = parser.parseFromString(receivedXml, 'text/xml').childNodes[0]

var receivedOffer = new FlexOffer(doc)
console.log(receivedOffer.data)
console.log(receivedOffer.getSchedule())*/
