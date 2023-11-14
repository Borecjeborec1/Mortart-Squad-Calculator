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

console.log(convertDistanceToMils(336));
