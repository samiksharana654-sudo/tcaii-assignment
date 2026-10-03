var upPressed = false;
var downPressed = false;
var leftPressed = false;
var rightPressed = false;

var lastPressed = false;
var timeout = 0;

// bombs that are currently flying across the screen
var bombs = [];
var bombTimeout = 0;
var moveBombsTimeout = 0;
var bombSpeed = 2; // pixels moved to the left every 20 milliseconds (set by applyLevelDifficulty)
var maxBombSpeedY = 1; // most pixels a bomb can drift up or down every 20 milliseconds (set by applyLevelDifficulty)
var explosionDuration = 500; // milliseconds the explosion stays on screen (matches the CSS animation's 0.5s cycle)

// explosions that are currently on screen and might still hurt the player
var explosions = [];
var explosionTimeout = 0;

// true while the player is showing the "hit" pose, so move()/keyup() leave the className alone
var playerIsHit = false;
var hitDuration = 300; // milliseconds the hit pose is shown before normal movement classes resume

// true once the player has lost all 3 lives
var isGameOver = false;

// true between Start / Play Again and Game over (arrows can only be fired while this is true)
var gameRunning = false;

// arrows that are currently flying
var arrows = [];
var arrowTimeout = 0;
var arrowSpeed = 8; // pixels moved every 20 milliseconds
var isFiring = false; // true for 0.5 seconds after an arrow is fired: the player cannot move or fire again
var fireDelay = 500; // milliseconds
var fireTimeout = 0;

// number of bombs the player has avoided in the current game
var score = 0;

// level system: the level goes up after enough bombs have been avoided
var level = 1;
var bombsAvoidedThisLevel = 0; // avoided bombs counted towards the next level
var gameOverTimeout = 0;
var gameOverDelay = 1000; // milliseconds the dead animation plays before asking for the player's name
var highScoreKey = 'highScores'; // the name the high scores are saved under in Local Storage
var maxHighScores = 10; // only the best 10 scores are kept

function keyup(event) {
	var player = document.getElementById('player');
	if (event.keyCode == 37) {
		leftPressed = false;
		lastPressed = 'left';
	}
	if (event.keyCode == 39) {
		rightPressed = false;
		lastPressed = 'right';
	}
	if (event.keyCode == 38) {
		upPressed = false;
		lastPressed = 'up';
	}
	if (event.keyCode == 40) {
		downPressed = false;
		lastPressed = 'down';
	}

	// leave the className alone while hit, firing, dead, or when the key released was not an arrow key (e.g. Space)
	if (playerIsHit == false && isFiring == false && isGameOver == false && lastPressed != false && event.keyCode >= 37 && event.keyCode <= 40) {
		player.className = 'character stand ' + lastPressed;
	}
}

// reads the direction the player is currently facing from its own className
// (the direction is always the last word, e.g. 'character walk left' -> 'left')
function getPlayerDirection() {
	var player = document.getElementById('player');
	var classNames = player.className.split(' ');
	return classNames[classNames.length - 1];
}

// true if a player standing at testLeft/testTop would be touching any cactus
function isTouchingCactus(testLeft, testTop) {
	var player = document.getElementById('player');
	var cactusList = document.getElementsByClassName('cactus');

	var playerRight = testLeft + player.offsetWidth;
	var playerBottom = testTop + player.offsetHeight;

	for (var i = 0; i < cactusList.length; i++) {
		var cactus = cactusList[i];
		var cactusRight = cactus.offsetLeft + cactus.offsetWidth;
		var cactusBottom = cactus.offsetTop + cactus.offsetHeight;

		if (testLeft < cactusRight && playerRight > cactus.offsetLeft && testTop < cactusBottom && playerBottom > cactus.offsetTop) {
			return true;
		}
	}

	return false;
}

