interface PositionData {
  textNodeIndex: number;
  charIndex: number;
}

class Pages {
  body: HTMLElement;
  textNodes: Element[];
  margin: number;
  fontSize: number;
  layoutPages: number;
  pageWidth: number;
  columnWidth: number;
  columnGap: number;
  bodyHeight: number;
  lastPage: number;
  currentPage: number;
  currentPosition: PositionData;
  range: Range;

  constructor({ margin = 50, layoutPages = 1, fontSize = 30} = {}) {
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

  render(width?: number, height?: number): void {
    width = width || window.innerWidth;
    height = height || window.innerHeight;

    this.pageWidth = Math.floor(width / this.layoutPages);
    this.columnWidth = this.pageWidth - 2 * this.margin;
    this.columnGap = 2 * this.margin;
    this.bodyHeight = height - 2 * this.margin;

    this.updateBodyStyle();

    this.lastPage = Math.ceil(this.body.scrollWidth / this.pageWidth) - 1;

    console.log(`setup ${this.displayPage(this.lastPage)} pages with ${this.layoutPages} columns`);
  }

  updateBodyStyle(): void {
    this.body.style.height = this.bodyHeight + "px";
    this.body.style.columnWidth = this.columnWidth + "px";
    this.body.style.columnGap =  this.columnGap + "px";
    this.body.style.fontSize = this.fontSize + "px";
  }

  setFontSize(size: number): void {
    this.fontSize = size;
  }

  setLayoutPages(num: number): void {
    this.layoutPages = num;
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
    this.body.style.left = -n * this.pageWidth + "px";
    this.currentPage = n;
    this.saveCurrentPosition();
    console.log(`moved to page ${n}`);
  }

  goToParagraph(n: number): void {
    this.goToPage(this.getPageFromParagraph(n));
  }

  getPageFromParagraph(n: number): number {
    let para = document.querySelectorAll("p").item(n);
    let box = para.getBoundingClientRect();
    return this.currentPage + Math.floor(box.left / (this.pageWidth * this.layoutPages));
  }

  getTextNodes(element: Element): Element[] {
    let childNodes = Array.prototype.slice.call(element.childNodes);

    if (childNodes.length === 0) {
      return element.nodeType === Node.TEXT_NODE &&
             element.textContent.trim().length ?
             [element] : [];
    } else {
      return [].concat.apply([], childNodes.map(node => this.getTextNodes(node)));
    }
  }

  getTextNodeRect(node: Element): ClientRect {
    this.range.setStart(node, 0);
    this.range.setEnd(node, node.textContent.length - 1);
    return this.range.getBoundingClientRect();
  }

  getTextNodeIndex(): number {
    return (this.textNodes as any).findIndex(textNode => {
      return this.getTextNodeRect(textNode).left > 0;
    });
  }

  getPosition(): PositionData {
    // find first text node with bounding box whose left edge is on the
    // current page or a higher page
    let foundIndex = this.getTextNodeIndex();

    if (foundIndex === -1) {
      throw(`Can't find paragraph starting on page ${this.currentPage} or higher`);
    }

    if (foundIndex === 0) {
      return { textNodeIndex: 0, charIndex: 0 };
    }

    // search in previous paragraph and found paragraph for text located
    // within current page
    let textNodeIndex = -1;
    let charIndex = -1;

    search:
    for (let i = foundIndex - 1; i <= foundIndex; i++) {
      let textNode = this.textNodes[i];
      charIndex = 0;
      for (let j = 0; j < textNode.textContent.length; j++) {
        this.range.setStart(textNode, j);
        this.range.setEnd(textNode, j + 1);
        let left = this.range.getBoundingClientRect().left;
        if (0 < left && left < this.pageWidth) {
          textNodeIndex = i;
          break search;
        }
        charIndex += 1;
      }
    }

    if (textNodeIndex === -1) {
      throw(`Can't find any text in text nodes ${textNodeIndex - 1} or ${textNodeIndex} on page ${this.currentPage}`);
    }

    return { textNodeIndex, charIndex };
  }

  saveCurrentPosition() {
    this.currentPosition = this.getPosition();
  }

  loadPosition({ textNodeIndex, charIndex }: PositionData): void {
    let textNode = this.textNodes[textNodeIndex];
    this.range.setStart(textNode, charIndex);
    this.range.setEnd(textNode, charIndex + 1);
    let left = this.range.getBoundingClientRect().left;
    let page = this.currentPage + Math.floor(left / this.pageWidth);
    this.goToPage(page);
  }
}

let pages;

document.addEventListener("DOMContentLoaded", function() {
  pages = new Pages();

  let resizeTimer;
  let that = this;
  window.addEventListener("resize", function(e) {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      pages.render();
      pages.loadPosition(pages.currentPosition);
      pages.saveCurrentPosition();
    }, 250);
  });

  window.addEventListener("keydown", function(e) {
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