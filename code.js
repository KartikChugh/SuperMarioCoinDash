var MS_PER_TICK = 10;

var KEY = {SPACE:32, RIGHT:39, LEFT:37};
var CSTATE = {FREE:0, RIGID:1};
var VSTATE = {REST:0, JUMP:1};
var HSTATE = {REST_RIGHT:0, REST_LEFT:1, WALK_RIGHT:2, WALK_LEFT:3};

var COIN_IDS = [0,1,2,3,4];
var HAZARD_IDS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

var mario;
var coins, hazards, coins_despawn, hazards_despawn;
var ticks, score, lives;
var highScore = 0;

var curtain;
var scoring, highScoring;

// UTILITY

function isColliding(elem, width, height) {
  var rect1 = {x:mario.x, y:mario.y, width:32, height:32};
  var rect2 = {x:getXPosition(elem), y:getYPosition(elem), width:width, height:height};
  
  if (rect1.x < rect2.x + rect2.width &&
   rect1.x + rect1.width > rect2.x &&
   rect1.y < rect2.y + rect2.height &&
   rect1.y + rect1.height > rect2.y) {
    return true;
  }
  return false;
}

function formatScore(scoreNum) {
  return ("0000000" + ~~scoreNum).slice(-7);
}

function updateScore(delta) {
  score += delta;
  setText("score", formatScore(score));
}

function updateLives(delta) {
  lives += delta;
  setText("lives", ("⨯ " + lives));
  if (lives === 0) endGame();
  else mario.invincibility = 10;
}

// HAZARD

function Hazard(x, y) {
  this.x = x;
  this.y = y;
  this.vy = 3;
  this.getStr = function() {
    return "hazard" + this.id;
  };
}

function updateHazards() {
  hazards_despawn = [];
  for (var i in hazards) {
    var h = hazards[i];
    updateHazardY(h);
    updateHazardStatus(i, h);
  }
  performHazardsDespawn();  
}

function updateHazardY(h) {
  h.y += h.vy;
  setPosition(h.getStr(),h.x,h.y);
}

function updateHazardStatus(i, h) {
  if (h.y >= 440) scheduleHazardDespawn(i, h);
  else if (isColliding(h.getStr(), 32, 32) && mario.invincibility === -1) {
    updateLives(-1);
    scheduleHazardDespawn(i, h);
  }
}

function scheduleHazardDespawn(i, h) {
  hazards_despawn.push(i);
  hideElement(h.getStr());
}

function performHazardsDespawn() {
  var offset = 0;
  for (var i in hazards_despawn) {
    var hazardIndex = hazards_despawn[i] - offset;
    hazards.splice(hazardIndex, 1);
    offset++;
  }
}

function spawnHazard() {
  var spawnH = new Hazard(randomNumber(0,290),-30);
  var spawnId = 0;
  for (var i in HAZARD_IDS) {
    var HAZARD_ID = HAZARD_IDS[i];
    var present = false;
    for (var j in hazards) {
      var hazard = hazards[j];
      present = present || (hazard.id===HAZARD_ID);
    }
    if (present === false) {
      spawnId = HAZARD_ID;
      break;
    }
  }
  
  spawnH.id = spawnId;
  hazards.push(spawnH);
  showElement(spawnH.getStr());
}

// COIN

function Coin(x, y) {
  this.x = x;
  this.y = y;
  this.vy = 3;
  this.getStr = function() {
    return "coin" + this.id;
  };
}

function updateCoins() {
  coins_despawn = [];
  for (var i in coins) {
    var c = coins[i];
    updateCoinY(c);
    updateCoinStatus(i, c);
  }
  performCoinsDespawn();    
}

function updateCoinY(c) {
  c.y += c.vy;
  setPosition(c.getStr(),c.x,c.y);
}

function updateCoinStatus(i, c) {
  if (c.y >= 440) scheduleCoinDespawn(i, c);
  else if (isColliding(c.getStr(), 32, 32)) {
    playSound("assets/coin.mp3", false);
    updateScore(200);
    scheduleCoinDespawn(i, c);
  }
}