function move() {
	// the player cannot move while the firing lock is on
	if (isFiring == true) {
		return;
	}

	var player = document.getElementById('player');
	var positionLeft = player.offsetLeft;
	var positionTop = player.offsetTop;

	if (downPressed == true) {
		var newTop = positionTop + 1;
		if (isTouchingCactus(positionLeft, newTop) == false) {
			player.style.top = newTop + 'px';
		}
		if (playerIsHit == false) {
			player.className = 'character walk down';
		}
	}
	if (upPressed == true) {
		var newTop = positionTop - 1;
		if (isTouchingCactus(positionLeft, newTop) == false) {
			player.style.top = newTop + 'px';
		}
		if (playerIsHit == false) {
			player.className = 'character walk up';
		}
	}
	if (leftPressed == true) {
		var newLeft = positionLeft - 1;
		if (isTouchingCactus(newLeft, positionTop) == false) {
			player.style.left = newLeft + 'px';
		}
		if (playerIsHit == false) {
			player.className = 'character walk left';
		}
	}
	if (rightPressed == true) {
		var newLeft = positionLeft + 1;
		if (isTouchingCactus(newLeft, positionTop) == false) {
			player.style.left = newLeft + 'px';
		}
		if (playerIsHit == false) {
			player.className = 'character walk right';
		}
	}
}

// fires one arrow from the player in the direction the player is facing, then locks movement and firing for fireDelay
function fireArrow() {
	var player = document.getElementById('player');
	var direction = getPlayerDirection();

	var arrow = document.createElement('div');
	arrow.className = 'arrow ' + direction; // the CSS rotates the arrow picture for left / up / down

	// the arrow starts in the middle of the player (the arrow picture is 32 x 10 pixels)
	arrow.posLeft = player.offsetLeft + (player.offsetWidth / 2) - 16;
	arrow.posTop = player.offsetTop + (player.offsetHeight / 2) - 5;
	arrow.style.left = arrow.posLeft + 'px';
	arrow.style.top = arrow.posTop + 'px';

	// how far the arrow moves each tick
	arrow.speedX = 0;
	arrow.speedY = 0;
	if (direction == 'left') {
		arrow.speedX = -arrowSpeed;
	} else if (direction == 'right') {
		arrow.speedX = arrowSpeed;
	} else if (direction == 'up') {
		arrow.speedY = -arrowSpeed;
	} else {
		arrow.speedY = arrowSpeed;
	}

	document.body.appendChild(arrow);
	arrows.push(arrow);

	// lock movement and firing, and show the player's existing "fire" pose
	isFiring = true;
	if (playerIsHit == false) {
		player.className = 'character fire stand ' + direction;
	}
	fireTimeout = setTimeout(endFiring, fireDelay);
}

// runs 0.5 seconds after firing: the player can move and fire again
function endFiring() {
	isFiring = false;

	if (playerIsHit == false && isGameOver == false) {
		var player = document.getElementById('player');
		player.className = 'character stand ' + getPlayerDirection();
	}
}

// moves every arrow; removes arrows that leave the screen; destroys a bomb that an arrow touches
function moveArrows() {
	for (var i = arrows.length - 1; i >= 0; i--) {
		var arrow = arrows[i];
		arrow.posLeft = arrow.posLeft + arrow.speedX;
		arrow.posTop = arrow.posTop + arrow.speedY;
		arrow.style.left = arrow.posLeft + 'px';
		arrow.style.top = arrow.posTop + 'px';

		// off the edge of the game area: remove the arrow
		if (arrow.posLeft < -32 || arrow.posLeft > window.innerWidth || arrow.posTop < -32 || arrow.posTop > window.innerHeight) {
			document.body.removeChild(arrow);
			arrows.splice(i, 1);
			continue;
		}

		// does this arrow overlap any bomb? (getBoundingClientRect gives the box as drawn, including the rotation)
		var arrowBox = arrow.getBoundingClientRect();
		for (var j = 0; j < bombs.length; j++) {
			var bombBox = bombs[j].getBoundingClientRect();

			if (arrowBox.left < bombBox.right && arrowBox.right > bombBox.left && arrowBox.top < bombBox.bottom && arrowBox.bottom > bombBox.top) {
				// remove the bomb (no explosion) and the arrow, and count the bomb as avoided
				document.body.removeChild(bombs[j]);
				bombs.splice(j, 1);
				document.body.removeChild(arrow);
				arrows.splice(i, 1);
				recordAvoidedBomb();
				break;
			}
		}
	}
}

// removes one element from the page if it is still there (never throws, so a clean-up can never stop a game over or a restart)
function removeFromPage(element) {
	if (element && element.parentNode) {
		element.parentNode.removeChild(element);
	}
}

// removes every arrow from the page and from the arrows array
function removeAllArrows() {
	for (var i = 0; i < arrows.length; i++) {
		removeFromPage(arrows[i]);
	}
	arrows = [];
}

