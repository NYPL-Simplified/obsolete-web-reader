interface PositionData {
  paragraphIndex: number;
  text: string;
  textIndex: number;
}

class Pages {
  body: HTMLElement;
  margin: number;
  layoutPages: number;
  pageWidth: number;
  columnWidth: number;
  columnGap: number;
  bodyHeight: number;
  lastPage: number;
  currentPage: number;
  currentPosition: PositionData;

  constructor({ margin = 50, layoutPages = 1, fontSize = 30} = {}) {
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

  setupColumns(): void {
    this.pageWidth = Math.floor(window.innerWidth / this.layoutPages);
    this.columnWidth = this.pageWidth - 2 * this.margin;
    this.columnGap = 2 * this.margin;
    this.bodyHeight = window.innerHeight - 2 * this.margin;

    this.body.style.margin = this.margin + "px";
    this.body.style.height = this.bodyHeight + "px";
    this.body.style.columnWidth = this.columnWidth + "px";
    this.body.style.columnGap =  this.columnGap + "px";

    this.lastPage = Math.ceil(this.body.scrollWidth / this.pageWidth) - 1;

    console.log(`setup ${this.displayPage(this.lastPage)} pages with ${this.layoutPages} columns`);
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

  getParagraphFromPage(n: number): number {
    let minLeft = n * this.pageWidth;
    let ary = Array.prototype.slice.call(document.querySelectorAll("p"));
    return 0;
    // return ary.findIndex(p => {
    //   let
    // })
  }

  getPosition(): PositionData {
    return {
      paragraphIndex: this.getParagraphFromPage(this.currentPage),
      text: null,
      textIndex: null
    };
  }

  loadPosition(position: PositionData): void {
  }
}

document.addEventListener("DOMContentLoaded", function() {
  let pages = new Pages();

  window.addEventListener("resize", function(e) {
    let position = pages.getPosition();
    pages.setupColumns();
    pages.loadPosition(position);
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