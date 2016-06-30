var express = require("express");
var path = require("path");
var fs = require("fs");

var app = express();

app.use(express.static("dist"));

app.get("/resources/:book/:name.html", function(req, res) {
  var content = fs.readFileSync(path.join("resources", req.params.book, req.params.name + ".html"), { encoding: "utf-8" });
  var jsUrl =
    process.env.NODE_ENV === "production" ?
    "/js/pagination.js" :
    "http://localhost:3002/js/pagination.js";
  var contentWithJs = content.replace(
    /<\/head>/,
    '<link href="/css/main.css" rel="stylesheet"></head>' +
    '<script src="' + jsUrl + '"></script>' +
    '<script src="/js/main.js"></script>'
  );
  res.send(contentWithJs);
});

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.use("/resources", express.static("resources"));

app.listen(3001, function() {
  console.log("Example app listening on port 3001!");
});