// cancels the firing lock straight away
function resetFiring() {
	clearTimeout(fireTimeout);
	isFiring = false;
}

function keydown(event) {
	if (event.keyCode == 32) {
		event.preventDefault(); // stops the page scrolling

		// only fire while the game is running, not while locked, and not on key auto-repeat
		if (gameRunning == true && isFiring == false && event.repeat == false) {
			fireArrow();
		}
	}
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
}

// each tank drives up and down; these arrays hold one value per tank (same order as the 'tank' elements)
var tanks = [];
var tankTops = []; // each tank's current top position in pixels (kept as numbers so slow speeds like 0.7 still work)
var tankSpeeds = []; // pixels moved every 20 milliseconds, chosen randomly for each tank
var tankDirections = []; // 1 = moving down, -1 = moving up
var moveTanksTimeout = 0;
var tankMinTop = 70; // keeps the tanks below the score / lives area
var minSpeed = 0.5;
var maxSpeed = 4;

// time between bombs is chosen randomly each time, between these two values (milliseconds)
var minBombDelay = 1200; // (set by applyLevelDifficulty)
var maxBombDelay = 3500; // (set by applyLevelDifficulty)

// gives every tank a new random height on the right side (the CSS keeps them at left: 80%) and a new random speed
function setupTanks() {
	tanks = document.getElementsByClassName('tank');
	tankTops = [];
	tankSpeeds = [];
	tankDirections = [];

	for (var i = 0; i < tanks.length; i++) {
		var randomRange = window.innerHeight - tanks[i].offsetHeight - tankMinTop; // room between the HUD area and the bottom
		var randomTop = tankMinTop + Math.random() * randomRange;
		tanks[i].style.top = randomTop + 'px';
		tankTops.push(randomTop);
		tankSpeeds.push(minSpeed + Math.random() * (maxSpeed - minSpeed));

		if (Math.random() < 0.5) {
			tankDirections.push(1);
		} else {
			tankDirections.push(-1);
		}
	}
}

// moves every tank up or down by its own speed, turning around at the top and bottom of the screen
function moveTanks() {
	for (var i = 0; i < tanks.length; i++) {
		var maxTop = window.innerHeight - tanks[i].offsetHeight;
		var newTop = tankTops[i] + tankSpeeds[i] * tankDirections[i];

		if (newTop <= tankMinTop) {
			newTop = tankMinTop;
			tankDirections[i] = 1;
		}
		if (newTop >= maxTop) {
			newTop = maxTop;
			tankDirections[i] = -1;
		}

		tankTops[i] = newTop;
		tanks[i].style.top = newTop + 'px';
	}
}

// waits a random time, shoots one bomb, then schedules the next one
function scheduleNextBomb() {
	clearTimeout(bombTimeout); // make sure only one bomb timer can ever be waiting
	var delay = minBombDelay + Math.random() * (maxBombDelay - minBombDelay);
	bombTimeout = setTimeout(shootBomb, delay);
}

function shootBomb() {
	createBomb();
	scheduleNextBomb();
}

// each bomb explodes at a random point near the player: up to this many pixels left/right and up/down of the player
var explosionSpreadX = 250;
var explosionSpreadY = 100;
var minBombTravel = 150; // a bomb always flies at least this far, so it never explodes right next to its tank

