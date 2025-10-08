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
  new subWindow(0, 0, 500, 500).addElement(new colorEditElement(0, 255, 10, 10, 400, 200));
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

  imageDisplay = new ImageDisplay(createImage(1, 1));
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
    loadedImage = loadImage(file.data);
  }  else console.log('Not an image file!');
  imageDisplay.newImage(loadedImage);
}

class subWindow {
  constructor(x, y, w, h) {
    this.bounds = {x: x, y: y, w: w, h: h};
    subWindows.push(this);
    this.elements = [];
    this.elementOffsets = [];
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
      this.elements[i].bounds = {x: this.bounds.x + this.elementOffsets[i].x, y: this.bounds.y + this.elementOffsets[i].y, w: this.elements[i].bounds.w, h: this.elements[i].bounds.h};
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
    return this;
  }
}

class colorEditElement {
  constructor(colorRangeStart, colorRangeEnd, x=0, y=0, w=200, h=50){
    this.bounds = {x: x, y: y, w: w, h: h};
    this.colorRangeStart = colorRangeStart;
    this.colorRangeEnd = colorRangeEnd;
    this.splineEditor = new splineEditorElement(5, 100, 50, true, colorRangeStart, colorRangeEnd);
  }
  drawSelf(){
    this.splineEditor.bounds = this.bounds;
    this.splineEditor.drawSelf();
  }
}

class splineEditorElement {
  constructor(controlPoints = 5, controlRange, controlValueRange = 50, doLerpStroke=false, lerpColorStart=[0,0,0], lerpColorEnd=[255,255,255]){
    this.bounds = {x: 0, y: 0, w: 200, h: 200};
    this.prevBounds = this.bounds;
    this.controlPoints = [];
    for(let i = 1; i < controlPoints+1; i++){
      this.controlPoints.push({baseValue: (i-1/controlPoints)*controlRange, currentBaseValue: (i-1/controlPoints)*controlRange, currentValue: i});
    }
    let minValue = 1000;
    let maxValue = -1000;
    for(let i = 0; i < this.controlPoints.length; i++){
      if(this.controlPoints[i].baseValue < minValue) minValue = this.controlPoints[i].baseValue;
      if(this.controlPoints[i].baseValue > maxValue) maxValue = this.controlPoints[i].baseValue;
    }
    this.minControlValue = minValue;
    this.maxControlValue = maxValue;
    this.doLerpStroke = doLerpStroke;
    this.lerpColorStart = lerpColorStart;
    this.lerpColorEnd = lerpColorEnd;
    this.controlValueRange = controlValueRange;
    this.getMappedCoordinates();
  }
  drawSelf(){
    fill(150);
    stroke(0);
    rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
    this.mouseInteract();
    strokeWeight(2);
    if(this.prevBounds != this.bounds) this.getMappedCoordinates();
    noFill();
    
    this.prevBounds = this.bounds;
  }
  mouseInteract(){
    if(mouseIsPressed){
      for(let i = 0; i < this.mappedCoordinates.length; i++){
        if(dist(mouseX, mouseY, this.mappedCoordinates[i].x, this.mappedCoordinates[i].y) < 10+dist(mouseX, mouseY, pmouseX, pmouseY)){
          this.controlPoints[i].currentValue = map(mouseY, this.bounds.y + this.bounds.h, this.bounds.y, -this.controlValueRange, this.controlValueRange);
          this.controlPoints[i].currentBaseValue = map(mouseX, this.bounds.x + (this.bounds.w/this.controlPoints.length), this.bounds.x + this.bounds.w - (this.bounds.w/this.controlPoints.length), this.minControlValue, this.maxControlValue);
          this.controlPoints[i].currentValue = constrain(this.controlPoints[i].currentValue, -this.controlValueRange, this.controlValueRange);
          this.controlPoints[i].currentBaseValue = constrain(this.controlPoints[i].currentBaseValue, i>0?this.controlPoints[i-1].currentBaseValue:this.minControlValue, i<this.controlPoints.length-1?this.controlPoints[i+1].currentBaseValue:this.maxControlValue);
          this.getMappedCoordinates
          break;
        }
      }
    }
  }
  getMappedCoordinates(){
    this.mappedCoordinates = [];
    for(let i = 0; i < this.controlPoints.length; i++){
      let x = map(this.controlPoints[i].currentBaseValue, this.minControlValue, this.maxControlValue, this.bounds.x + (this.bounds.w/this.controlPoints.length), this.bounds.x + this.bounds.w - (this.bounds.w/this.controlPoints.length));
      let y = map(this.controlPoints[i].currentValue, this.controlValueRange, -this.controlValueRange, this.bounds.y, this.bounds.y + this.bounds.h);
      this.mappedCoordinates.push({x: x, y: y});
    }
  }
}

class ImageDisplay {
  constructor(img) {
    this.baseImg = img;
    this.drawnImg = img;
    this.bounds = {x:0, y:0, w:img.width, h:img.height};
    this.aspectRatio = img.width / img.height;
    this.subWindow = new subWindow(50, 50, 500, 500).addElement(this);
  }
  constrainWithin(x, y, w, h){
    let scale = min(w / this.baseImg.width, h / this.baseImg.height);
    this.bounds.w = this.baseImg.width * scale;
    this.bounds.h = this.baseImg.height * scale;
    this.bounds.x = x + (w - this.bounds.w) / 2;
    this.bounds.y = y + (h - this.bounds.h) / 2;
  }
  newImage(img){
    fill(100);
    noStroke();
    rect(this.bounds.x-1, this.bounds.y-1, this.bounds.w+2, this.bounds.h+2);
    this.baseImg = img;
    this.drawnImg = img;
    this.aspectRatio = img.width / img.height;
    this.bounds = {x:0, y:0, w:img.width, h:img.height};
  }
  drawSelf(){
    image(this.drawnImg, this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
  }
  renderImage(){

  }
}