function scheduleCoinDespawn(i, c) {
  coins_despawn.push(i);
  hideElement(c.getStr());
}

function performCoinsDespawn() {
  for (var i in coins_despawn) {
    var coinIndex = coins_despawn[i];
    coins.splice(coinIndex, 1);
  }
}

function spawnCoin() {
  var spawnC = new Coin(randomNumber(15,275),-30);
  var spawnId = 0;
  for (var i in COIN_IDS) {
    var COIN_ID = COIN_IDS[i];
    var present = false;
    for (var j in coins) {
      var coin = coins[j];
      present = present || (coin.id===COIN_ID);
    }
    if (present === false) {
      spawnId = COIN_ID;
      break;
    }
  }
  spawnC.id = spawnId;
  coins.push(spawnC);
  showElement(spawnC.getStr());
}

// MARIO

function updateMario() {
  updateMarioY();
  if (mario.cstate !== CSTATE.RIGID) updateMarioX();
  setPosition("mario",mario.x,mario.y);
  if (mario.cstate === CSTATE.RIGID) return;
  if (ticks % 10 === 0) updateMarioVisibility();
  if (ticks % 10 === 0) updateMarioSprite();
}

function updateMarioY() {
  mario.vy += mario.ay;
  mario.y += mario.vy;
  if (mario.cstate === CSTATE.RIGID) return;
  if (mario.y >= 415-48) {
    mario.vstate = VSTATE.REST;
    mario.vy = 0;
    mario.y = 415-48;
  }
}

function updateMarioX() {
  if (mario.hstate === HSTATE.WALK_RIGHT) {
    mario.x += 3;
  } else if (mario.hstate === HSTATE.WALK_LEFT) {
    mario.x -= 3;
  }
  if (mario.x > 310) mario.x = -30;
  if (mario.x < -30) mario.x = 310;
}

function updateMarioVisibility() {
  if (mario.invincibility === 0) {
    showElement("mario"); 
    mario.invincibility--;
  }
  if (mario.invincibility === -1) return;
  if (mario.invincibility % 2 === 0) {
    showElement("mario");
  } else {
    hideElement("mario");
  }
  mario.invincibility--;
}

function updateMarioSprite() {
  
  if (mario.hstate === HSTATE.REST_RIGHT) {
    setImageURL("mario","assets/right.png");
  } else if (mario.hstate === HSTATE.REST_LEFT) {
    setImageURL("mario","assets/left.png");
    
  } else if (mario.hstate === HSTATE.WALK_RIGHT) {
    if (getImageURL("mario") === "assets/rightB.png" && mario.vstate === VSTATE.REST) {
      setImageURL("mario","assets/right.png");
    } else {
      setImageURL("mario","assets/rightB.png");
    }
  } else if (mario.hstate === HSTATE.WALK_LEFT) {
    if (getImageURL("mario") === "assets/leftB.png"  && mario.vstate === VSTATE.REST) {
      setImageURL("mario","assets/left.png");
    } else {
      setImageURL("mario","assets/leftB.png");
    }
  }
}

// MAIN ENGINE

function initializeVars() {
  mario = {
    x: 25, y: 215,
    vx: 0, vy: 0,
    ay: 0.2,
    vstate: VSTATE.REST,
    hstate: HSTATE.REST_RIGHT,
    cstate: CSTATE.FREE,
    invincibility: -1,
  };
  coins = []; 
  hazards = [];
  coins_despawn = [];
  hazards_despawn = [];
  ticks = 0;
  score = 0;
  lives = 3;
  setText("score", formatScore(score));
  setText("lives", ("⨯ " + lives));
  curtain = 1;
  scoring = 0; 
  highScoring = 0;
}

function cleanScreen() {
  for (var i in COIN_IDS) {
    var COIN_ID = COIN_IDS[i];
    hideElement("coin" + COIN_ID);
  }
  for (var j in HAZARD_IDS) {
    var HAZARD_ID = HAZARD_IDS[j];
    hideElement("hazard" + HAZARD_ID);
  }
}

