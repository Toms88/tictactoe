
var plays = 0;
var table;
var players = ["O", "X"];
var lastPlayed;
var otherPlayer;
var you;
var yourScore = 0;
var enemyScore = 0;
const s = io();

s.on('otherPlayerId', (id, y) => {
  if (typeof id !== "undefined") {
    otherPlayer = id;
    you = y;
    document.getElementsByClassName('waiting')[0].className += " hide";
    nextPlay(lastPlayed, players);
  }
});

s.on('played', (sign, lIndex, cIndex) => {
  console.log("received played data");
  var gameArea = document.getElementById('game');
  table[lIndex][cIndex] = sign;
  gameArea.getElementsByClassName('line')[lIndex].getElementsByClassName('case')[cIndex].className += " " + sign + "player clicked";
  gameArea.getElementsByClassName('line')[lIndex].getElementsByClassName('case')[cIndex].innerHTML = sign;
  lastPlayed = sign;
  if (!checkVictory(table)) {
    if (!tableIsCompleted(table)) {
      nextPlay(lastPlayed, players);
    } else {
      //s.disconnect();
      setTimeout(function() {
        //window.location.reload(true);
        table = buildTable();
        buildHTMLTable(table);
      }, 3000);
      document.getElementById('equal').className = "show";
      removeListeners();
    }
  } else {
    //s.disconnect();
    updateEnemyScore();
    setTimeout(function() {
      table = buildTable();
      buildHTMLTable(table);
    }, 3000);
    document.getElementById('lose').className = "show";
    removeListeners();
  }
});

window.addEventListener('beforeunload', e => {
  s.disconnect();
});

const updateEnemyScore = () => {
  enemyScore++;
  document.getElementById('enemyScore').getElementsByClassName('score')[0].innerHTML = enemyScore;
}

const updatePlayerScore = () => {
  yourScore++;
  document.getElementById('yourScore').getElementsByClassName('score')[0].innerHTML = yourScore;
}

const buildTable = () => {
  var t = new Array([], [], []);
  t.map(l => {
    for (var i = 0; i < 3; i++) {
      l.push(undefined);
    }
    return l;
  });
  return t;
}

const buildHTMLTable = (table) => {
  var win = document.getElementById('win');
  var lose = document.getElementById('lose');
  var equal = document.getElementById('equal');
  var gameArea = document.getElementById('game');
  var i = 0;
  var lines = gameArea.getElementsByClassName('line');
  lastPlayed = players[plays % 2]
  plays++;
  win.classList.remove('show');
  lose.classList.remove('show');
  equal.classList.remove('show');
  if ((typeof lines !== "undefined") && (lines.length)) {
    Array.from(lines).map(l => l.remove());
  }
  if ((typeof table !== "undefined") && (typeof table.map !== "undefined")) {
    table.map(l => {
      var j = 0;
      var lHTML = document.createElement('div');
      lHTML.className = "line";
      lHTML.attributes.index = i;
      l.map(s => {
        var sub = document.createElement('div');
        sub.className = "case";
        sub.attributes.lineIndex = i;
        sub.attributes.caseIndex = j;
        lHTML.append(sub);
        j++;
      });
      gameArea.append(lHTML);
      i++;
      return l;
    });
    if (plays > 1) {
      nextPlay(lastPlayed, players);
    }
  }
}

const checkDiagonals = () => {
  var gameArea = document.getElementById('game');
  var i = 0;
  if (table[1][1] === lastPlayed) {
    if ((table[0][0] === lastPlayed) && (table[2][2] === lastPlayed)) {
      Array.from(gameArea.getElementsByClassName('line')).map(l => {
        l.getElementsByClassName('case')[i].className += " success";
        i++;
      });
      return true;
    } else if ((table[0][2] === lastPlayed) && (table[2][0] === lastPlayed)) {
      i = 2;
      Array.from(gameArea.getElementsByClassName('line')).map(l => {
        l.getElementsByClassName('case')[i].className += " success";
        i--;
      });
      return true;
    }
  }
  return false;
}

