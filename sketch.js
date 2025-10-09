let loadedImage;
let dropCanvas;
let imageDisplay;
let isRedrawScheduled = false;
let subWindows = [];
let addWindowButton;
let windowIsAbove = false;

function setup() {
  dropCanvas = createCanvas(windowWidth, windowHeight);
  defineUI();
  background(100);
  new subWindow(0, 0, 550, 700)
  .addElement(new editColorElement(0, 10, 10, 480, 150))
  .addElement(new editColorElement(1, 10, 170, 480, 150))
  .addElement(new editColorElement(2, 10, 330, 480, 150));
}

function defineUI() {
  dropCanvas.attribute('accept', 'image/*');
  dropCanvas.drop(loadInImage);

  addWindowButton = createButton('+');
  addWindowButton.position(10, 10);
  addWindowButton.size(30, 30);
  addWindowButton.style('font-size', '20px');
  addWindowButton.style('background-color', '#ffffffaa');
  addWindowButton.style('border', 'none');
  addWindowButton.style('border-radius', '5px');
  addWindowButton.mousePressed(() => {
    new subWindow(100, 100, 400, 400);
  });

  imageDisplay = new ImageDisplay(createImage(1, 1), createImage(1, 1));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(100);
}

function draw() {
  background(100);
  windowIsAbove = false;
  for(let i = subWindows.length - 1; i >= 0; i--) subWindows[i].drawSelf();
  for(let i = 0; i < subWindows.length; i++) subWindows[i].update();
}

function loadInImage(file) {
  if (file.type === 'image') {
    imageDisplay.newImage(loadImage(file.data), loadImage(file.data));
  }  else console.log('Not an image file!');
}

