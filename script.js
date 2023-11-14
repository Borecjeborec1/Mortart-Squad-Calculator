const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const switchMapButton = document.getElementById("switchMapButton");
const resetButton = document.getElementById("resetButton");
const metersSpan = document.getElementById("metersSpan");
const milsSpan = document.getElementById("milsSpan");
const angleSpan = document.getElementById("angleSpan");
const conversionTable = [
  [50, 1579],
  [100, 1558],
  [150, 1538],
  [200, 1517],
  [250, 1496],
  [300, 1475],
  [350, 1453],
  [400, 1431],
  [450, 1409],
  [500, 1387],
  [550, 1364],
  [600, 1341],
  [650, 1317],
  [700, 1292],
  [750, 1267],
  [800, 1240],
  [850, 1212],
  [900, 1183],
  [950, 1152],
  [1000, 1118],
  [1050, 1081],
  [1100, 1039],
  [1150, 988],
  [1200, 918],
  [1250, 800],
];
const maps = [
  { name: "Fallujah", width: 3000, height: 3000 },
  { name: "Skorpo", width: 7600, height: 7600 },
  { name: "Skorpo", width: 2700, height: 1500 },
];

let currentMap = maps[0];

const mapImage = new Image();
mapImage.src = `maps/${currentMap.name}.png`;

let lastX = canvas.width / 2;
let lastY = canvas.height / 2;
let dragStart, dragged;

const scaleFactor = 1.1;

const MORTAR_MIN_PERIMETER = 50;
const MORTAR_MAX_PERIMETER = 1250;

const mortar_circle = {};
const artiery_circle = {};