// picks one of the three tanks at random and creates a bomb next to it
function createBomb() {
	var tankList = document.getElementsByClassName('tank');
	var randomIndex = Math.floor(Math.random() * tankList.length);
	var tank = tankList[randomIndex];

	var bomb = document.createElement('div');
	bomb.className = 'bomb';
	bomb.style.left = tank.offsetLeft + 'px';
	bomb.style.top = (tank.offsetTop + (tank.offsetHeight / 2) - 5) + 'px';

	// positions are kept as numbers on the bomb itself, because offsetLeft/offsetTop are rounded to whole pixels
	bomb.posLeft = tank.offsetLeft;
	bomb.posTop = tank.offsetTop + (tank.offsetHeight / 2) - 5;

	// this bomb's own trajectory: always moves left by bombSpeed, and up or down toward its random explosion point,
	// which is somewhere near where the player is standing right now (so the player can really be hit, but can also dodge)
	// the vertical speed is limited to -maxBombSpeedY / +maxBombSpeedY so the angle stays shallow
	var player = document.getElementById('player');
	var targetTop = player.offsetTop + (player.offsetHeight / 2) - 5 + (Math.random() * 2 - 1) * explosionSpreadY;
	if (targetTop < 0) {
		targetTop = 0;
	}
	if (targetTop > window.innerHeight - 10) {
		targetTop = window.innerHeight - 10;
	}

	var targetLeft = player.offsetLeft + (Math.random() * 2 - 1) * explosionSpreadX;
	if (targetLeft > bomb.posLeft - minBombTravel) {
		targetLeft = bomb.posLeft - minBombTravel;
	}
	if (targetLeft < 0) {
		targetLeft = 0;
	}
	bomb.targetLeft = targetLeft; // the bomb explodes when it reaches this column

	var ticksToTarget = (bomb.posLeft - bomb.targetLeft) / bombSpeed;
	var aimedSpeedY = 0;
	if (ticksToTarget > 0) {
		aimedSpeedY = (targetTop - bomb.posTop) / ticksToTarget;
	}
	if (aimedSpeedY > maxBombSpeedY) {
		aimedSpeedY = maxBombSpeedY;
	}
	if (aimedSpeedY < -maxBombSpeedY) {
		aimedSpeedY = -maxBombSpeedY;
	}
	bomb.speedX = bombSpeed;
	bomb.speedY = aimedSpeedY;

	// turn the picture to point the way the bomb is travelling (the CSS already turns it 180deg to face left)
	var angle = Math.atan(bomb.speedY / bomb.speedX) * 180 / Math.PI;
	bomb.style.transform = 'rotate(' + (180 - angle) + 'deg)';

	document.body.appendChild(bomb);

	bombs.push(bomb);
}

// moves every active bomb to the left; turns a bomb into an explosion once it reaches the left edge of the screen
function moveBombs() {
	for (var i = bombs.length - 1; i >= 0; i--) {
		var bomb = bombs[i];
		var newLeft = bomb.posLeft - bomb.speedX;
		var newTop = bomb.posTop + bomb.speedY;

		// keep the bomb on the screen vertically so it can still reach the left edge
		if (newTop < 0) {
			newTop = 0;
		}
		if (newTop > window.innerHeight - 10) {
			newTop = window.innerHeight - 10;
		}

		// the bomb explodes where it is (a) when it reaches its random explosion point, or (b) the moment it touches the player,
		// so it can never fly through the player and only explode later
		var touchesPlayer = bombTouchesPlayer(newLeft, newTop);

		if (newLeft <= bomb.targetLeft || touchesPlayer == true) {
			document.body.removeChild(bomb);
			bombs.splice(i, 1);

			// the explosion cross is centred on the bomb's own centre (the bomb picture is 31 x 10 pixels)
			createExplosion(newLeft + 15, newTop + 5);
			checkExplosionCollisions(); // check straight away so the life is lost at the moment of the explosion

			if (isGameOver == true) {
				return; // the player just lost the last life - stop moving bombs
			}
		} else {
			bomb.posLeft = newLeft;
			bomb.posTop = newTop;
			bomb.style.left = newLeft + 'px';
			bomb.style.top = newTop + 'px';
		}
	}
}

// true if a bomb (31 x 10 pixels) with its top left corner at bombLeft / bombTop is touching the player
function bombTouchesPlayer(bombLeft, bombTop) {
	var player = document.getElementById('player');
	var playerRight = player.offsetLeft + player.offsetWidth;
	var playerBottom = player.offsetTop + player.offsetHeight;

	return bombLeft < playerRight && bombLeft + 31 > player.offsetLeft && bombTop < playerBottom && bombTop + 10 > player.offsetTop;
}

// creates an explosion with the CENTRE of its cross at the given point (x, y); it removes itself after playing once
// the CSS puts the explosion box's left edge 64 pixels left of 'left' (margin-left: -64px) and the flat bar of the cross
// 32 pixels high at the top of the box, so the box is moved up 16 pixels to centre the bar on y
function createExplosion(x, y) {
	var explosion = document.createElement('div');
	explosion.className = 'explosion';
	explosion.style.left = x + 'px';
	explosion.style.top = (y - 16) + 'px';
	explosion.hasHitPlayer = false; // becomes true the moment this explosion takes one life, so it can never take a second
	document.body.appendChild(explosion);

	explosions.push(explosion);

	setTimeout(removeExplosion, explosionDuration, explosion);
}

