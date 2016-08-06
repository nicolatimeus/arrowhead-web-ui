var arrowheadConfig = require('./arrowhead-config.js')

var proxy = require('express-http-proxy');

var app = require('express')();

var forwarder = proxy(arrowheadConfig.bookingBaseUri, {
  decorateRequest: function(proxyReq, originalReq) {
    console.log(proxyReq)
    proxyReq.method = 'GET';
  }
})

app.use('/', forwarder)

app.listen(1234, function () {
  console.log('rest proxy running on port 1234');
});
