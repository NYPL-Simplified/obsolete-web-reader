var Pages = (function () {
    function Pages(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.margin, margin = _c === void 0 ? 50 : _c, _d = _b.layoutPages, layoutPages = _d === void 0 ? 1 : _d, _e = _b.fontSize, fontSize = _e === void 0 ? 20 : _e;
        this.margin = margin;
        this.currentPage = 0;
        this.currentPosition = { textNodeIndex: 0, charIndex: 0 };
        this.body = document.getElementsByTagName("body").item(0);
        this.body.style.position = "relative";
        this.body.style.overflow = "hidden";
        this.body.style.margin = this.margin + "px";
        this.body.style.transition = "left 0.5s";
        this.textNodes = this.getTextNodes(this.body);
        this.range = document.createRange();
        this.setFontSize(fontSize);
        this.setLayoutPages(layoutPages);
        this.render();
    }
    Pages.prototype.render = function (width, height) {
        width = width || window.innerWidth;
        height = height || window.innerHeight;
        this.pageWidth = Math.floor(width / this.layoutPages);
        this.columnWidth = this.pageWidth - 2 * this.margin;
        this.columnGap = 2 * this.margin;
        this.bodyHeight = height - 2 * this.margin;
        this.updateBodyStyle();
        this.lastPage = Math.ceil(this.body.scrollWidth / this.pageWidth) - 1;
        console.log("setup " + this.displayPage(this.lastPage) + " pages with " + this.layoutPages + " columns");
    };
    Pages.prototype.updateBodyStyle = function () {
        this.body.style.height = this.bodyHeight + "px";
        this.body.style.columnWidth = this.columnWidth + "px";
        this.body.style.columnGap = this.columnGap + "px";
        this.body.style.setProperty("font-size", this.fontSize + "px", "important");
    };
    Pages.prototype.setFontSize = function (size) {
        this.fontSize = size;
    };
    Pages.prototype.setLayoutPages = function (num) {
        this.layoutPages = num;
    };
    Pages.prototype.prevPage = function () {
        return Math.max(0, this.currentPage - this.layoutPages);
    };
    Pages.prototype.nextPage = function () {
        return Math.min(this.lastPage, this.currentPage + this.layoutPages);
    };
    Pages.prototype.displayPage = function (n) {
        return n + 1;
    };
    Pages.prototype.goToPrevPage = function () {
        this.goToPage(this.prevPage());
    };
    Pages.prototype.goToNextPage = function () {
        this.goToPage(this.nextPage());
    };
    Pages.prototype.goToPage = function (n) {
        this.body.style.left = -n * this.pageWidth + "px";
        this.currentPage = n;
        this.saveCurrentPosition();
        console.log("moved to page " + n);
    };
    Pages.prototype.goToParagraph = function (n) {
        this.goToPage(this.getPageFromParagraph(n));
    };
    Pages.prototype.getPageFromParagraph = function (n) {
        var para = document.querySelectorAll("p").item(n);
        var box = para.getBoundingClientRect();
        return this.currentPage + Math.floor(box.left / (this.pageWidth * this.layoutPages));
    };
    Pages.prototype.getTextNodes = function (element) {
        var _this = this;
        var childNodes = Array.prototype.slice.call(element.childNodes);
        if (childNodes.length === 0) {
            return element.nodeType === Node.TEXT_NODE &&
                element.textContent.trim().length ?
                [element] : [];
        }
        else {
            return [].concat.apply([], childNodes.map(function (node) { return _this.getTextNodes(node); }));
        }
    };
    Pages.prototype.getTextNodeRect = function (node) {
        this.range.setStart(node, 0);
        this.range.setEnd(node, node.textContent.length - 1);
        return this.range.getBoundingClientRect();
    };
    Pages.prototype.getTextNodeIndex = function () {
        var _this = this;
        return this.textNodes.findIndex(function (textNode) {
            return _this.getTextNodeRect(textNode).left > 0;
        });
    };
    Pages.prototype.getPosition = function () {
        var foundIndex = this.getTextNodeIndex();
        if (foundIndex === -1) {
            throw ("Can't find paragraph starting on page " + this.currentPage + " or higher");
        }
        if (foundIndex === 0) {
            return { textNodeIndex: 0, charIndex: 0 };
        }
        var textNodeIndex = -1;
        var charIndex = -1;
        search: for (var i = foundIndex - 1; i <= foundIndex; i++) {
            var textNode = this.textNodes[i];
            charIndex = 0;
            for (var j = 0; j < textNode.textContent.length; j++) {
                this.range.setStart(textNode, j);
                this.range.setEnd(textNode, j + 1);
                var left = this.range.getBoundingClientRect().left;
                if (0 < left && left < this.pageWidth) {
                    textNodeIndex = i;
                    break search;
                }
                charIndex += 1;
            }
        }
        if (textNodeIndex === -1) {
            throw ("Can't find any text in text nodes " + (textNodeIndex - 1) + " or " + textNodeIndex + " on page " + this.currentPage);
        }
        return { textNodeIndex: textNodeIndex, charIndex: charIndex };
    };
    Pages.prototype.saveCurrentPosition = function () {
        this.currentPosition = this.getPosition();
        var pos = this.currentPosition;
        console.log("saved current position to textNodeIndex " + pos.textNodeIndex + " and charIndex " + pos.charIndex);
    };
    Pages.prototype.goToPosition = function (_a) {
        var textNodeIndex = _a.textNodeIndex, charIndex = _a.charIndex;
        var textNode = this.textNodes[textNodeIndex];
        this.range.setStart(textNode, charIndex);
        this.range.setEnd(textNode, charIndex + 1);
        var left = this.range.getBoundingClientRect().left;
        var page = this.currentPage + Math.floor(left / this.pageWidth);
        this.goToPage(page);
    };
    Pages.prototype.showPosition = function () {
        var textNode = this.textNodes[this.currentPosition.textNodeIndex];
        this.range.setStart(textNode, this.currentPosition.charIndex);
        this.range.setEnd(textNode, this.currentPosition.charIndex + 1);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(this.range);
    };
    Pages.prototype.hidePosition = function () {
        var selection = window.getSelection();
        selection.removeAllRanges();
    };
    return Pages;
}());
var pages;
document.addEventListener("DOMContentLoaded", function () {
    pages = new Pages();
    var resizeTimer;
    var that = this;
    window.addEventListener("resize", function (e) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            pages.render();
            pages.goToPosition(pages.currentPosition);
            pages.saveCurrentPosition();
        }, 250);
    });
    window.addEventListener("keydown", function (e) {
        switch (e.key) {
            case "ArrowLeft":
                pages.goToPrevPage();
                break;
            case "ArrowRight":
                pages.goToNextPage();
                break;
        }
    });
});
