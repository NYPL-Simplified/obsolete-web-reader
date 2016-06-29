var Pages = (function () {
    function Pages(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.margin, margin = _c === void 0 ? 60 : _c, _d = _b.layoutPages, layoutPages = _d === void 0 ? 1 : _d, _e = _b.fontSize, fontSize = _e === void 0 ? 30 : _e, _f = _b.bgColor, bgColor = _f === void 0 ? "#fff" : _f;
        this.margin = margin;
        this.layoutPages = layoutPages;
        this.fontSize = fontSize;
        this.bgColor = bgColor;
        this.currentPage = 0;
        this.body = document.getElementsByTagName("body").item(0);
        this.textNodes = this._getTextNodes();
        this.images = this._getImages();
        this.range = document.createRange();
        this._setupTouchHandling();
        this._render();
    }
    Pages.prototype.setFontSize = function (size) {
        this.fontSize = size;
        this._render();
    };
    Pages.prototype.setMargin = function (margin) {
        this.margin = margin;
        this._render();
    };
    Pages.prototype.setColumns = function (num) {
        this.layoutPages = num;
        this._render();
    };
    Pages.prototype.setBackgroundColor = function (color) {
        this.bgColor = color;
        this._render();
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
        this.body.style.left = -n * (this.layoutPages * (this.columnWidth + this.margin)) + "px";
        this.currentPage = n;
        console.log("moved to page " + n);
    };
    Pages.prototype.getPosition = function () {
        var imageIndex = this._getImageIndex();
        var foundIndex = this._getTextNodeIndex();
        if (foundIndex === -1) {
            if (imageIndex !== -1) {
                return this._imagePosition(imageIndex);
            }
            throw ("Can't find paragraph starting on page " + this.currentPage + " or higher");
        }
        var textNodeIndex = -1;
        var charIndex = -1;
        search: for (var i = Math.max(0, foundIndex - 1); i <= foundIndex; i++) {
            var textNode = this.textNodes[i];
            charIndex = 0;
            for (var j = 0; j < textNode.textContent.length; j++) {
                this.range.setStart(textNode, j);
                this.range.setEnd(textNode, j + 1);
                var _a = this.range.getBoundingClientRect(), left = _a.left, top_1 = _a.top;
                if (0 < left && left < this.pageWidth) {
                    textNodeIndex = i;
                    break search;
                }
                charIndex += 1;
            }
        }
        if (textNodeIndex === -1) {
            if (imageIndex !== -1) {
                return this._imagePosition(imageIndex);
            }
            throw ("Can't find any text in text nodes " + (foundIndex - 1) + " or " + foundIndex + " on page " + this.currentPage);
        }
        if (imageIndex !== -1) {
            var imageTop = this.images[imageIndex].getBoundingClientRect().top;
            var textTop = this._getTextNodeRect(this.textNodes[textNodeIndex]).top;
            if (imageTop < textTop) {
                return this._imagePosition(imageIndex);
            }
        }
        return { imageIndex: null, textNodeIndex: textNodeIndex, charIndex: charIndex };
    };
    Pages.prototype.goToPosition = function (_a) {
        var imageIndex = _a.imageIndex, textNodeIndex = _a.textNodeIndex, charIndex = _a.charIndex;
        var left;
        if (imageIndex) {
            var image = this.images[imageIndex];
            left = image.getBoundingClientRect().left;
        }
        else {
            var textNode = this.textNodes[textNodeIndex];
            this.range.setStart(textNode, charIndex);
            this.range.setEnd(textNode, charIndex + 1);
            left = this.range.getBoundingClientRect().left;
        }
        var page = this.currentPage + Math.floor(left / this.pageWidth);
        this.goToPage(page);
    };
    Pages.prototype._render = function (width, height) {
        width = width || window.innerWidth;
        height = height || window.innerHeight;
        this.pageWidth = Math.floor(width / this.layoutPages);
        this.columnWidth = Math.floor((width
            - 2 * this.margin
            - (this.layoutPages - 1) * this.margin) / this.layoutPages);
        this.columnGap = this.margin;
        this.bodyHeight = height - 2 * this.margin;
        this._updateBodyStyle();
        this.goToPage(this.currentPage);
    };
    Pages.prototype._queryString = function (object) {
        var keys = Object.keys(object).filter(function (key) {
            return !!object[key] || object[key] === 0;
        });
        var str = keys.map(function (key) {
            return encodeURIComponent(key) + "=" + encodeURIComponent(object[key]);
        }).join("&");
        return str ? "?" + str : "";
    };
    Pages.prototype._simplifiedAjaxRequest = function (eventType, data) {
        var request = new XMLHttpRequest();
        request.open("GET", "simplified://" + eventType + this._queryString(data));
        request.send();
    };
    Pages.prototype._setupTouchHandling = function () {
        var _this = this;
        window.addEventListener("keydown", function (e) {
            switch (e.key) {
                case "ArrowLeft":
                    _this.goToPrevPage();
                    break;
                case "ArrowRight":
                    _this.goToNextPage();
                    break;
            }
            e.preventDefault();
        });
        var touchProximity = 10;
        var touchStart = {};
        window.addEventListener("touchstart", function (e) {
            if (e.target["nodeName"] === "IMG") {
                _this._simplifiedAjaxRequest("imageClick", {
                    src: e.target["src"]
                });
                touchStart = {};
            }
            else if (e.target["nodeName"] === "A") {
                _this._simplifiedAjaxRequest("linkClick", {
                    href: e.target["href"]
                });
                touchStart = {};
            }
            else {
                touchStart.x = e.touches[0].clientX;
                touchStart.y = e.touches[0].clientY;
            }
            e.preventDefault();
        });
        window.addEventListener("touchend", function (e) {
            if (touchStart.x && touchStart.y &&
                e.changedTouches[0].clientX - touchStart.x <= touchProximity &&
                e.changedTouches[0].clientY - touchStart.y <= touchProximity) {
                _this._simplifiedAjaxRequest("readerTapEvent", {
                    x: e.changedTouches[0].clientX,
                    y: e.changedTouches[0].clientY
                });
            }
            e.preventDefault();
        });
        window.addEventListener('touchmove', function (e) { return e.preventDefault(); });
    };
    Pages.prototype._updateBodyStyle = function () {
        this.body.style.width =
            this.layoutPages * this.columnWidth
                + (this.layoutPages - 1) * this.margin
                + "px";
        this.body.style.margin = this.margin + "px";
        this.body.style.height = this.bodyHeight + "px";
        this.body.style.columnWidth = this.columnWidth + "px";
        this.body.style.columnGap = this.columnGap + "px";
        this.body.style.setProperty("font-size", this.fontSize + "px", "important");
        this.body.style.setProperty("background-color", this.bgColor, "important");
        this._updatePageCount();
    };
    Pages.prototype._updatePageCount = function () {
        var _this = this;
        this.pageCountInterval = setInterval(function () {
            var lastPage = Math.ceil(_this.body.scrollWidth / _this.pageWidth) - 1;
            if (lastPage === _this.lastPage) {
                clearInterval(_this.pageCountInterval);
                console.log("setup " + _this.displayPage(_this.lastPage) + " pages with " + _this.layoutPages + " columns");
            }
            else {
                _this.lastPage = lastPage;
            }
        }, 500);
    };
    Pages.prototype._getImages = function () {
        return Array.prototype.slice.call(document.querySelectorAll("img"));
    };
    Pages.prototype._getTextNodes = function (element) {
        var _this = this;
        if (element === void 0) { element = this.body; }
        var childNodes = Array.prototype.slice.call(element.childNodes);
        if (childNodes.length === 0) {
            return element.nodeType === Node.TEXT_NODE &&
                element.textContent.trim().length ?
                [element] : [];
        }
        else {
            return [].concat.apply([], childNodes.map(function (node) { return _this._getTextNodes(node); }));
        }
    };
    Pages.prototype._getTextNodeRect = function (node) {
        this.range.setStart(node, 0);
        this.range.setEnd(node, node.textContent.length - 1);
        return this.range.getBoundingClientRect();
    };
    Pages.prototype._getTextNodeIndex = function () {
        var _this = this;
        return this.textNodes.findIndex(function (textNode) {
            return _this._getTextNodeRect(textNode).left > 0;
        });
    };
    Pages.prototype._getImageIndex = function () {
        return this.images.findIndex(function (image) {
            return image.getBoundingClientRect().left > 0;
        });
    };
    Pages.prototype._imagePosition = function (imageIndex) {
        return { imageIndex: imageIndex, textNodeIndex: null, charIndex: null };
    };
    return Pages;
}());
var pages;
document.addEventListener("DOMContentLoaded", function () {
    pages = new Pages();
});
