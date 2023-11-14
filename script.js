const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const switchMapButton = document.getElementById("switchMapButton");
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
];

let currentMap = maps[0];

const mapImage = new Image();
mapImage.src = `maps/${currentMap.name}.png`;

let scale = 0.5;
let minScale = 0.2; // Set your minimum scale value
let maxScale = 2.0; // Set your maximum scale value

let offsetX = 0;
let offsetY = 0;

let minOffsetX = 0;
let minOffsetY = 0;
let maxOffsetX = canvas.width - currentMap.width * minScale;
let maxOffsetY = canvas.height - currentMap.height * minScale;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

const MORTAR_MIN_PERIMETER = 50;
const MORTAR_MAX_PERIMETER = 1250;

const circle = {};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    mapImage,
    offsetX,
    offsetY,
    currentMap.width * scale,
    currentMap.height * scale
  );

  if (circle.x) {
    drawCircle(MORTAR_MIN_PERIMETER, "rgba(255, 255, 255, 1)");
    drawCircle(MORTAR_MAX_PERIMETER, "rgba(255, 255, 255, 0.4)");
  }
}

function drawCircle(perimeter, color) {
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, perimeter * scale, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

function drawDot(x, y, color) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
}

function drawText(meters, mils, angle) {
  metersSpan.innerText = meters;
  milsSpan.innerText = mils;
  angleSpan.innerText = angle;
}
function handleContextMenu(e) {
  e.preventDefault(); // Prevent the default right-click context menu
}

function handleMouseDown(e) {
  e.preventDefault();
  if (e.button === 2) {
    isDragging = true;
    dragStartX = e.clientX - offsetX;
    dragStartY = e.clientY - offsetY;
  } else if (e.button === 0) {
    draw();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    if (circle.x) {
      const distance = Math.sqrt(
        (mouseX - circle.x) ** 2 + (mouseY - circle.y) ** 2
      );
      if (
        distance >= MORTAR_MIN_PERIMETER * scale &&
        distance <= MORTAR_MAX_PERIMETER * scale
      ) {
        const angle =
          (Math.atan2(mouseY - circle.y, mouseX - circle.x) * (180 / Math.PI) +
            450) %
          360;
        const distanceFromCenter = distance / scale;

        drawDot(mouseX, mouseY, "red");
        const miliradians = convertDistanceToMils(distanceFromCenter);

        drawText(distanceFromCenter, miliradians, angle);
      } else {
        drawText("Out of range!", "Out of range!", "Out of range!");
      }
    } else {
      circle.x = mouseX;
      circle.y = mouseY;

      draw();
    }
  }
}

function handleMouseUp() {
  isDragging = false;
}

function handleMouseMove(e) {
  if (isDragging) {
    if (canvas.width - currentMap.width * scale > 0) {
      offsetX = Math.min(
        Math.max(e.clientX - dragStartX, minOffsetX),
        maxOffsetX
      );
      offsetY = Math.min(
        Math.max(e.clientY - dragStartY, minOffsetY),
        maxOffsetY
      );
    } else {
      offsetX = e.clientX - dragStartX;
      offsetY = e.clientY - dragStartY;
    }
    draw();
  }
}

function handleWheel(e) {
  e.preventDefault();

  const delta = e.deltaY;
  if (delta < 0) {
    scale *= 1.05;
  } else {
    scale /= 1.05;
  }
  maxOffsetX = canvas.width - currentMap.width * scale;
  maxOffsetY = canvas.height - currentMap.height * scale;

  offsetX = Math.min(Math.max(offsetX, minOffsetX), maxOffsetX);
  offsetY = Math.min(Math.max(offsetY, minOffsetY), maxOffsetY);

  draw();
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

  circle.x = 0;
  circle.y = 0;

  maxOffsetX = canvas.width - currentMap.width * scale;
  maxOffsetY = canvas.height - currentMap.height * scale;
  offsetX = Math.min(Math.max(offsetX, minOffsetX), maxOffsetX);
  offsetY = Math.min(Math.max(offsetY, minOffsetY), maxOffsetY);

  draw();
}
function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  mapImage.onload = () => {
    draw();
  };

  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mouseup", handleMouseUp);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("wheel", handleWheel);
  canvas.addEventListener("contextmenu", handleContextMenu);
  switchMapButton.addEventListener("click", changeMap);
}

init();