class subWindow {
  constructor(x, y, w, h) {
    this.bounds = {x: x, y: y, w: w, h: h};
    subWindows.push(this);
    this.elements = [];
    this.elementOffsets = [];
    this.elementSizes = [];
    this.startW = w;
    this.startH = h;
    this.edgeFills = {top: 0, bottom: 0, left: 0, right: 0};
  }
  mouseInteract(){
    for(let i = 0; i < this.elements.length; i++){
      if(this.elements[i].renderImage == undefined && mouseX > this.elements[i].bounds.x && mouseX < this.elements[i].bounds.x + this.elements[i].bounds.w && mouseY > this.elements[i].bounds.y && mouseY < this.elements[i].bounds.y + this.elements[i].bounds.h){
        return;
      }
    }
    if(mouseIsPressed && !windowIsAbove){
      let resizeEdgeThreshold = ((this.bounds.w + this.bounds.h)/25) + dist(mouseX, mouseY, pmouseX, pmouseY);
      let waspressed = false;
      let isOnX = abs(mouseX - (this.bounds.x + this.bounds.w/2)) < this.bounds.w/2 + resizeEdgeThreshold;
      let isOnY = abs(mouseY - (this.bounds.y + this.bounds.h/2)) < this.bounds.h/2 + resizeEdgeThreshold;

      // edge detection for resizing
      if(isOnY && mouseX > this.bounds.x + this.bounds.w - resizeEdgeThreshold/2 && mouseX < this.bounds.x + this.bounds.w + resizeEdgeThreshold){
        this.bounds.w = mouseX - this.bounds.x;
        this.edgeFills.right = 255;
        waspressed = true;
      } else this.edgeFills.right = 0;      
      if(isOnX && mouseY > this.bounds.y + this.bounds.h - resizeEdgeThreshold/2 && mouseY < this.bounds.y + this.bounds.h + resizeEdgeThreshold){
        this.bounds.h = mouseY - this.bounds.y;
        this.edgeFills.bottom = 255;
        waspressed = true;
      } else this.edgeFills.bottom = 0;   
      if(isOnY && mouseX > this.bounds.x - resizeEdgeThreshold && mouseX < this.bounds.x + resizeEdgeThreshold){
        this.bounds.x = mouseX;
        this.bounds.w -= movedX
        this.edgeFills.left = 255;
        waspressed = true;
      } else this.edgeFills.left = 0;         
      if(isOnX && mouseY > this.bounds.y - resizeEdgeThreshold && mouseY < this.bounds.y + resizeEdgeThreshold){
        this.bounds.y = mouseY;
        this.bounds.h -= movedY;
        this.edgeFills.top = 255;
        waspressed = true;
      } else this.edgeFills.top = 0;   
      this.bounds.w = max(this.bounds.w, 50);
      this.bounds.h = max(this.bounds.h, 50);
      // click and drag for moving
      if(mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.w && mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.h){
        this.bounds.x += movedX;
        this.bounds.y += movedY;
        this.edgeFills = {top: 255, bottom: 255, left: 255, right: 255};
        waspressed = true;
      }
      if(waspressed){
        windowIsAbove = true;
        let index = subWindows.indexOf(this);
        subWindows = subWindows.slice(0, index).concat(subWindows.slice(index + 1));
        splice(subWindows, this, 0);
      }
    }
    else this.edgeFills = {top: 0, bottom: 0, left: 0, right: 0};
    this.bounds.x = constrain(this.bounds.x, 0, width - this.bounds.w);
    this.bounds.y = constrain(this.bounds.y, 0, height - this.bounds.h);
  }
  update(){
    this.mouseInteract();
    for(let i = 0; i < this.elements.length; i++){
      this.elements[i].bounds = {
        x: this.bounds.x + (this.elementOffsets[i].x*(this.bounds.w/this.startW)), 
        y: this.bounds.y + (this.elementOffsets[i].y*(this.bounds.h/this.startH)), 
        w: (this.bounds.w/this.startW)*(this.elementSizes[i].w), 
        h: (this.bounds.h/this.startH)*(this.elementSizes[i].h)
      };
      if(this.elements[i].constrainWithin != undefined) this.elements[i].constrainWithin(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
    }
  }
  drawSelf(){
    let sw = 5;
    fill(50);
    stroke(0);
    strokeWeight(sw);
    strokeJoin(ROUND);
    this.bounds = {x: this.bounds.x-sw, y: this.bounds.y-sw, w: this.bounds.w+sw*2, h: this.bounds.h+sw*2};
    rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h, 5);
    stroke(this.edgeFills.top);
    line(this.bounds.x, this.bounds.y, this.bounds.x + this.bounds.w, this.bounds.y);
    stroke(this.edgeFills.left);
    line(this.bounds.x, this.bounds.y, this.bounds.x, this.bounds.y + this.bounds.h);
    stroke(this.edgeFills.right);
    line(this.bounds.x + this.bounds.w, this.bounds.y, this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h);
    stroke(this.edgeFills.bottom);
    line(this.bounds.x, this.bounds.y + this.bounds.h, this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h);
    this.bounds = {x: this.bounds.x+sw, y: this.bounds.y+sw, w: this.bounds.w-sw*2, h: this.bounds.h-sw*2};
    for(let i = 0; i < this.elements.length; i++){
      this.elements[i].drawSelf();
    }
  }
  addElement(element){
    this.elements.push(element);
    this.elementOffsets.push({x: element.bounds.x - this.bounds.x, y: element.bounds.y - this.bounds.y});
    this.elementSizes.push({w: element.bounds.w, h: element.bounds.h});
    return this;
  }
}

class element {
  constructor(x, y, w, h) {
    this.bounds = {x: x, y: y, w: w, h: h};
  }
  setPosition(x, y) {
    this.bounds.x = x;
    this.bounds.y = y;
    return this;
  }
  setSize(w, h) {
    this.bounds.w = w;
    this.bounds.h = h;
    return this;
  }
  isMouseOver(){
    return mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.w && mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.h;
  }
  isSelected(){
    return this.isMouseOver() && mouseIsPressed;
  }
  drawBounds(){
    noFill();
    stroke(255, 0, 0);
    rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
  }
}