// removes one explosion element from the page; called by setTimeout once the explosion has been shown long enough
function removeExplosion(explosion) {
	if (explosion.parentNode) {
		// the explosion is over: if it never hit the player (and the game is still running), the bomb was avoided
		// this code only runs while the explosion is still on the page, so each bomb can score at most once
		if (explosion.hasHitPlayer == false && isGameOver == false) {
			recordAvoidedBomb();
		}

		document.body.removeChild(explosion);
	}

	for (var i = 0; i < explosions.length; i++) {
		if (explosions[i] == explosion) {
			explosions.splice(i, 1);
			break;
		}
	}
}

// checks every active explosion against the player's current position
function checkExplosionCollisions() {
	var player = document.getElementById('player');
	var playerLeft = player.offsetLeft;
	var playerTop = player.offsetTop;
	var playerRight = playerLeft + player.offsetWidth;
	var playerBottom = playerTop + player.offsetHeight;

	for (var i = 0; i < explosions.length; i++) {
		var explosion = explosions[i];

		// this explosion already took a life earlier - skip it so it cannot take another
		if (explosion.hasHitPlayer == true) {
			continue;
		}

		// the CSS draws the explosion as a cross: a flat bar (128 x 32) at the top of the explosion box, and a
		// tall beam (32 x 160) that starts 68 pixels ABOVE the box and sits 48 pixels from its left edge.
		// the player is hit only when touching the bar or the beam, not the empty rest of the box
		var barLeft = explosion.offsetLeft;
		var barTop = explosion.offsetTop;
		var beamLeft = barLeft + 48;
		var beamTop = barTop - 68;

		var touchingBar = playerLeft < barLeft + 128 && playerRight > barLeft && playerTop < barTop + 32 && playerBottom > barTop;
		var touchingBeam = playerLeft < beamLeft + 32 && playerRight > beamLeft && playerTop < beamTop + 160 && playerBottom > beamTop;

		if (touchingBar || touchingBeam) {
			explosion.hasHitPlayer = true;
			loseLife();

			if (isGameOver == true) {
				return; // the game just ended - stop checking the rest of the explosions
			}
		}
	}
}

// removes one life icon from the health list; triggers game over once none remain
function loseLife() {
	var healthList = document.getElementsByClassName('health')[0];
	var lives = healthList.getElementsByTagName('li');

	if (lives.length > 0) {
		healthList.removeChild(lives[lives.length - 1]);
	}

	if (lives.length == 0) {
		gameOver();
	} else {
		hitPlayer();
	}
}

// shows the hit pose (using the player's current facing direction) for hitDuration milliseconds
function hitPlayer() {
	var player = document.getElementById('player');
	var direction = getPlayerDirection();

	player.className = 'character hit ' + direction;
	playerIsHit = true;

	setTimeout(clearHit, hitDuration);
}

// runs once the hit pose has been shown long enough; lets move()/keyup() take over the className again
function clearHit() {
	playerIsHit = false;

	// if no movement key is currently held, nothing else will update the className, so do it here
	if (upPressed == false && downPressed == false && leftPressed == false && rightPressed == false && isGameOver == false) {
		var player = document.getElementById('player');
		player.className = 'character stand ' + getPlayerDirection();
	}
}

// starts the gameplay timers; used by both startGame() and restartGame()
function startTimers() {
	stopTimers(); // safety: never let two sets of timers run at once
	setupTanks();

	timeout = setInterval(move, 10);
	moveBombsTimeout = setInterval(moveBombs, 20);
	explosionTimeout = setInterval(checkExplosionCollisions, 20);
	moveTanksTimeout = setInterval(moveTanks, 20);
	arrowTimeout = setInterval(moveArrows, 20);
	gameRunning = true;
	scheduleNextBomb(); // bombTimeout is a setTimeout chain, not a setInterval
}

// stops the gameplay timers
function stopTimers() {
	clearInterval(timeout);
	clearTimeout(bombTimeout);
	clearInterval(moveBombsTimeout);
	clearInterval(explosionTimeout);
	clearInterval(moveTanksTimeout);
	clearInterval(arrowTimeout);
	gameRunning = false;
}

// shows the player's existing "dead" animation
function showDeadPlayer() {
	var player = document.getElementById('player');
	player.className = 'character stand dead';
}

