var CanvasPlot = function (id, xlabel, ylabel, title) {
  this.xlabel = xlabel
  this.ylabel = ylabel
  this.title = title

  this.plotDiv = document.getElementById(id)
  this.plotWrapper = document.createElement('div')
  this.plotWrapper.classList.add('graph-canvas-wrapper')

  this.canvas = document.createElement('canvas')
  this.canvas.setAttribute('width', arrowheadConfig.graphCanvasWidth)
  this.canvas.setAttribute('height', arrowheadConfig.graphCanvasHeight)
  this.canvas.classList.add('graph-canvas')
  this.context = this.canvas.getContext('2d')
  this.context.mozImageSmoothingEnabled = false
  this.context.imageSmoothingEnabled = false

  this.plotWrapper.appendChild(this.canvas)
  this.plotDiv.appendChild(this.plotWrapper)

  this.context.strokeStyle = 'blue'
  this.context.fillStyle='white'
  this.context.fillRect(0, 0, arrowheadConfig.graphCanvasWidth, arrowheadConfig.graphCanvasHeight)

  this.yRange = arrowheadConfig.graphInterval
  this.xStart = 0
  this.lastPoint = null

  this.mode = arrowheadConfig.graphCanvasMode

  if (this.mode === 'scale+translate') {
    this.mode = 'scale'
  }

  this.translateWinSize = arrowheadConfig.graphCanvasWindowMaxHours*1000*60*60

  this.initLabels()

}

CanvasPlot.prototype.initLabels = function () {
  this.xLabels = []
  for (var i=0; i<arrowheadConfig.graphCanvasXLabelCount; i++) {
    this.xLabels[i] = document.createElement('div')
    this.xLabels[i].classList.add('canvas-x-label')
    this.xLabels[i].style.left = i * (100/arrowheadConfig.graphCanvasXLabelCount)+'%'
    this.plotWrapper.appendChild(this.xLabels[i])
  }
  var xTitle = document.createElement('div')
  xTitle.classList.add('canvas-x-title')
  xTitle.textContent = this.xlabel
  this.plotWrapper.appendChild(xTitle)

  var yLabelsWrapper = document.createElement('div')
  yLabelsWrapper.classList.add('canvas-y-label-wrapper')
  this.plotWrapper.appendChild(yLabelsWrapper)

  this.yLabels = []
  var pInc = arrowheadConfig.graphCanvasYLabelStep/this.yRange[1]*100
  var i = 1
  for(var p = pInc; p <= 100; p+=pInc) {
    this.yLabels[i] = document.createElement('div')
    this.yLabels[i].classList.add('canvas-y-label')
    this.yLabels[i].style.bottom = p+'%'
    this.yLabels[i].textContent = i*arrowheadConfig.graphCanvasYLabelStep
    yLabelsWrapper.appendChild(this.yLabels[i])
    i++
  }

  var title = document.createElement('div')
  title.classList.add('graph-title')
  title.textContent = this.title

  this.plotWrapper.appendChild(title)
}

CanvasPlot.prototype.updateXLabels = function () {
  if (!this.lastPoint)
    return
  var t = this.xStart
  var inc = (this.lastPoint.x - t) / arrowheadConfig.graphCanvasXLabelCount
  for (var i=0; i<arrowheadConfig.graphCanvasXLabelCount; i++) {
    var d = new Date(t)
    this.xLabels[i].textContent = d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()
    t += inc
  }
}

CanvasPlot.prototype.update = function () {

}

CanvasPlot.prototype.push = function (timestamp, y) {
  var x = timestamp.getTime()
  if (this.lastPoint && x < this.lastPoint.x)
    return

  if (!this.lastPoint) {
    this.lastPoint = {
      x: x,
      y: y
    }
    this.xStart = x
    return
  }

  if (arrowheadConfig.graphCanvasMode === 'scale+translate' && x - this.xStart>= this.translateWinSize) {
    this.mode = 'translate'
  }

  if (this.mode === 'translate') {
    this.xStart = x - this.translateWinSize
  }

  var lastRelPoint = {
    x: (this.lastPoint.x-this.xStart)/(x-this.xStart),
    y: (this.lastPoint.y-this.yRange[0])/(this.yRange[1]-this.yRange[0])
  }

  var relY = (y-this.yRange[0])/(this.yRange[1]-this.yRange[0])

  this.context.resetTransform()
  if (this.mode === 'scale') {
  this.context.drawImage(this.canvas, 0, 0,
    arrowheadConfig.graphCanvasWidth, arrowheadConfig.graphCanvasHeight,
    0, 0,
    lastRelPoint.x*arrowheadConfig.graphCanvasWidth, arrowheadConfig.graphCanvasHeight)
  } else if (this.mode === 'translate') {
    this.context.drawImage(this.canvas, 0, 0,
      arrowheadConfig.graphCanvasWidth, arrowheadConfig.graphCanvasHeight,
      (lastRelPoint.x-1)*arrowheadConfig.graphCanvasWidth, 0,
      arrowheadConfig.graphCanvasWidth, arrowheadConfig.graphCanvasHeight)
  }
  this.context.translate(0, arrowheadConfig.graphCanvasHeight)
  this.context.scale(arrowheadConfig.graphCanvasWidth, -arrowheadConfig.graphCanvasHeight)
  this.context.lineWidth=0.002;

  this.context.fillRect(lastRelPoint.x, 0, 1-lastRelPoint.x, 1)

  if (!arrowheadConfig.graphBreakIntervalMs || (x - this.lastPoint.x < arrowheadConfig.graphBreakIntervalMs)) {
    this.context.beginPath();
    this.context.moveTo(lastRelPoint.x,lastRelPoint.y);
    this.context.lineTo(1,relY);
    this.context.stroke();
  }

  this.lastPoint = {
    x: x,
    y: y
  }

  this.updateXLabels()
}
