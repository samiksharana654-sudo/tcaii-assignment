var upPressed = false;
var downPressed = false;
var leftPressed = false;
var rightPressed = false;

// the way the player is facing: 'up', 'down', 'left' or 'right'
var direction = 'down';
var timeout = 0;
var arrowTimeout = 0;

// every arrow that is currently flying. The player can shoot again before the
// first arrow has left the screen, so we need a list to keep track of all of them.
// Each item is a small object: { element: the arrow div, x: centre x, y: centre y, direction: 'up'... }
var arrows = [];

// how many pixels an arrow moves every 10 milliseconds
var arrowSpeed = 4;

// how many more ticks (10ms each) the player should show the fire pose. 0 means not firing.
var fireTimer = 0;

// the enemy. Its div is created by JavaScript (see createEnemy) because the HTML has no enemy.
var enemy = null;
var enemyTimeout = 0;
var enemyX = 0;            // left position of the enemy in pixels
var enemyY = 380;          // top position of the enemy in pixels (it never changes)
var enemyDirection = -1;   // -1 means walking left, 1 means walking right
var enemySpeed = 1;        // pixels moved every 20 milliseconds

function keyup(event) {
	if (event.keyCode == 37) {
		leftPressed = false;
	}
	if (event.keyCode == 39) {
		rightPressed = false;
	}
	if (event.keyCode == 38) {
		upPressed = false;
	}
	if (event.keyCode == 40) {
		downPressed = false;
	}
}

// this is the only function that changes the player's className
function showPlayer() {
	var player = document.getElementById('player');
	var action = 'stand';
	var fire = '';

	if (upPressed == true || downPressed == true || leftPressed == true || rightPressed == true) {
		action = 'walk';
	}

	// while the fire timer is running, add the 'fire' class so the CSS shows the bow
	if (fireTimer > 0) {
		fire = ' fire';
		fireTimer = fireTimer - 1;
	}

	player.className = 'character' + fire + ' ' + action + ' ' + direction;
}

// put an arrow's div on the screen. x and y are the CENTRE of the arrow, so we
// subtract half of its size to get the left/top that CSS needs.
function drawArrow(arrow) {
	arrow.element.style.left = (arrow.x - arrow.element.offsetWidth / 2) + 'px';
	arrow.element.style.top = (arrow.y - arrow.element.offsetHeight / 2) + 'px';
}

function shoot() {
	var player = document.getElementById('player');

	// show the fire pose for 20 ticks x 10ms = 0.2 seconds (same length as the bow animation in the CSS)
	fireTimer = 20;

	// make the arrow div. The CSS classes 'arrow' and the direction give it the picture and rotation.
	var arrowDiv = document.createElement('div');
	arrowDiv.className = 'arrow ' + direction;
	document.body.appendChild(arrowDiv);

	// start in the middle of the player...
	var startX = player.offsetLeft + player.offsetWidth / 2;
	var startY = player.offsetTop + player.offsetHeight / 2;

	// ...then move it 16px out in front of the player, where the bow is
	if (direction == 'up') {
		startY = startY - 16;
	}
	if (direction == 'down') {
		startY = startY + 16;
	}
	if (direction == 'left') {
		startX = startX - 16;
	}
	if (direction == 'right') {
		startX = startX + 16;
	}

	// remember the direction NOW, so turning the player later does not turn arrows already flying
	var arrow = { element: arrowDiv, x: startX, y: startY, direction: direction };
	drawArrow(arrow);
	arrows.push(arrow);
}

