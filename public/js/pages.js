var Pages = (function () {
    function Pages(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.margin, margin = _c === void 0 ? 50 : _c, _d = _b.layoutPages, layoutPages = _d === void 0 ? 1 : _d, _e = _b.fontSize, fontSize = _e === void 0 ? 30 : _e;
        this.body = document.getElementsByTagName("body").item(0);
        this.body.style.position = "relative";
        this.body.style.overflow = "hidden";
        this.body.style.transition = "left 0.5s";
        this.body.style.fontSize = fontSize + "px";
        this.margin = margin;
        this.layoutPages = layoutPages;
        this.currentPage = 0;
        this.setupColumns();
    }
    Pages.prototype.setupColumns = function () {
        this.pageWidth = Math.floor(window.innerWidth / this.layoutPages);
        this.columnWidth = this.pageWidth - 2 * this.margin;
        this.columnGap = 2 * this.margin;
        this.bodyHeight = window.innerHeight - 2 * this.margin;
        this.body.style.margin = this.margin + "px";
        this.body.style.height = this.bodyHeight + "px";
        this.body.style.columnWidth = this.columnWidth + "px";
        this.body.style.columnGap = this.columnGap + "px";
        this.lastPage = Math.ceil(this.body.scrollWidth / this.pageWidth) - 1;
        console.log("setup " + this.displayPage(this.lastPage) + " pages with " + this.layoutPages + " columns");
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
    Pages.prototype.getParagraphFromPage = function (n) {
        var minLeft = n * this.pageWidth;
        var ary = Array.prototype.slice.call(document.querySelectorAll("p"));
        return 0;
    };
    Pages.prototype.getPosition = function () {
        return {
            paragraphIndex: this.getParagraphFromPage(this.currentPage),
            text: null,
            textIndex: null
        };
    };
    Pages.prototype.loadPosition = function (position) {
    };
    return Pages;
}());
document.addEventListener("DOMContentLoaded", function () {
    var pages = new Pages();
    window.addEventListener("resize", function (e) {
        var position = pages.getPosition();
        pages.setupColumns();
        pages.loadPosition(position);
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
