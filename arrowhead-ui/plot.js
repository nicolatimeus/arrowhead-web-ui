var Plot = function (id, xlabel, ylabel, title) {
  this.plotDiv = document.getElementById(id)
  this.maxPointCount = arrowheadConfig.graphMaxPointCount
  this.maxTimeWindow = arrowheadConfig.graphMaxTimeWindowMins*60*1000
  this.maxBufferSize = arrowheadConfig.graphMaxBufferSize
  this.timestamps = []
  this.y = []
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
  if (arrowheadConfig.graphInterval !== 'auto') {
    layout.yaxis.range = arrowheadConfig.graphInterval
  }
  var trace = {
    x: [],
    y: [],
    type: 'scatter'
  }
  if (arrowheadConfig.lineShape == 'spline') {
    trace.line = {shape: 'spline'}
  }
  Plotly.newPlot(this.plotDiv, [trace], layout, {displayModeBar: false});
}

Plot.prototype.update = function () {
  var subsample = Math.floor(this.timestamps.length / this.maxPointCount)

  if (subsample == 0) {
    this.plotDiv.data[0].x = this.timestamps
    this.plotDiv.data[0].y = this.y
  } else {
    subsample++
    var outTimestamps = []
    var outY = []
    for (var i = 0; i < this.timestamps.length; i += subsample) {
      var avgTimestampMs, avgY
      avgTimestampMs = 0
      avgY = 0
      var count = i+subsample < this.timestamps.length ? subsample : this.timestamps.length-i
      for (var j = i; j < i+count; j++) {
        avgTimestampMs += this.timestamps[j].getTime()
        avgY += this.y[j]
      }
      avgTimestampMs /= count
      avgY /= count
      outTimestamps[outTimestamps.length] = new Date(Math.floor(avgTimestampMs))
      outY[outY.length] = avgY
    }
    this.plotDiv.data[0].x = outTimestamps
    this.plotDiv.data[0].y = outY
  }
  Plotly.redraw(this.plotDiv)
}

Plot.prototype.push = function (timestamp, y) {
  if (!timestamp || !isFinite(timestamp)) return
  if (!y || !isFinite(y)) return
  
  if (this.timestamps.length && (timestamp - this.timestamps[0] > this.maxTimeWindow || this.timestamps.length > this.maxBufferSize)) {
    this.timestamps.splice(0, 1)
    this.y.splice(0, 1)
  }

  this.timestamps[this.timestamps.length] = timestamp
  this.y[this.y.length] = y
}