const checkVerticals = () => {
  var gameArea = document.getElementById('game');
  var ret = false;
  var lineIndex;
  for (var i = 0; i < table.length; i++) {
    lineIndex = 0;
    while (lineIndex < table.length) {
      var ret = (table[lineIndex][i] === lastPlayed);
      if (!ret) {
        break;
      }
      lineIndex++;
    }
    if (ret) {
      lineIndex = 0;
      while (lineIndex < table.length) {
        gameArea.getElementsByClassName('line')[lineIndex].getElementsByClassName('case')[i].className += " success";
        lineIndex++;
      }
      return ret;
    }
  }
}

const checkHorizontals = () => {
  var gameArea = document.getElementById('game');
  var ret = false;
  for (var i = 0; i < table.length; i++) {
    ret = ((table[i][0] === lastPlayed) && (table[i][1] === lastPlayed) && (table[i][2] === lastPlayed));
    if (ret) {
      var line = gameArea.getElementsByClassName('line')[i];
      for (var j = 0; j < table[i].length; j++) {
        line.getElementsByClassName('case')[j].className += " success";
      }
      return ret;
    }
  }
}

const checkVictory = () => {
  return (checkDiagonals() || checkHorizontals() || checkVerticals());
}

const removeListeners = () => {
  var gameArea = document.getElementById('game');
  for (var i = 0; i < table.length; i++) {
    for (var j = 0; j < table[i].length; j++) {
      var selectedCase = gameArea.getElementsByClassName('line')[i].getElementsByClassName('case')[j];
      if (typeof selectedCase.attributes.handler !== "undefined") {
          selectedCase.removeEventListener('click', selectedCase.attributes.handler);
      }
    }
  }
}

const clickOnCase = (evt, player) => {
  var targ = evt.target;
  var lIndex = targ.attributes.lineIndex;
  var cIndex = targ.attributes.caseIndex;
  targ.innerHTML = player;
  targ.className += " " + player + "player clicked";
  if (lIndex < table.length) {
    if (cIndex < table[lIndex].length) {
      table[lIndex][cIndex] = player;
    }
  }
  lastPlayed = player;
  s.emit('played', you, lIndex, cIndex, otherPlayer);
  if (!checkVictory(table)) {
    if (!tableIsCompleted(table)) {
      nextPlay(lastPlayed, players);
    } else {
      //s.disconnect();
      setTimeout(function() {
        table = buildTable();
        buildHTMLTable(table);
      }, 3000);
      document.getElementById('equal').className = "show";
      removeListeners();
    }
  } else {
    //s.disconnect();
    updatePlayerScore();
    setTimeout(function() {
      table = buildTable();
      buildHTMLTable(table);
    }, 3000);
    document.getElementById('win').className = "show";
    removeListeners();
  }
}

const nextPlay = (last, char) => {
  if (char.__proto__.constructor.name === "Array") {
    var nextPlayer;
    var gameArea = document.getElementById('game');
    if (typeof last === "undefined") {
      last = char[1];
    }
    nextPlayer = char.find(el => (el !== last));
    for (var i = 0; i < table.length; i++) {
      for (var j = 0; j < table[i].length; j++) {
        var selectedCase = gameArea.getElementsByClassName('line')[i].getElementsByClassName('case')[j];
        if (typeof selectedCase.attributes.handler !== "undefined") {
            selectedCase.removeEventListener('click', selectedCase.attributes.handler);
        }
        if ((typeof table[i][j] === "undefined") && (you !== last)) {
          var handler = e => {
            clickOnCase.apply(this, [e, nextPlayer]);
          }
          selectedCase.attributes.handler = handler;
          selectedCase.addEventListener('click', handler);
        }
      }
    }
  }
}

const tableIsCompleted = (table) => {
  var ret = true;
  if ((typeof table !== "undefined") && (typeof table.map !== "undefined")) {
    table.map(l => {
      if (typeof l.map !== "undefined") {
        l.map(s => {
          if (typeof s === "undefined") {
            ret = false;
          }
          return s;
        });
        return l;
      } else {
        console.error("Sub Table object sent is not an array");
      }
    });
    return ret;
  } else {
    console.error("Table object sent is not an array");
  }
}


table = buildTable();
buildHTMLTable(table);
