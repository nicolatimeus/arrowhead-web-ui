var Plot = function (id, xlabel, ylabel, title) {
  this.plotDiv = document.getElementById(id)
  this.maxPointCount = arrowheadConfig.graphMaxPointCount
  this.maxTimeWindow = arrowheadConfig.graphMaxTimeWindowMins*60*1000
  this.maxBufferSize = arrowheadConfig.graphMaxBufferSize
  this.tracks = []
  this.y = []
  this.pointCount = 0
  var layout = {
    title: title,
    showlegend: false,
    xaxis: {
        title: xlabel
    },
    yaxis: {
        title: ylabel
    }

  }
  layout.yaxis.range = plotSettings.yRange
  var trace = {
    x: [],
    y: [],
    type: 'lines'
  }
  if (arrowheadConfig.lineShape == 'spline') {
    trace.line = {shape: 'spline', color: 'blue'}
  }
  Plotly.newPlot(this.plotDiv, [trace], layout, {displayModeBar: false});
}

Plot.prototype.update = function () {
  var subsample = Math.floor(this.pointCount / this.maxPointCount)

  if (subsample == 0) {
    this.plotDiv.data = this.tracks
  } else {
    subsample++

    //var filteredY=[this.y[0]]
    //var winSize = (this.timestamps[this.timestamps.length-1].getTime()-this.timestamps[0].getTime())
    //var filterC = 2*Math.PI*arrowheadConfig.graphMaxPointCount/winSize

    //for (var i=1; i<this.timestamps.length; i++) {
    //  filteredY[i] = filteredY[i-1] + filterC*(this.y[i] - filteredY[i-1])
    //}

    var resultTracks = []
    var self = this

    this.tracks.forEach(function (track, i) {
      resultTracks[resultTracks.length] = self.subsample(track.x, track.y, subsample, true)
    })

    this.plotDiv.data = resultTracks
  }
  Plotly.redraw(this.plotDiv)
}

Plot.prototype.subsample = function (x, y, subsample, skipLast) {
  var result = {
    y: [],
    x: [],
    type: 'lines',
    line: {
    color: 'blue'
    }
  }
  console.log(subsample)

  var end = skipLast ? Math.floor(x.length/subsample)*subsample : x.length
  if (!end) end = x.length

  for (var i = 0; i < end; i += subsample) {
    var avgTimestampMs, avgY
    avgTimestampMs = 0
    avgY = 0
    var count = ((i+subsample) < x.length) ? subsample : x.length-i
    for (var j = i; j < i+count; j++) {
      avgTimestampMs += x[j].getTime()
      avgY += y[j]
    }
    avgTimestampMs /= count
    avgY /= count
    result.x[result.x.length] = new Date(Math.floor(avgTimestampMs))
    result.y[result.y.length] = avgY
  }
  return result
}

Plot.prototype.getFirstTrack = function () {
  return this.tracks[0]
}

Plot.prototype.getLastTrack = function () {
  return this.tracks[this.tracks.length-1]
}

Plot.prototype.removeOldestPoint = function() {
  var firstTrack = this.getFirstTrack()

  firstTrack.x.splice(0, 1)
  firstTrack.y.splice(0, 1)

  if (!firstTrack.x.length)
    tracks.splice(0,1)

  this.pointCount--
}

Plot.prototype.createNewTrack = function (timestamp, y) {
  var newTrack = {
    x: [timestamp],
    y: [y],
    type: 'lines',
    line: {
    color: 'blue'
    }
  }

  this.tracks[this.tracks.length] = newTrack
  this.pointCount++
}

Plot.prototype.push = function (timestamp, y) {
  if (!timestamp || !isFinite(timestamp)) return
  if (typeof(y) === 'string') y = parseFloat(y)
  if (!y || !isFinite(y)) return

  if (!this.tracks.length) {
    this.createNewTrack(timestamp, y)
    return
  }

  var firstTrack = this.getFirstTrack()
  var lastTrack = this.getLastTrack()

  var deltaT = timestamp.getTime() - lastTrack.x[lastTrack.x.length-1].getTime()

  if (deltaT <= 0) return

  if ((lastTrack.x[lastTrack.x.length-1].getTime() - firstTrack.x[0].getTime()) > this.maxTimeWindow
  || this.pointCount >= arrowheadConfig.graphMaxBufferSize)
    this.removeOldestPoint()

  if (deltaT > arrowheadConfig.graphBreakIntervalMs) {
    this.createNewTrack(timestamp, y)
  }
  else {
    lastTrack.y[lastTrack.y.length] = y
    lastTrack.x[lastTrack.x.length] = timestamp
    this.pointCount++
  }

}