class editSplineElement extends element {
  constructor(valueStart, valueEnd, minValue, maxValue, x, y, w, h) {
    super(x, y, w, h);
    this.valueStart = valueStart;
    this.valueEnd = valueEnd;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.splinePoints = [{x:this.valueStart, y:this.minValue},{x:this.valueStart, y:this.maxValue}];
    this.mappedPoints = [];
    this.setMappedPoints();
    this.changedPoints = true;
  }
  drawBG(){
    fill(150);
    rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
  }
  drawSpline(){
    stroke(0);
    noFill();
    this.mouseInteract();
    this.setMappedPoints();
    beginShape();
    for(let i = 0; i < this.mappedPoints.length; i++){
      vertex(this.mappedPoints[i].x, this.mappedPoints[i].y);
    }
    endShape();
    for(let i = 0; i < this.mappedPoints.length; i++){
      fill(0)
      noStroke();
      if(dist(mouseX, mouseY, this.mappedPoints[i].x, this.mappedPoints[i].y) < 10 && mouseIsPressed) fill(255);
      circle(this.mappedPoints[i].x, this.mappedPoints[i].y, 15);
    }
  }
  setMappedPoints(){
    this.mappedPoints = [];
    for(let i = 0; i < this.splinePoints.length; i++){
      let px = map(this.splinePoints[i].x, this.valueStart, this.valueEnd, this.bounds.x+15, this.bounds.x + this.bounds.w-15);
      let py = map(this.splinePoints[i].y, this.minValue, this.maxValue, this.bounds.y + this.bounds.h-15, this.bounds.y+15);
      this.mappedPoints.push({x: px, y: py});
    }
  }
  mouseInteract(){
    if(!mouseIsPressed) this.changedPoints = false;
    if(mouseIsPressed && this.isMouseOver()){
      let didMovePoint = false;
      for(let i = 0; i < this.mappedPoints.length; i++){
        // if the mouse clicks a point
        if(dist(mouseX, mouseY, this.mappedPoints[i].x, this.mappedPoints[i].y) < 20 + dist(mouseX, mouseY, pmouseX, pmouseY)){
          didMovePoint = true;
          this.splinePoints[i].x = constrain(map(mouseX, this.bounds.x+15, this.bounds.x + this.bounds.w-15, this.valueStart, this.valueEnd), i>0?this.splinePoints[i-1].x:this.valueStart, i<this.splinePoints.length-1?this.splinePoints[i+1].x:this.valueEnd);
          this.splinePoints[i].y = constrain(map(mouseY, this.bounds.y + this.bounds.h-15, this.bounds.y+15, this.minValue, this.maxValue), this.minValue, this.maxValue);
          if((keyIsDown(BACKSPACE) || keyIsDown(DELETE)) && this.splinePoints.length > 2){
            this.splinePoints = this.splinePoints.slice(0, i).concat(this.splinePoints.slice(i + 1));
            this.changedPoints = true;
          }
          break;
        }
      }
      if(didMovePoint || this.changedPoints) return;
      // if no point was moved, check if a new point should be added
      for(let i = 0; i < this.mappedPoints.length - 1; i++){
        // if the mouse clicks between two points
        let d1 = dist(mouseX, mouseY, this.mappedPoints[i].x, this.mappedPoints[i].y);
        let d2 = dist(mouseX, mouseY, this.mappedPoints[i+1].x, this.mappedPoints[i+1].y);
        let d3 = dist(this.mappedPoints[i].x, this.mappedPoints[i].y, this.mappedPoints[i+1].x, this.mappedPoints[i+1].y);
        if(d1 + d2 < d3 + 10 + dist(mouseX, mouseY, pmouseX, pmouseY)){
          this.changedPoints = true;
          let newPointX = constrain(map(mouseX, this.bounds.x+15, this.bounds.x + this.bounds.w-15, this.valueStart, this.valueEnd), this.valueStart, this.valueEnd);
          let newPointY = constrain(map(mouseY, this.bounds.y + this.bounds.h-15, this.bounds.y+15, this.minValue, this.maxValue), this.minValue, this.maxValue);
          this.splinePoints.splice(i+1, 0, {x: newPointX, y: newPointY});
        }
      }
    }
  }
}

