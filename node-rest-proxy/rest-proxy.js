var arrowheadConfig = require('./arrowhead-config.js')

var translatePaths = [ '/treservations/onthefly' ]

var proxy = require('express-http-proxy');

var app = require('express')();

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

var forwarder = proxy(arrowheadConfig.bookingBaseUri, {
  decorateRequest: function(proxyReq, originalReq) {

    translatePaths.forEach(function (path) {
      if (proxyReq.path.indexOf(path) !== -1)
        proxyReq.method = 'GET';
    })

  }
})

app.use('/', allowCrossDomain)
app.use('/', forwarder)


app.listen(1234, function () {
  console.log('rest proxy running on port 1234');
});