function moveArrows() {
	// count backwards so that removing an arrow does not make us skip the next one
	for (var i = arrows.length - 1; i >= 0; i--) {
		var arrow = arrows[i];

		if (arrow.direction == 'up') {
			arrow.y = arrow.y - arrowSpeed;
		}
		if (arrow.direction == 'down') {
			arrow.y = arrow.y + arrowSpeed;
		}
		if (arrow.direction == 'left') {
			arrow.x = arrow.x - arrowSpeed;
		}
		if (arrow.direction == 'right') {
			arrow.x = arrow.x + arrowSpeed;
		}

		// the arrow is 32px long, so 20px past the edge means it is completely off screen
		if (arrow.x < -20 || arrow.x > window.innerWidth + 20 || arrow.y < -20 || arrow.y > window.innerHeight + 20) {
			document.body.removeChild(arrow.element);
			arrows.splice(i, 1);
		} else {
			drawArrow(arrow);
		}
	}
}

function move() {
	var player = document.getElementById('player');
	var positionLeft = player.offsetLeft;
	var positionTop = player.offsetTop;

	// the furthest the player can go before leaving the visible screen
	var maxLeft = window.innerWidth - player.offsetWidth;
	var maxTop = window.innerHeight - player.offsetHeight;

	if (downPressed == true) {
		direction = 'down';
		if (positionTop < maxTop) {
			var newTop = positionTop + 1;
			player.style.top = newTop + 'px';
		}
	}
	if (upPressed == true) {
		direction = 'up';
		if (positionTop > 0) {
			var newTop = positionTop - 1;
			player.style.top = newTop + 'px';
		}
	}
	if (leftPressed == true) {
		direction = 'left';
		if (positionLeft > 0) {
			var newLeft = positionLeft - 1;
			player.style.left = newLeft + 'px';
		}
	}
	if (rightPressed == true) {
		direction = 'right';
		if (positionLeft < maxLeft) {
			var newLeft = positionLeft + 1;
			player.style.left = newLeft + 'px';
		}
	}

	showPlayer();
}

// build the enemy: <div class="enemy grey ..."> with a head div and a body div inside,
// which is the structure the CSS expects
function createEnemy() {
	enemy = document.createElement('div');

	var head = document.createElement('div');
	head.className = 'head';
	enemy.appendChild(head);

	var body = document.createElement('div');
	body.className = 'body';
	enemy.appendChild(body);

	// start on the right side of the screen
	enemyX = Math.round(window.innerWidth * 0.65);
	showEnemy();

	document.body.appendChild(enemy);
}

// the CSS already has the pictures and the walking animation, so we only choose
// the class ('walk left' or 'walk right') and the position
function showEnemy() {
	var side = 'left';
	if (enemyDirection == 1) {
		side = 'right';
	}

	enemy.className = 'enemy grey walk ' + side;
	enemy.style.left = enemyX + 'px';
	enemy.style.top = enemyY + 'px';
}

function moveEnemy() {
	// the enemy walks between the middle of the screen and the tanks (which start at 80%)
	var minX = window.innerWidth * 0.5;
	var maxX = window.innerWidth * 0.8 - enemy.offsetWidth;

	enemyX = enemyX + enemyDirection * enemySpeed;

	if (enemyX >= maxX) {
		enemyDirection = -1;
	}
	if (enemyX <= minX) {
		enemyDirection = 1;
	}

	showEnemy();
}

function keydown(event) {
	if (event.keyCode == 37) {
		leftPressed = true;
	}
	if (event.keyCode == 39) {
		rightPressed = true;
	}
	if (event.keyCode == 38) {
		upPressed = true;
	}
	if (event.keyCode == 40) {
		downPressed = true;
	}
	// Space bar. event.repeat is true when the key is just being held down,
	// so holding Space does not spray arrows; each new press shoots one arrow.
	if (event.keyCode == 32 && event.repeat == false) {
		shoot();
	}
}

function myLoadFunction() {
	timeout = setInterval(move, 10);
	arrowTimeout = setInterval(moveArrows, 10);
	createEnemy();
	enemyTimeout = setInterval(moveEnemy, 20);
	document.addEventListener('keydown', keydown);
	document.addEventListener('keyup', keyup);
}

document.addEventListener('DOMContentLoaded', myLoadFunction);