var express = require('express');
var path = require('path');
var fs = require('fs');

var app = express();

app.use(express.static('public'));

app.get('/resources/:name', function(req, res) {
  var content = fs.readFileSync(path.join("resources", req.params.name), { encoding: "utf-8" });
  console.log(content);
  var contentWithJs = content.replace(/<\/head>/, '<script src="/js/pages.js"></script></head>');
  res.send(contentWithJs);
});

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.listen(3001, function() {
  console.log('Example app listening on port 3001!');
});