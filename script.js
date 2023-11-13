const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

const mapImage = new Image();
mapImage.src = 'your-map-image.png';

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	ctx.drawImage(mapImage, offsetX, offsetY, mapImage.width * scale, mapImage.height * scale);
}

function handleMouseDown(e) {
	isDragging = true;
	dragStartX = e.clientX - offsetX;
	dragStartY = e.clientY - offsetY;
}

function handleMouseUp() {
	isDragging = false;
}

function handleMouseMove(e) {
	if (isDragging) {
		offsetX = e.clientX - dragStartX;
		offsetY = e.clientY - dragStartY;
		draw();
	}
}

function handleWheel(e) {
	const delta = e.deltaY;
	if (delta > 0) {
		scale *= 1.1;
	} else {
		scale /= 1.1;
	}

	draw();
}

function init() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	mapImage.onload = () => {
		draw();
	};

	canvas.addEventListener('mousedown', handleMouseDown);
	canvas.addEventListener('mouseup', handleMouseUp);
	canvas.addEventListener('mousemove', handleMouseMove);
	canvas.addEventListener('wheel', handleWheel);
}

init();
