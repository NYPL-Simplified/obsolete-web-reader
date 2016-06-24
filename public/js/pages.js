console.log("pages.js");


document.addEventListener('DOMContentLoaded', function() {

  var margin = 10;
  var width = window.innerWidth;
  var height = window.innerHeight;
  var columnWidth = Math.round(width/2) - 2 * margin;
  var bodyHeight = height - 2 * margin;
  var body = document.getElementsByTagName("body").item(0);
  body.style.margin = margin + "px";
  body.style.height = bodyHeight + "px";
  body.style.columnWidth = columnWidth + "px";
  body.style.columnGap = 2 * margin + "px";

  var paras = document.querySelectorAll("p");
  var para = paras[paras.length-1];
  console.log(para.innerHTML);
  var box = para.getBoundingClientRect();
  body.style.left = -box.left + "px";

  window.addEventListener("scroll", function(e) {
    console.log("scrolling");
  });

});