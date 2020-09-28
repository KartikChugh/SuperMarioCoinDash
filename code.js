startHome();

var MS_PER_TICK = 10;

var KEY = {SPACE:32, RIGHT:39, LEFT:37, W:87, A:65, S:83, D:68};

var CSTATE = {FREE:0, RIGID:1};
var VSTATE = {REST:0, JUMP:1};
var HSTATE = {REST_RIGHT:0, REST_LEFT:1, WALK_RIGHT:2, WALK_LEFT:3};

var COIN_IDS = [0,1,2,3,4];
var HAZARD_IDS = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
var SCORE_TOAST_IDS = [0,1,2,3,4];

var mario, star, _1up;
var coins, hazards, coins_despawn, hazards_despawn, scoreToasts, scoreToasts_despawn;
var ticks, score, lives, hazardsDestroyed;
var coinsCollectedStreak;
var highScore = 0;

var curtain;
var scoring, highScoring;

// UTILITY

function isColliding(elem, width, height) {
  var rect1 = {x:mario.x, y:mario.y, width:30, height:30};
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

function formatLives(lives) {
  return "⨯" + lives;
}

function updateScore(delta) {
  score += delta;
  setText("score", formatScore(score));
}

function updateScoreWithToast(delta, x, y) {
  updateScore(delta);
  spawnScoreToast(x,y,delta);
}

function subtractLife() {
  lives -= 1;
  setText("lives", formatLives(lives));
  if (lives === 0) endGame();
  else {
    mario.immunity = 10;
    playSound("assets/smw_pipe.mp3");
  }
}

function addLife() {
  lives += 1;
  setText("lives", formatLives(lives));
  playSound("assets/smw_1-up.mp3");
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
  else if (isColliding(h.getStr(), 28, 28)) {
    scheduleHazardDespawn(i, h);
    if (mario.invincibility !== -1) {
      hazardsDestroyed++;
      if (Math.random() < 0.5) {
        playSound("assets/smw_stomp.mp3");
      } else {
        playSound("assets/smw_kick.mp3");
      }
      
      updateScoreWithToast(hazardsDestroyed * 10, h.x, h.y);
      if (hazardsDestroyed === 30) {
        spawn1up();
      }
    } else if (mario.immunity === -1) {
      subtractLife();
    }
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
  if (c.y >= 440) {
    coinsCollectedStreak = 0;
    scheduleCoinDespawn(i, c);
  }
  else if (isColliding(c.getStr(), 22, 22)) {
    playSound("assets/smw_coin.mp3");
    coinsCollectedStreak++;
    updateScoreWithToast(coinsCollectedStreak*10, c.x, c.y-20);
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

// STAR

function updateStar() {
  updateStarX();
  updateStarY();
  setPosition("star", star.x, star.y);
  updateStarStatus();
}

function updateStarX() {
  star.x += star.vx;
}

function updateStarY() {
  // Oscillate Lakitu, except when star has been plucked & he's going up
  if (star.vy*star.vy > 4) {
    if (!(star.nostar && star.vy < 0)) {
      star.ay *= -1;
    } else {
      // Decrease acceleration for slow lift off the screen
      star.ay *= 0.2;
    }
  }
  star.vy += star.ay;
  star.y += star.vy;
}

function updateStarStatus() {
  if (star.x < -90) {
    star.spawned = false;
    star.vx = 0;
    star.vy = 0;
    hideElement("star");
    return;
  } 
  
  if (isColliding("star", 32, 170)&& mario.invincibility === -1) {
    setImageURL("star", "assets/lakitu_nostar.gif");
    star.nostar = true;
    playSound("assets/smw_power-up.mp3");
    startInvincibility();
  }
}

function spawnStar() {
  star = {
    x: 350, y: 60,
    vx: -1, vy: 0,
    ay: 0.05,
    spawned: true,
    nostar: false,
  };
  setImageURL("star","assets/lakitu.gif");
  showElement("star");
  playSound("assets/smw_power-up_appears.mp3");
}

// SCORE TOAST

function ScoreToast(x, y) {
  this.x = x;
  this.y = y;
  this.vy = -0.2;
  this.getStr = function() {
    return "scoreToast" + this.id;
  };
  this.lifespan = 80;
}

function updateScoreToasts() {
  scoreToasts_despawn = [];
  for (var i in scoreToasts) {
    var st = scoreToasts[i];
    updateScoreToastY(st);
    updateScoreToastStatus(i, st);
  }
  performScoreToastsDespawn();    
}

function updateScoreToastY(st) {
  st.y += st.vy;
  setPosition(st.getStr(),st.x,st.y);
}

function updateScoreToastStatus(i, st) {
  if (st.lifespan === 0) {
    scheduleScoreToastDespawn(i, st);
    return;
  }
  st.lifespan--;
}

function scheduleScoreToastDespawn(i, st) {
  scoreToasts_despawn.push(i);
  hideElement(st.getStr());
}

function performScoreToastsDespawn() {
  for (var i in scoreToasts_despawn) {
    var scoreToastIndex = scoreToasts_despawn[i];
    scoreToasts.splice(scoreToastIndex, 1);
  }
}

function spawnScoreToast(x, y, score) {
  var spawnSt = new ScoreToast(x, y);
  var spawnId = 0;
  for (var i in SCORE_TOAST_IDS) {
    var SCORE_TOAST_ID = SCORE_TOAST_IDS[i];
    var present = false;
    for (var j in scoreToasts) {
      var scoreToast = scoreToasts[j];
      present = present || (scoreToast.id===SCORE_TOAST_ID);
    }
    if (present === false) {
      spawnId = SCORE_TOAST_ID;
      break;
    }
  }
  spawnSt.id = spawnId;
  scoreToasts.push(spawnSt);
  setText(spawnSt.getStr(), "+"+score);
  showElement(spawnSt.getStr());
}

// 1UP

function update1up() {
  update1upX();
  setPosition("1up", _1up.x, _1up.y);
  update1upStatus();
}

function update1upStatus() {
  var hide = false;
  if (_1up.x < 0) {
    hide = true;
  }
  if (isColliding("1up", 28, 28)) {
    addLife();
    hide = true;
  }
  if (hide === true) {
    _1up.vx = 0;
    _1up.x = 400;
    hideElement("1up");
    return;
  }
}

function update1upX() {
  _1up.x += _1up.vx;
}

function spawn1up() {
  _1up = {
    x: 330, y: 415-28,
    vx: -1,
  };
  showElement("1up");
  playSound("assets/smw_message_block.mp3");
}


// MARIO

function updateMario() {
  updateMarioY();
  if (mario.cstate !== CSTATE.RIGID) updateMarioX();
  setPosition("mario",mario.x,mario.y);
  if (mario.cstate === CSTATE.RIGID) return;
  updateMarioInvincibility();
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
  var speed = 3;
  if (mario.invincibility !== -1) {
    speed *= 1.5;
  }
  if (mario.hstate === HSTATE.WALK_RIGHT) {
    mario.x += speed;
  } else if (mario.hstate === HSTATE.WALK_LEFT) {
    mario.x -= speed;
  }
  if (mario.x > 310) mario.x = -30;
  if (mario.x < -30) mario.x = 310;
}

function updateMarioInvincibility() {
  if (mario.invincibility === 2*1000/MS_PER_TICK) {
    startThemeMusic();
  }
  if (mario.invincibility === 1*1000/MS_PER_TICK) {
    playSound("assets/smw_reserve_item_release.mp3");
  }
  if (mario.invincibility === 0) {
    stopInvincibility();
  }
  if (mario.invincibility === -1) {
    return;
  }
  mario.invincibility--;
}

function updateMarioVisibility() {
  if (mario.immunity === 0) {
    showElement("mario"); 
    mario.immunity = -1;
  }
  if (mario.immunity === -1) return;
  if (mario.immunity % 2 === 0) {
    showElement("mario");
  } else {
    hideElement("mario");
  }
  mario.immunity--;
}

function updateMarioSprite() {
  
  var img = null;
  
  if (mario.hstate === HSTATE.REST_RIGHT) {
    img = "right";
  } else if (mario.hstate === HSTATE.REST_LEFT) {
    img = "left";
    
  } else if (mario.hstate === HSTATE.WALK_RIGHT) {
    if (getImageURL("mario").includes("rightB") && mario.vstate === VSTATE.REST) {
      img = "right";
    } else {
      img = "rightB";
    }
  } else if (mario.hstate === HSTATE.WALK_LEFT) {
    if (getImageURL("mario").includes("leftB")  && mario.vstate === VSTATE.REST) {
      img = "left";
    } else {
      img = "leftB";
    }
  }
  
  var modifier = (mario.invincibility !== -1 && mario.invincibility % 30 < 20) ? "_luigi" : "";
  setImageURL("mario", img + modifier + ".png");
}

// MAIN ENGINE

function startHome() {
  setScreen("home");
  playSound("assets/smw_title.mp3", true);
}

function initializeVars() {
  mario = {
    x: 25, y: 215,
    vx: 0, vy: 0,
    ay: 0.2,
    vstate: VSTATE.REST,
    hstate: HSTATE.REST_RIGHT,
    cstate: CSTATE.FREE,
    immunity: -1,
    invincibility: -1,
  };
  star = {
    x: 0, y: 0,
    vx: 0, vy: 0,
    ay: 0,
    spawned: false,
  };
  _1up = {
    x: 0, y: 0,
    vx: 0
  };
  coins = []; 
  hazards = [];
  coins_despawn = [];
  hazards_despawn = [];
  scoreToasts = [];
  ticks = 0;
  score = 0;
  lives = 3;
  hazardsDestroyed = 0;
  coinsCollectedStreak = 0;
  setText("score", formatScore(score));
  setText("lives", formatLives(lives));
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
  for (var k in SCORE_TOAST_IDS) {
    var SCORE_TOAST_ID = SCORE_TOAST_IDS[k];
    hideElement("scoreToast" + SCORE_TOAST_ID);
  }
  hideElement("star");
  hideElement("1up");
}

function startGame() {
  stopSound("assets/smw_title.mp3");
  cleanScreen();
  initializeVars();
  
  startThemeMusic();
  
  setScreen("game");
  tick();
}

function endGame() {
  stopThemeMusic();
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
  playSound("assets/smw_coin.mp3"); 

  setTimeout(function(){incrementScoring()}, MS_PER_TICK);
}

// Recursive
function tick() {
  
  if (mario.cstate === CSTATE.RIGID) return;
  
  setTimeout(function() {
    ticks++;
    tick();
  }, MS_PER_TICK);
  
  if (ticks < 500) stopSound("assets/smw_title.mp3"); // audio fix
  
  updateMario();
  
  if (ticks % 40 === 0) spawnCoin();
  updateCoins();
  
  // Start at 120 ticks. Every 1000 ticks, decrement by 15.
  // Until you get to 30. Then the decrement is 3.
  // Until you get to 20. Then stop decrementing.
  var spawnHazardTickRate = 120;
  spawnHazardTickRate -= 15 * ~~(ticks / 1000);
  if (spawnHazardTickRate < 20) {
    spawnHazardTickRate = 20;
  } else if (spawnHazardTickRate < 30) {
    var lowerBy = 30 - spawnHazardTickRate;
    var newLower = lowerBy/5;
    spawnHazardTickRate = 30 - newLower;
  }
  
  if (ticks % spawnHazardTickRate === 0) {
    var r = Math.random();
    if (r < 0.75) spawnHazard();
    if (r < 0.15) spawnHazard();
    if (r < 0.05) spawnHazard();
  }
  updateHazards();
  
  if (ticks % 6000 === 0 && ticks > 0 && !star.spawned) spawnStar();
  updateStar();
  
  update1up();
  
  updateScoreToasts();
  
  if (ticks % 50 === 0) updateScore(5);
  
}

function startThemeMusic() {
  if (Math.random() < 0.5) {
    playSound("assets/smw_overworld.mp3", true);
  } else {
    playSound("assets/smw_athletic.mp3", true);
  }
}

function stopThemeMusic() {
  stopSound("assets/smw_overworld.mp3");
  stopSound("assets/smw_athletic.mp3");
}

function startInvincibility() {
  mario.invincibility = 13*1000/MS_PER_TICK;
  playSound("assets/smw_invincible.mp3");
  stopThemeMusic();
}

function stopInvincibility() {
  mario.invincibility = -1;
  stopSound("assets/smw_invincible.mp3");
  hazardsDestroyed = 0;
}

// KEY

function isJump(key) {
  return key === KEY.SPACE || key === KEY.W;
}

function isRight(key) {
  return key === KEY.RIGHT || key === KEY.D;
}

function isLeft(key) {
  return key === KEY.LEFT || key === KEY.A;
}

onEvent("game", "keydown", function(event) {
  
  if (mario.cstate === CSTATE.RIGID) return;
  
  // JUMP: only if at vertical rest
  var power = -6;
  if (mario.invincibility !== -1) {
    power *= 1.2;
  }
  if (isJump(event.keyCode) && mario.vstate === VSTATE.REST) {
    mario.vy = power;
    mario.vstate = VSTATE.JUMP;
    playSound("assets/smw_jump.mp3");
  }
  
  // WALK
  if (isRight(event.keyCode)) {
    mario.hstate = HSTATE.WALK_RIGHT;
  } else if (isLeft(event.keyCode)) {
    mario.hstate = HSTATE.WALK_LEFT;
  } 

});

onEvent("game", "keyup", function(event){
  
  if (mario.cstate === CSTATE.RIGID) return;
  
  // STOP WALK
  if (isRight(event.keyCode) && mario.hstate === HSTATE.WALK_RIGHT) {
    mario.hstate = HSTATE.REST_RIGHT;
  } else if (isLeft(event.keyCode) && mario.hstate === HSTATE.WALK_LEFT) {
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
    startHome();
  } 
});