function startGame() {
  cleanScreen();
  initializeVars();
  playSound("assets/overworld.mp3", true);
  setScreen("game");
  tick();
}

function endGame() {
  stopSound("assets/overworld.mp3");
  playSound("assets/death.mp3");
  highScore = Math.max(score, highScore);
  setImageURL("mario","assets/deathA.png");
  mario.cstate = CSTATE.RIGID;
  mario.hstate = HSTATE.REST_RIGHT;
  mario.vy = 0;
  mario.ay = 0;
  setTimeout(function() {
    mario.ay = 0.10;
    mario.vy = -5;
    descendMario();
  }, MS_PER_TICK * 75);
}

// Recursive
function descendMario() {
  if (mario.y >= 450) {
    mario.ay = 0;
    mario.vy = 0;
    showElement("curtain");
    narrowScreen();
    return;
  }
  updateMario();
  setTimeout(function() {descendMario()}, MS_PER_TICK);
}

// Recursive
function narrowScreen() {
  if (curtain >= 450) {
    showScoring();
    return;
  }
  curtain += 5;
  setSize("curtain", 320, curtain);
  setTimeout(function() {narrowScreen()}, MS_PER_TICK);
}

function showScoring() {
  setScreen("lose");
  showElement("loseTitle");
  hideElement("curtain");
  
  setTimeout(function() {
    hideElement("loseTitle");
    setTimeout(function() {
      setScreen("scoring");
      incrementScoring();
    }, MS_PER_TICK * 75);
  }, MS_PER_TICK * 325);
}

// Recursive
function incrementScoring() {
  if (scoring === score && highScoring === highScore) {
    showElement("scoringSubtitle");
    return;
  }
  var scoringDelta = score/50;
  scoring = Math.min(scoring+scoringDelta, score);
  setText("yourScore", formatScore(scoring));
  
  var highScoringDelta = highScore/50;
  highScoring = Math.min(highScoring+highScoringDelta, highScore);
  setText("highScore", formatScore(highScoring));
  playSound("assets/coin.mp3"); 
  setTimeout(function(){incrementScoring()}, MS_PER_TICK);
}

// Recursive
function tick() {
  
  if (mario.cstate === CSTATE.RIGID) return;
  
  setTimeout(function() {
    ticks++;
    tick();
  }, MS_PER_TICK);
  
  updateMario();
  
  if (ticks % 40 === 0) spawnCoin();
  updateCoins();
  
  if (ticks % (80 - 10 * ~~(ticks / 1000)) === 0) {
    var r = Math.random();
    if (r < 0.75) spawnHazard();
    if (r < 0.1) spawnHazard();
    if (r < 0.02) spawnHazard();
  }
  updateHazards();
  
  if (ticks % 50 === 0) updateScore(5);
  
}

// KEY

onEvent("game", "keydown", function(event) {
  
  if (mario.cstate === CSTATE.RIGID) return;
  
  // JUMP: only if at vertical rest
  if (event.keyCode === KEY.SPACE && mario.vstate === VSTATE.REST) {
    mario.vy = -7;
    mario.vstate = VSTATE.JUMP;
  }
  
  // WALK
  if (event.keyCode === KEY.RIGHT) {
    mario.hstate = HSTATE.WALK_RIGHT;
  } else if (event.keyCode === KEY.LEFT) {
    mario.hstate = HSTATE.WALK_LEFT;
  } 

});

onEvent("game", "keyup", function(event){
  
  if (mario.cstate === CSTATE.RIGID) return;
  
  // STOP WALK
  if (event.keyCode === KEY.RIGHT && mario.hstate === HSTATE.WALK_RIGHT) {
    mario.hstate = HSTATE.REST_RIGHT;
  } else if (event.keyCode === KEY.LEFT && mario.hstate === HSTATE.WALK_LEFT) {
    mario.hstate = HSTATE.REST_LEFT;
  }
});

onEvent("home", "keydown", function(event) {
  if (event.keyCode === KEY.SPACE) {
    startGame();
  } 
});

onEvent("scoring", "keydown", function(event) {
  if (event.keyCode === KEY.SPACE) {
    setScreen("home");
  } 
});

