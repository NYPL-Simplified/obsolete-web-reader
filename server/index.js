var express = require('express');
var path = require('path');
var fs = require('fs');

var app = express();

app.use(express.static('public'));

app.get('/resources/:book/:name.html', function(req, res) {
  var content = fs.readFileSync(path.join("resources", req.params.book, req.params.name + ".html"), { encoding: "utf-8" });
  var contentWithJs = content.replace(
    /<\/head>/,
    '<script src="/js/pages.js"></script><link href="/style/main.css" rel="stylesheet"></head>'
  );
  res.send(contentWithJs);
});

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.use("/resources", express.static('resources'));

app.listen(3001, function() {
  console.log('Example app listening on port 3001!');
});