// creates the score box and the high score box with JavaScript (the starter HTML and CSS are not allowed to change)
// runs once, when the page loads
function createScoreElements() {
	var hud = document.getElementsByClassName('hud')[0];
	var boxStyle = 'position: absolute; left: 20px; color: white; text-shadow: 2px 2px 2px #000; font-family: Anton, sans-serif; background-color: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 6px 12px;';

	var scoreBox = document.createElement('div');
	scoreBox.id = 'score';
	scoreBox.style.cssText = boxStyle + 'top: 10px; font-size: 1.6em;';
	scoreBox.innerHTML = 'Score: 0 &nbsp;&nbsp; Level: 1';
	hud.appendChild(scoreBox);

	var highScoreBox = document.createElement('div');
	highScoreBox.id = 'highScores';
	highScoreBox.style.cssText = boxStyle + 'top: 60px; font-size: 1em;';
	highScoreBox.innerHTML = 'High Scores';
	hud.appendChild(highScoreBox);

	var highScoreList = document.createElement('ol');
	highScoreList.id = 'highScoreList';
	// the starter CSS floats every <ul>/<ol>-style list to the right, so these are set here to undo that
	highScoreList.style.cssText = 'float: none; margin: 4px 0 0 0; padding-left: 24px; list-style-type: decimal;';
	highScoreBox.appendChild(highScoreList);
}

// writes the current score and level into the score element
function showScore() {
	document.getElementById('score').innerHTML = 'Score: ' + score + ' &nbsp;&nbsp; Level: ' + level;
}

// one bomb was avoided (its explosion missed the player) or destroyed by an arrow: add a point and update the level
function recordAvoidedBomb() {
	if (isGameOver == true) {
		return;
	}

	score = score + 1;
	addAvoidedBombToLevel();
	showScore();
}

// how many avoided bombs are needed to finish the current level: 10, 15, 20, 25, ...
function bombsNeededForLevel() {
	return 10 + (level - 1) * 5;
}

// sets the bomb speed, angle and shooting frequency for the current level
// the levels never stop: difficulty goes up every level, but by smaller and smaller steps towards a limit,
// so the game always stays possible (bombs never get faster than 8 pixels per tick and the delays never reach 0)
function applyLevelDifficulty() {
	var stage = level - 1; // 0 on level 1
	var harder = 1 - Math.pow(0.9, stage); // 0 on level 1, then 0.1, 0.19, 0.27 ... getting closer and closer to 1

	bombSpeed = 2 + 6 * harder; // level 1: 2, level 10: 5.7, never more than 8
	maxBombSpeedY = 1 + 1.5 * harder; // level 1: 1, level 10: 1.9, never more than 2.5
	minBombDelay = 1200 - 700 * harder; // level 1: 1200, level 10: 770, never less than 500
	maxBombDelay = 3500 - 2000 * harder; // level 1: 3500, level 10: 2275, never less than 1500
}

// called once for every bomb that was avoided (same place the score goes up); moves to the next level when enough are avoided
function addAvoidedBombToLevel() {
	bombsAvoidedThisLevel = bombsAvoidedThisLevel + 1;

	if (bombsAvoidedThisLevel >= bombsNeededForLevel()) {
		level = level + 1;
		bombsAvoidedThisLevel = 0;
		applyLevelDifficulty();
	}
}

// reads the saved high scores from Local Storage; returns an empty array if there are none
function loadHighScores() {
	var saved = localStorage.getItem(highScoreKey);
	if (saved == null) {
		return [];
	}

	try {
		var scores = JSON.parse(saved);
		if (Array.isArray(scores)) {
			return scores;
		}
	} catch (error) {
		// the saved text was damaged - fall through and start with an empty list
	}
	return [];
}

// adds one name/score record to the saved high scores (best scores first) and writes them back to Local Storage
function saveHighScore(name, newScore) {
	var scores = loadHighScores();
	scores.push({ name: name, score: newScore });

	// higher scores go first
	scores.sort(function (a, b) {
		return b.score - a.score;
	});

	// keep only the best few
	scores = scores.slice(0, maxHighScores);

	localStorage.setItem(highScoreKey, JSON.stringify(scores));
}

