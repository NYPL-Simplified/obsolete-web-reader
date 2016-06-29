interface PositionData {
  imageIndex: number;
  textNodeIndex: number;
  charIndex: number;
}

class Pages {
  body: HTMLElement;
  textNodes: Element[];
  images: Element[];
  margin: number;
  layoutPages: number;
  fontSize: number;
  bgColor: string;
  pageWidth: number;
  columnWidth: number;
  columnGap: number;
  bodyHeight: number;
  lastPage: number;
  currentPage: number;
  range: Range;
  pageCountInterval: number;

  constructor({ margin = 60, layoutPages = 1, fontSize = 30, bgColor = "#fff" } = {}) {
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

  // PUBLIC INTERFACE

  setFontSize(size: number): void {
    this.fontSize = size;
    this._render();
  }

  setMargin(margin: number): void {
    this.margin = margin;
    this._render();
  }

  setColumns(num: number): void {
    this.layoutPages = num;
    this._render();
  }

  setBackgroundColor(color: string) {
    this.bgColor = color;
    this._render();
  }

  prevPage(): number {
    return Math.max(0, this.currentPage - this.layoutPages);
  }

  nextPage(): number {
    return Math.min(this.lastPage, this.currentPage + this.layoutPages);
  }

  displayPage(n: number): number {
    return n + 1;
  }

  goToPrevPage(): void {
    this.goToPage(this.prevPage());
  }

  goToNextPage(): void {
    this.goToPage(this.nextPage());
  }

  goToPage(n: number): void {
    this.body.style.left = -n * (this.layoutPages * (this.columnWidth + this.margin)) + "px";
    this.currentPage = n;
    console.log(`moved to page ${n}`);
  }

  getPosition(): PositionData {
    // find first image with left edge on the current page
    let imageIndex = this._getImageIndex();

    // find first text node with left edge on the current page or a higher page
    let foundIndex = this._getTextNodeIndex();

    if (foundIndex === -1) {
      // if we found an image on this page but no text node, use the image
      if (imageIndex !== -1) {
        return this._imagePosition(imageIndex);
      }

      throw(`Can't find paragraph starting on page ${this.currentPage} or higher`);
    }

    // search in previous paragraph and found paragraph for text located
    // within current page
    let textNodeIndex = -1;
    let charIndex = -1;

    search:
    for (let i = Math.max(0, foundIndex - 1); i <= foundIndex; i++) {
      let textNode = this.textNodes[i];
      charIndex = 0;
      for (let j = 0; j < textNode.textContent.length; j++) {
        this.range.setStart(textNode, j);
        this.range.setEnd(textNode, j + 1);
        let { left, top } = this.range.getBoundingClientRect();
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

      throw(`Can't find any text in text nodes ${foundIndex - 1} or ${foundIndex} on page ${this.currentPage}`);
    }

    // if we found an image and a text node, use image if it's higher on the page
    if (imageIndex !== -1) {
      let imageTop = this.images[imageIndex].getBoundingClientRect().top;
      let textTop = this._getTextNodeRect(this.textNodes[textNodeIndex]).top;

      if (imageTop < textTop) {
        return this._imagePosition(imageIndex);
      }
    }

    return { imageIndex: null, textNodeIndex, charIndex };
  }

  goToPosition({ imageIndex, textNodeIndex, charIndex }: PositionData): void {
    let left;

    if (imageIndex) {
      let image = this.images[imageIndex];
      left = image.getBoundingClientRect().left;
    } else {
      let textNode = this.textNodes[textNodeIndex];
      this.range.setStart(textNode, charIndex);
      this.range.setEnd(textNode, charIndex + 1);
      left = this.range.getBoundingClientRect().left;
    }

    let page = this.currentPage + Math.floor(left / this.pageWidth);
    this.goToPage(page);
  }

  // PRIVATE METHODS

  _render(width?: number, height?: number): void {
    width = width || window.innerWidth;
    height = height || window.innerHeight;

    this.pageWidth = Math.floor(width / this.layoutPages);
    this.columnWidth = Math.floor((
      width // start with full width
      - 2 * this.margin // subtract actual margins
      - (this.layoutPages - 1) * this.margin // subtract margin again for each column gap
    ) / this.layoutPages); // divide remianing width by number of columns
    this.columnGap = this.margin;
    this.bodyHeight = height - 2 * this.margin;

    this._updateBodyStyle();
    this.goToPage(this.currentPage); // otherwise first page animation doesn't work
  }

  _queryString(object: any): string {
    // skip falsy values except for 0
    let keys = Object.keys(object).filter(key =>
      !!object[key] || object[key] === 0
    );

    let str = keys.map(key => {
      return encodeURIComponent(key) + "=" + encodeURIComponent(object[key]);
    }).join("&");

    return str ? "?" + str : "";
  }

  _simplifiedAjaxRequest(eventType, data): void {
    let request = new XMLHttpRequest();
    request.open("GET", `simplified://${eventType}${this._queryString(data)}`);
    request.send();
  }

  _setupTouchHandling(): void {
    window.addEventListener("keydown", e => {
      switch (e.key) {
        case "ArrowLeft":
          this.goToPrevPage();
          break;
        case "ArrowRight":
          this.goToNextPage();
          break;
      }

      // disable mobile scrolling with left/right arrows
      e.preventDefault();
    });

    // touch handling
    let touchProximity = 10;
    let touchStart = {} as any;

    window.addEventListener("touchstart", (e: TouchEvent) => {
      if (e.target["nodeName"] === "IMG") {
        this._simplifiedAjaxRequest("imageClick", {
          src: e.target["src"]
        });
        touchStart = {};
      } else if (e.target["nodeName"] === "A") {
        this._simplifiedAjaxRequest("linkClick", {
          href: e.target["href"]
        });
        touchStart = {};
      } else {
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
      }

      e.preventDefault();
    });

    window.addEventListener("touchend", (e: TouchEvent) => {
      if (touchStart.x && touchStart.y &&
          e.changedTouches[0].clientX - touchStart.x <= touchProximity &&
          e.changedTouches[0].clientY - touchStart.y <= touchProximity) {
        this._simplifiedAjaxRequest("readerTapEvent", {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY
        });
      }
      e.preventDefault();
    });

    // to disable mobile scrolling;
    window.addEventListener('touchmove', e => e.preventDefault());
  }

  _updateBodyStyle(): void {
    // set body width to correct for rounding errors
    this.body.style.width =
      this.layoutPages * this.columnWidth
      + (this.layoutPages - 1) * this.margin
      + "px";
    this.body.style.margin = this.margin + "px";
    this.body.style.height = this.bodyHeight + "px";
    this.body.style.columnWidth = this.columnWidth + "px";
    this.body.style.columnGap =  this.columnGap + "px";
    this.body.style.setProperty("font-size", this.fontSize + "px", "important");
    this.body.style.setProperty("background-color", this.bgColor, "important");
    this._updatePageCount();
  }

  // recalculates page count every half second until body is done rendering columns
  _updatePageCount(): void {
    this.pageCountInterval = setInterval(() => {
      let lastPage = Math.ceil(this.body.scrollWidth / this.pageWidth) - 1;
      if (lastPage === this.lastPage) {
        clearInterval(this.pageCountInterval);
        console.log(`setup ${this.displayPage(this.lastPage)} pages with ${this.layoutPages} columns`);
      } else {
        this.lastPage = lastPage;
      }
    }, 500);
  }

  _getImages(): Element[] {
    return Array.prototype.slice.call(document.querySelectorAll("img"));
  }

  _getTextNodes(element: Element = this.body): Element[] {
    let childNodes = Array.prototype.slice.call(element.childNodes);

    if (childNodes.length === 0) {
      return element.nodeType === Node.TEXT_NODE &&
             element.textContent.trim().length ?
             [element] : [];
    } else {
      return [].concat.apply([], childNodes.map(node => this._getTextNodes(node)));
    }
  }

  _getTextNodeRect(node: Element): ClientRect {
    this.range.setStart(node, 0);
    this.range.setEnd(node, node.textContent.length - 1);
    return this.range.getBoundingClientRect();
  }

  _getTextNodeIndex(): number {
    return (this.textNodes as any).findIndex(textNode => {
      return this._getTextNodeRect(textNode).left > 0;
    });
  }

  _getImageIndex(): number {
    return (this.images as any).findIndex(image => {
      return image.getBoundingClientRect().left > 0;
    });
  }

  _imagePosition(imageIndex: number): PositionData {
    return { imageIndex, textNodeIndex: null, charIndex: null };
  }
}

let pages;

document.addEventListener("DOMContentLoaded", () => {
  pages = new Pages();
});