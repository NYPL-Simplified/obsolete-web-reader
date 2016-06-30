export interface PositionData {
  imageIndex: number;
  textNodeIndex: number;
  charIndex: number;
}

export interface PagesConfig {
  margin?: number;
  columns?: number;
  fontSize?: number;
  bgColor?: string;
}

export default class Pages {
  body: HTMLElement;
  textNodes: Element[];
  images: Element[];
  margin: number;
  columns: number;
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

  constructor(config: PagesConfig = {}) {
    this.margin = config.margin || 60;
    this.columns = config.columns || 1;
    this.fontSize = config.fontSize || 30;
    this.bgColor = config.bgColor || "#fff";
    this.currentPage = 0;

    this.body = document.getElementsByTagName("body").item(0);

    this.textNodes = this._getTextNodes();
    this.images = this._getImages();
    this.range = document.createRange();

    this._setupKeyHandling();
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
    this.columns = num;
    this._render();
  }

  setBackgroundColor(color: string) {
    this.bgColor = color;
    this._render();
  }

  goToPrevPage(): void {
    this._goToPage(this._prevPage());
  }

  goToNextPage(): void {
    this._goToPage(this._nextPage());
  }

  getCurrentPage(): number {
    return this.currentPage + 1;
  }

  getPageCount(): number {
    return this.lastPage + 1;
  }

  getPosition(): PositionData {
    // find first image with left edge on the current page
    let imageIndex = this._getImageIndex();

    // find first text node with left edge on the current page or a higher page
    let foundTextNodeIndex = this._getTextNodeIndex();

    // if we didn't find a text node on this page
    if (foundTextNodeIndex === -1) {
      // if we found an image, use the image
      if (imageIndex !== -1) {
        return this._imagePosition(imageIndex);
      }

      // if nothing's on this page, something's wrong
      throw(
        `Can't find paragraph or image starting ` +
        `on page ${this.currentPage} or higher`
      );
    }

    // ok we found a text node beginning on this page, but the previous text
    // node (if it exists) might end on this page. so we search both text nodes
    // for the first character that appears on this page
    let textNodeIndexes: number[] =
      foundTextNodeIndex === 0 ?
      [foundTextNodeIndex] :
      [foundTextNodeIndex - 1, foundTextNodeIndex];

    let [textNodeIndex, charIndex] = textNodeIndexes.reduce((result, index) => {
      if (result[1] !== -1) {
        return result;
      } else {
        return [
          index,
          this._findCharOnCurrentPage(this.textNodes[index])
        ]
      }
    }, [-1, -1]);

    // if we didn't find a character on this page
    if (charIndex === -1) {
      // if we found an image, use the image
      if (imageIndex !== -1) {
        return this._imagePosition(imageIndex);
      }

      // we found neither character nor image, something went wrong
      throw(
        `Can't find any text in text nodes ${foundTextNodeIndex - 1} or ` +
        `${foundTextNodeIndex} on page ${this.currentPage}`
      );
    }

    // if we found an image and a character, use the one that's higher on the page
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
    this._goToPage(page);
  }

  // PRIVATE METHODS

  _render(width?: number, height?: number): void {
    width = width || window.innerWidth;
    height = height || window.innerHeight;

    this.columnWidth = Math.floor((
      width // start with full width
      - 2 * this.margin // subtract actual margins
      - (this.columns - 1) * this.margin // subtract margin again for each column gap
    ) / this.columns); // divide remianing width by number of columns
    this.columnGap = this.margin;
    this.pageWidth = this.columns * (this.columnWidth + this.margin);
    this.bodyHeight = height - 2 * this.margin;

    this._updateBodyStyle();
    this._goToPage(this.currentPage); // otherwise first page animation doesn't work
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

  _sendSimplifiedRequest(eventType, data): void {
    let request = new XMLHttpRequest();
    request.open("GET", `simplified://${eventType}${this._queryString(data)}`);
    request.send();
  }

  _setupKeyHandling(): void {
    window.addEventListener("keydown", e => {
      switch (e.key) {
        case "ArrowLeft":
          this.goToPrevPage();
          e.preventDefault();
          break;
        case "ArrowRight":
          this.goToNextPage();
          e.preventDefault();
          break;
      }
    });
  }

  _setupTouchHandling(): void {
    let touchProximity = 10;
    let touchStart = {} as any;

    window.addEventListener("touchstart", (e: TouchEvent) => {
      touchStart.x = e.touches[0].clientX;
      touchStart.y = e.touches[0].clientY;
      e.preventDefault();
    });

    window.addEventListener("touchend", (e: TouchEvent) => {
      if (e.target["nodeName"] === "IMG") {
        this._sendSimplifiedRequest("imageClick", {
          src: e.target["src"]
        });
      } else if (e.target["nodeName"] === "A" && e.target["href"]) {
        this._sendSimplifiedRequest("linkClick", {
          href: e.target["href"]
        });
      } else {
        if (touchStart.x && touchStart.y &&
            e.changedTouches[0].clientX - touchStart.x <= touchProximity &&
            e.changedTouches[0].clientY - touchStart.y <= touchProximity) {
          this._sendSimplifiedRequest("readerTapEvent", {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
          });
        }
      }

      e.preventDefault();
    });

    // to disable mobile scrolling;
    window.addEventListener('touchmove', e => e.preventDefault());
  }

  _updateBodyStyle(): void {
    // set body width to correct for rounding errors
    this.body.style.width =
      this.columns * this.columnWidth
      + (this.columns - 1) * this.margin
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
        console.log(`setup ${this.lastPage + 1} pages with ${this.columns} columns`);
      } else {
        this.lastPage = lastPage;
      }
    }, 500);
  }

  _prevPage(): number {
    return Math.max(0, this.currentPage - this.columns);
  }

  _nextPage(): number {
    return Math.min(this.lastPage, this.currentPage + this.columns);
  }

  _goToPage(n: number): void {
    this.body.style.left = -n * this.pageWidth + "px";
    this.currentPage = n;
    console.log(`moved to page ${n}`);
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

  _findCharOnCurrentPage(textNode: Element): number {
    for (let i = 0; i < textNode.textContent.length; i++) {
      this.range.setStart(textNode, i);
      this.range.setEnd(textNode, i + 1);

      let { left, top } = this.range.getBoundingClientRect();

      if (0 < left && left < this.pageWidth) {
        return i;
      }
    }

    return -1;
  }

  _imagePosition(imageIndex: number): PositionData {
    return { imageIndex, textNodeIndex: null, charIndex: null };
  }
}