// rebuilds the high score list on the screen from Local Storage
function showHighScores() {
	var list = document.getElementById('highScoreList');
	list.innerHTML = '';

	var scores = loadHighScores();
	if (scores.length == 0) {
		list.innerHTML = 'No high scores yet.';
		return;
	}

	for (var i = 0; i < scores.length; i++) {
		var item = document.createElement('li');
		item.textContent = scores[i].name + ' - ' + scores[i].score;
		list.appendChild(item);
	}
}

// asks the player for their name and saves the score (the Game over / Play Again button is already on the screen by now)
function finishGame() {
	if (isGameOver == false) {
		return; // a new game has already been started
	}

	try {
		var name = prompt('Game over! Your score: ' + score + '\nEnter your name:');
		if (name == null || name.trim() == '') {
			name = 'Player';
		}

		saveHighScore(name.trim(), score);
		showHighScores();
	} catch (error) {
		// ignore: a problem with the name or Local Storage must not matter, the Play Again button is already shown
	}

	// safety net: if the button is somehow not on the page, show it again
	if (document.getElementById('gameOverMessage') == null) {
		showGameOverMessage();
	}
}

// creates the "Game over / Play Again" message and makes it restart the game when clicked
function showGameOverMessage() {
	// never leave an old message behind, so two buttons can never overlap
	var oldMessage = document.getElementById('gameOverMessage');
	if (oldMessage) {
		document.body.removeChild(oldMessage);
	}

	var message = document.createElement('div');
	message.className = 'start';
	message.id = 'gameOverMessage';
	message.style.position = 'fixed'; // stays in the middle of the window even if the page was scrolled
	message.style.zIndex = '2000'; // above everything else
	message.innerHTML = 'Game over<br>Play Again';
	document.body.appendChild(message);

	message.addEventListener('click', restartGame);
}

// runs once, when the player loses the third life
function gameOver() {
	if (isGameOver == true) {
		return;
	}
	isGameOver = true;

	// each step is protected, so an error in one of them can never stop the Play Again button from appearing
	try {
		stopTimers();
		removeAllArrows();
		resetFiring();
		showDeadPlayer();
	} catch (error) {
		// ignore
	}

	// the Play Again button is shown straight away, it does not wait for the name prompt
	showGameOverMessage();

	// let the dead animation play, then ask for the name
	gameOverTimeout = setTimeout(finishGame, gameOverDelay);
}

// runs when "Play Again" is clicked; puts everything back to how it was before Start was first pressed
function restartGame() {
	clearTimeout(gameOverTimeout); // the name prompt of the old game must never appear in the new one
	removeFromPage(document.getElementById('gameOverMessage'));

	// reset lives back to exactly 3
	var healthList = document.getElementsByClassName('health')[0];
	var oldLives = healthList.getElementsByTagName('li');
	for (var i = oldLives.length - 1; i >= 0; i--) {
		healthList.removeChild(oldLives[i]);
	}
	for (var i = 0; i < 3; i++) {
		var life = document.createElement('li');
		healthList.appendChild(life);
	}

	// reset the player back to its starting position and pose
	var player = document.getElementById('player');
	player.style.top = '';
	player.style.left = '';
	player.className = 'character stand down';

	// remove every bomb that is still on screen
	for (var i = 0; i < bombs.length; i++) {
		removeFromPage(bombs[i]);
	}
	bombs = [];

	// remove every explosion that is still on screen
	for (var i = 0; i < explosions.length; i++) {
		removeFromPage(explosions[i]);
	}
	explosions = [];

	// remove every arrow and cancel the firing lock
	removeAllArrows();
	resetFiring();

	// reset the score (the saved high scores are left alone)
	score = 0;
	level = 1;
	bombsAvoidedThisLevel = 0;
	applyLevelDifficulty();
	showScore();

	// reset key/game state
	upPressed = false;
	downPressed = false;
	leftPressed = false;
	rightPressed = false;
	lastPressed = false;
	playerIsHit = false;
	isGameOver = false;

	startTimers();
}

// runs once, when the Start button is clicked
function startGame() {
	var startButton = document.getElementsByClassName('start')[0];
	startButton.style.display = 'none';

	startTimers();
}

function myLoadFunction() {
	document.addEventListener('keydown', keydown);
	document.addEventListener('keyup', keyup);

	createScoreElements();
	showScore();
	showHighScores();

	var startButton = document.getElementsByClassName('start')[0];
	startButton.addEventListener('click', startGame);
}

document.addEventListener('DOMContentLoaded', myLoadFunction);