function drawCircle(perimeter, color) {
  ctx.beginPath();
  ctx.arc(mortar_circle.x, mortar_circle.y, perimeter, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

function drawArtiery(color) {
  ctx.beginPath();
  ctx.arc(artiery_circle.x, artiery_circle.y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

function drawText(meters, mils, angle) {
  metersSpan.innerText = meters;
  milsSpan.innerText = mils;
  angleSpan.innerText = angle;
}

function removePins() {
  mortar_circle.x = 0;
  mortar_circle.y = 0;
  redraw();
}

function convertDistanceToMils(distance) {
  for (let i = 0; i < conversionTable.length; ++i) {
    if (conversionTable[i][0] == distance) return conversionTable[i][1];
    if (conversionTable[i][0] > distance) {
      const [x1, y1] = conversionTable[i - 1];
      const [x2, y2] = conversionTable[i];
      const t = (distance - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
}

function changeMap() {
  const selectedIndex = maps.indexOf(currentMap);
  const nextIndex = (selectedIndex + 1) % maps.length;

  currentMap = maps[nextIndex];
  mapImage.src = `maps/${currentMap.name}.png`;

  mortar_circle.x = 0;
  mortar_circle.y = 0;
}

function trackTransforms(ctx) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let xform = svg.createSVGMatrix();
  ctx.getTransform = function () {
    return xform;
  };

  const savedTransforms = [];
  const save = ctx.save;
  ctx.save = function () {
    savedTransforms.push(xform.translate(0, 0));
    return save.call(ctx);
  };
  const restore = ctx.restore;
  ctx.restore = function () {
    xform = savedTransforms.pop();
    return restore.call(ctx);
  };

  const scale = ctx.scale;
  ctx.scale = function (sx, sy) {
    xform = xform.scaleNonUniform(sx, sy);
    return scale.call(ctx, sx, sy);
  };
  const rotate = ctx.rotate;
  ctx.rotate = function (radians) {
    xform = xform.rotate((radians * 180) / Math.PI);
    return rotate.call(ctx, radians);
  };
  const translate = ctx.translate;
  ctx.translate = function (dx, dy) {
    xform = xform.translate(dx, dy);
    return translate.call(ctx, dx, dy);
  };
  const transform = ctx.transform;
  ctx.transform = function (a, b, c, d, e, f) {
    const m2 = svg.createSVGMatrix();
    m2.a = a;
    m2.b = b;
    m2.c = c;
    m2.d = d;
    m2.e = e;
    m2.f = f;
    xform = xform.multiply(m2);
    return transform.call(ctx, a, b, c, d, e, f);
  };
  const setTransform = ctx.setTransform;
  ctx.setTransform = function (a, b, c, d, e, f) {
    xform.a = a;
    xform.b = b;
    xform.c = c;
    xform.d = d;
    xform.e = e;
    xform.f = f;
    return setTransform.call(ctx, a, b, c, d, e, f);
  };
  const pt = svg.createSVGPoint();
  ctx.transformedPoint = function (x, y) {
    pt.x = x;
    pt.y = y;
    return pt.matrixTransform(xform.inverse());
  };
}
function zoom(clicks) {
  const pt = ctx.transformedPoint(lastX, lastY);
  ctx.translate(pt.x, pt.y);
  const factor = Math.pow(scaleFactor, clicks);
  ctx.scale(factor, factor);
  ctx.translate(-pt.x, -pt.y);
  redraw();
}

function handleScroll(evt) {
  const delta = evt.wheelDelta
    ? evt.wheelDelta / 40
    : evt.detail
    ? -evt.detail
    : 0;
  if (delta) zoom(delta);
  return evt.preventDefault() && false;
}
function redraw() {
  const p1 = ctx.transformedPoint(0, 0);
  const p2 = ctx.transformedPoint(canvas.width, canvas.height);
  ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

  ctx.drawImage(mapImage, 0, 0, currentMap.width, currentMap.height);
  if (mortar_circle.x) {
    drawCircle(2, "red");
    drawCircle(MORTAR_MIN_PERIMETER, "rgba(200, 200, 200, 0)");
    drawCircle(MORTAR_MAX_PERIMETER, "rgba(255, 255, 255, 0.2)");
    drawArtiery("red");
  }
}

function handleMouseDown(e) {
  e.preventDefault();
  if (e.button === 2) {
    lastX = e.offsetX || e.pageX - canvas.offsetLeft;
    lastY = e.offsetY || e.pageY - canvas.offsetTop;
    dragStart = ctx.transformedPoint(lastX, lastY);
    dragged = false;
    return;
  }
  if (e.button !== 0) return;

  const pt = ctx.transformedPoint(
    e.offsetX || e.pageX - canvas.offsetLeft,
    e.offsetY || e.pageY - canvas.offsetTop
  );
  if (mortar_circle.x) {
    artiery_circle.x = pt.x;
    artiery_circle.y = pt.y;
    calculateShot();
  } else {
    mortar_circle.x = pt.x;
    mortar_circle.y = pt.y;
  }
  redraw();
}
function calculateShot() {
  const distance = Math.sqrt(
    (artiery_circle.x - mortar_circle.x) ** 2 +
      (artiery_circle.y - mortar_circle.y) ** 2
  );
  if (distance >= MORTAR_MIN_PERIMETER && distance <= MORTAR_MAX_PERIMETER) {
    const angle =
      (Math.atan2(
        artiery_circle.y - mortar_circle.y,
        artiery_circle.x - mortar_circle.x
      ) *
        (180 / Math.PI) +
        450) %
      360;

    const miliradians = convertDistanceToMils(distance);
    drawText(distance, miliradians, angle);
  } else {
    drawText("Out of range!", "Out of range!", "Out of range!");
  }
}
function handleContextMenu(e) {
  e.preventDefault();
}

function handleMouseMove(evt) {
  lastX = evt.offsetX || evt.pageX - canvas.offsetLeft;
  lastY = evt.offsetY || evt.pageY - canvas.offsetTop;
  dragged = true;
  if (dragStart) {
    const pt = ctx.transformedPoint(lastX, lastY);
    ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
    redraw();
  }
}
function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  mapImage.onload = () => {
    redraw();
  };

  trackTransforms(ctx);

  redraw();

  canvas.addEventListener("contextmenu", handleContextMenu);
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", handleMouseUp);

  canvas.addEventListener("DOMMouseScroll", handleScroll);
  canvas.addEventListener("mousewheel", handleScroll);

  resetButton.addEventListener("click", removePins);
  switchMapButton.addEventListener("click", changeMap);
}

function handleMouseUp(e) {
  dragStart = null;
  if (!dragged) zoom(e.shiftKey ? -1 : 1);
}
init();