class editColorElement extends editSplineElement {
  constructor(chanel, x, y, w, h) {
    super(0, 255, 0, 100, x, y, w, h);
    this.chanel = chanel; // 0 = red, 1 = green, 2 = blue, 3 = alpha  
    imageDisplay.effects.push(this);
  }
  updateImage(){
    let img = imageDisplay.baseImg;
    let img2 = imageDisplay.drawnImg;
    for(let i = this.chanel; i < img.pixels.length; i += 4){
      img2.pixels[i] = img.pixels[i];
      for(let j = 0; j < this.splinePoints.length - 1; j++){
        if(img.pixels[i] >= this.splinePoints[j].x && img.pixels[i] <= this.splinePoints[j+1].x){
          img2.pixels[i] = map(img.pixels[i], this.splinePoints[j].x, this.splinePoints[j+1].x, this.splinePoints[j].y, this.splinePoints[j+1].y);
          j = this.splinePoints.length-1;
        }
      }
    }
    img2.updatePixels();
  }
  drawSelf(){
    strokeWeight(1);
    // draw gradient
    this.drawBG();
    for(let x = this.bounds.x; x < this.bounds.x + this.bounds.w; x++){
      if(this.chanel == 0) stroke(lerpColor(color(0, 0, 0), color(255, 0, 0), x/(this.bounds.x+this.bounds.w)));
      if(this.chanel == 1) stroke(lerpColor(color(0, 0, 0), color(0, 255, 0), x/(this.bounds.x+this.bounds.w)));
      if(this.chanel == 2) stroke(lerpColor(color(0, 0, 0), color(0, 0, 255), x/(this.bounds.x+this.bounds.w)));
      line(x, this.bounds.y, x, this.bounds.y + this.bounds.h);
    }
    this.drawSpline();
  }
}

class ImageDisplay {
  constructor(img, imgCopy) {
    this.baseImg = img;
    this.drawnImg = imgCopy;
    this.bounds = {x:0, y:0, w:img.width, h:img.height};
    this.aspectRatio = img.width / img.height;
    this.subWindow = new subWindow(50, 50, 500, 500).addElement(this);
    this.effects = [];
    this.drawOriginalImage = false;
    this.hasToggledImage = false;
  }
  constrainWithin(x, y, w, h){
    let scale = min(w / this.baseImg.width, h / this.baseImg.height);
    this.bounds.w = this.baseImg.width * scale;
    this.bounds.h = this.baseImg.height * scale;
    this.bounds.x = x + (w - this.bounds.w) / 2;
    this.bounds.y = y + (h - this.bounds.h) / 2;
  }
  newImage(img, imgCopy){
    fill(100);
    noStroke();
    rect(this.bounds.x-1, this.bounds.y-1, this.bounds.w+2, this.bounds.h+2);
    this.baseImg = img;
    this.drawnImg = imgCopy;
    this.aspectRatio = img.width / img.height;
    this.bounds = {x:0, y:0, w:img.width, h:img.height};
  }
  drawSelf(){
    if(keyIsDown(16) && mouseIsPressed && mouseX > this.bounds.x && mouseX < this.bounds.x + this.bounds.w && mouseY > this.bounds.y && mouseY < this.bounds.y + this.bounds.h){
      if(!this.hasToggledImage){
        this.hasToggledImage = true;
        this.drawOriginalImage = !this.drawOriginalImage
      }
    } else this.hasToggledImage = false;
    if(!this.drawOriginalImage) image(this.drawnImg, this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
    else image(this.baseImg, this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
  }  
  renderImage(){
    this.baseImg.loadPixels();
    this.drawnImg.loadPixels();
    for(let i = 0; i < this.effects.length; i++){
      this.effects[i].updateImage();
    }
  }
}

function mouseReleased(){
  if(imageDisplay.baseImg != undefined) imageDisplay.renderImage();
}