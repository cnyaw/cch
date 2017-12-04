//
//  HTML5 interactive chinese chess game.
//
//  Copyright (c) 2014 Waync Cheng.
//  All Rights Reserved.
//
//  2014/8/28 Waync created.
//

var SW = 270, SH = 300;                 // Canvas size.
var CW = 25, CH = 25;                   // Cell.
var BW = 9, BH = 10;                    // Board.
var offsetx = Math.floor((SW - CW * BW) / 2);
var offsety = Math.floor((SH - CH * BH) / 2);
var divBoard = null;
var ctx2d;
var movRec;                             // History of moves.
var mov1, movCur;                       // First move, current move.
var bd;                                 // Game board.
var selp, selm;
var movFrom, movTo;

function initGame() {

  //
  // Init game board.
  // 1:SHI, 2:XIANG, 3:ZU, 4: MA, 5:PAO, 6:CHE, 7:KING.
  //

  bd = [
     6, 4, 2, 1, 7, 1, 2, 4, 6,         //   0   1   2   3   4   5   6   7   8
     0, 0, 0, 0, 0, 0, 0, 0, 0,         //   9  10  11  12  13  14  15  16  17
     0, 5, 0, 0, 0, 0, 0, 5, 0,         //  18  19  20  21  22  23  24  25  26
     3, 0, 3, 0, 3, 0, 3, 0, 3,         //  27  28  29  30  31  32  33  34  35
     0, 0, 0, 0, 0, 0, 0, 0, 0,         //  36  37  38  39  40  41  42  43  44
     0, 0, 0, 0, 0, 0, 0, 0, 0,         //  45  46  47  48  49  50  51  52  53
    11, 0,11, 0,11, 0,11, 0,11,         //  54  55  56  57  58  59  60  61  62
     0,13, 0, 0, 0, 0, 0,13, 0,         //  63  64  65  66  67  68  69  70  71
     0, 0, 0, 0, 0, 0, 0, 0, 0,         //  72  73  74  75  76  77  78  79  80
    14,12,10, 9,15, 9,10,12,14          //  81  82  83  84  85  86  87  88  89
  ];
}

function drawGame() {

  //
  // Erase bkgnd.
  //

  ctx2d.strokeStyle = 'black';
  ctx2d.fillStyle = 'white';
  ctx2d.fillRect(0, 0, SW, SH);

  //
  // Draw board.
  //

  for (var i = 0; i < BH - 1; i++) {
    if (4 == i) {
      ctx2d.strokeRect(offsetx + Math.floor(CW / 2), offsety + i * CH + Math.floor(CH / 2), CW * (BH - 2), CH);
      continue;
    }
    for (var j = 0; j < BW - 1; j++) {
      ctx2d.strokeRect(offsetx + j * CW + Math.floor(CW / 2), offsety + i * CH + Math.floor(CH / 2), CW, CH);
    }
  }

  //
  // Draw piece.
  //

  var imgPiece = document.getElementById("imgPiece");

  for (var i = 0; i < bd.length; i++) {
    var p = bd[i];
    if (0 == p) {
      continue;
    }
    p = p - 1;
    var type = p & 0x7, color = p & 0x8 ? 1 : 0;
    var col = i % BW, row = Math.floor(i / BW);
    ctx2d.drawImage(imgPiece, type * CW, color * CH, CW, CH, offsetx + col * CW, offsety + row * CH, CW, CH);
  }

  //
  // Draw arrows.
  //

  var imgArrow = document.getElementById("imgArrow");

  if (mov1 < movCur) {
    ctx2d.drawImage(imgArrow, 0, 0, CW, CH, 0, offsety + 4.5 * CH, CW, CH); // Left.
  }
  if (movCur < movRec.length) {
    ctx2d.drawImage(imgArrow, CW, 0, CW, CH, offsetx + BW * CW, offsety + 4.5 * CH, CW, CH); // Right.
  }

  //
  // Draw move from/to rect.
  //

  if (null != movFrom) {
    var col = movFrom % BW, row = Math.floor(movFrom / BW);
    ctx2d.strokeStyle = 'red';
    var d = 4;
    ctx2d.strokeRect(offsetx + col * CW + d, offsety + row * CH + d, CW - 2 * d, CH - 2 * d);
  }

  if (null != movTo) {
    var col = movTo % BW, row = Math.floor(movTo / BW);
    ctx2d.strokeStyle = 'red';
    ctx2d.strokeRect(offsetx + col * CW, offsety + row * CH, CW, CH);
  }
}

function isRed(idx) {
  return 0 == (idx % 2);
}

var sNum1 = '一二三四五六七八九', sNum2 = '九八七六五四三二一';
var sType1 = '士象卒馬炮車將', sType2 = '士相兵馬炮車帥';
var sMov1 = '士象馬', sMov2 = '士相馬';

function isMove(s) {
  var m = s.split('');
  if (-1 != sType1.indexOf(m[0])) {
    return true;
  }
  if (-1 != sType2.indexOf(m[0])) {
    return true;
  }
  if (-1 != '前後'.indexOf(m[0])) {
    return true;
  }
  return false;
}

function movePiece(idx) {
  var m = movRec[idx].split('');        // Split a move, ex: ['炮','二','平','五'].
  var red = isRed(idx);

  //
  // Find the location of the piece to move.
  //

  var pType, pCol, pLoc, sType;
  if (-1 != '前後'.indexOf(m[0])) {
    sType = m[1];
    pType = 1 + (red ? 8 + sType2.indexOf(m[1]) : sType1.indexOf(m[1]));
    for (var c = 0; c < BW; c++) {
      var n = 0;
      for (var r = 0; r < BH; r++) {
        if (bd[c + r * BW] == pType) {
          n = n + 1;
        }
      }
      if (2 <= n) {
        pCol = c;
        break;
      }
    }

    if (('前' == m[0] && red) || ('後' == m[0] && !red)) {
      pLoc = pCol;
      for (var i = 0; i < BH; i++, pLoc = pLoc + BW) {
        if (bd[pLoc] == pType) {
          break;
        }
      }
    } else {
      pLoc = pCol + (BH - 1) * BW;
      for (var i = BH - 1; i > 0; i--, pLoc = pLoc - BW) {
        if (bd[pLoc] == pType) {
          break;
        }
      }
    }

  } else {
    sType = m[0];
    pType = 1 + (red ? 8 + sType2.indexOf(m[0]) : sType1.indexOf(m[0]));
    pCol = (red ? sNum2 : sNum1).indexOf(m[1]);
    pLoc = pCol;
    for (var i = 0; i < BH; i++, pLoc = pLoc + BW) {
      if (bd[pLoc] == pType) {
        break;
      }
    }
  }

  //
  // Move the piece.
  //

  var colDest = (red ? sNum2 : sNum1).indexOf(m[3]);

  movFrom = pLoc;
  if ('平' == m[2]) {
    bd[pLoc] = 0;
    movTo = pLoc - pCol + colDest;
    bd[movTo] = pType;
  } else if ('進' == m[2] || '退' == m[2]) {
    var sign = '進' == m[2] ? -1 : 1;
    if (!red) {
      sign = -sign;
    }
    var sp = (red ? sMov2 : sMov1).indexOf(sType); // Special move.
    if (-1 != sp) {
      var delta = [2, 4, 3];            // w + h.
      bd[pLoc] = 0;
      movTo = pLoc - pCol + colDest + sign * (delta[sp] - Math.abs(pCol - colDest)) * BW;
      bd[movTo] = pType;
    } else {
      bd[pLoc] = 0;
      movTo = pLoc + sign * (1 + sNum1.indexOf(m[3])) * BW;
      bd[movTo] = pType;
    }
  } else {
    return false;
  }

  return true;
}

function moveGame(c) {
  movCur = c;
  initGame();
  for (var i = 0; i < c; i++) {
    if (!movePiece(i)) {
      break;
    }
  }
  drawGame();

  //
  // Highlight current move.
  //

  if (selm) {
    selm.style.color = '';
    selm.style.backgroundColor = '';
  }

  if (selp) {
    var idx = mov1;
    for (var i = 1; i < selp.childNodes.length; i++) {
      var n = selp.childNodes[i];
      var s = n.innerText || n.textContent;
      if (!isMove(s.trim())) {
        continue;
      }
      idx += 1;
      if (idx == c) {
        n.style.color = 'white';
        n.style.backgroundColor = 'red';
        selm = n;
        break;
      }
    }
  }
}

function ptInRect(x, y, left, top, width, height) {
  if (left <= x && left + width > x && top <= y && top + height > y) {
    return true
  } else {
    return false
  }
}

function getOffset(e)
{
  if (e.offsetX) {
    return {x:e.offsetX, y:e.offsetY};
  }

  var el = e.target;
  var offset = {x:0, y:0};

  while (el.offsetParent) {
    offset.x += el.offsetLeft;
    offset.y += el.offsetTop;
    el = el.offsetParent;
  }

  offset.x = e.pageX - offset.x;
  offset.y = e.pageY - offset.y;

  return offset;
}

function onCanvasMouseDown(e) {

  var off = getOffset(e);
  var x = off.x, y = off.y;

  //
  // Prev move.
  //

  if (mov1 < movCur &&
      ptInRect(x, y, 0, offsety + 3.5 * CH, 2 * CW, 3 * CH)) {
    moveGame(movCur - 1);
  }

  //
  // Next move.
  //

  if (movCur < movRec.length &&
      ptInRect(x, y, offsetx + BW * CW - CW, offsety + 3.5 * CH, 2 * CW, 3 * CH)) {
    moveGame(movCur + 1);
  }

  e.preventDefault();
}

function isMoveRecords(s) {
  return /^\((本\)|(二|三|四|五)變接)/.test(s);
}

function removeNotMove() {
  for (var i = movRec.length - 1; 0 <= i; i--) {
    if (!isMove(movRec[i])) {
      movRec.splice(i, 1);
    }
  }
}

function getMoveRecords(s, p) {
  mov1 = 0;
  movRec = s.substring(s.indexOf(')') + 1, s.lastIndexOf('(')).trim().split(' ');

  while (true) {
    var tag = s.match(/\(([^)]+)\)/);
    if ('本' == tag[1]) {
      break;
    }

    var no = tag[1].split('')[0];

    while (true) {
      p = p.previousElementSibling;
      s = p.innerText || p.textContent;
      if (p instanceof HTMLParagraphElement && isMoveRecords(s)) {
        var v = s.match(/變([二|三|四|五]‧?)+/g);
        if (null == v) {
          continue;
        }
        var found = false;
        for (var i = 0; i < v.length; i++) {
          if (-1 != v[i].indexOf(no)) {
            var rec = s.substring(s.indexOf(')') + 1, s.indexOf(v[i])).trim().split(' ');
            movRec = rec.slice(0, rec.length - 1).concat(movRec);
            mov1 = mov1 + rec.length - 1;
            found = true;
            break;
          }
        }
        if (found) {
          break;
        }
      }
    }
  }

  removeNotMove();
}

function splitMovRec(p, n, m, etype) {
  for (var j = 0; j < m.length; j++) {
    var style = document.createElement(etype);
    style.innerHTML = ' ' + m[j] + ' ';
    p.insertBefore(style, n);
  }
  p.removeChild(n);
}

function transMovRec(p) {
  for (var i = p.childNodes.length - 1; 0 <= i; i--) {
    var n = p.childNodes[i];
    if (3 == n.nodeType) {              // Text.
      var s = n.innerText || n.textContent;
      var m = s.trim().split(' ');
      splitMovRec(p, n, m, 'span');
    } else if ('b' == n.tagName.toLowerCase()) {
      var s = n.innerText || n.textContent;
      var m = s.trim().split(' ');
      if (1 != m) {
        splitMovRec(p, n, m, 'b');
      }
    }
  }
}

document.onclick = function(e) {

  //
  // Only show game board when click on <p> of moves.
  //

  var p = null;
  if (e.target instanceof HTMLParagraphElement) {
    p = e.target;
  } else if (e.target.parentNode instanceof HTMLParagraphElement) {
    p = e.target.parentNode;
  } else {
    return;
  }

  //
  // Check is this a move records.
  //

  var s = p.innerText || p.textContent;
  if (!isMoveRecords(s)) {
    return;
  }

  //
  // Reset if click on the same game.
  //

  if (null != divBoard) {
    divBoard.parentNode.removeChild(divBoard);
    divBoard = null;
  }

  //
  // Create new game board.
  //

  divBoard = document.createElement('div');

  var c = document.createElement('canvas');
  c.setAttribute('width', SW);
  c.setAttribute('height', SH);
  c.onmousedown = onCanvasMouseDown;
  divBoard.appendChild(c);

  p.appendChild(divBoard);

  //
  // Get game move records.
  //

  getMoveRecords(s, p);

  if (selm) {
    selm.style.color = '';
    selm.style.backgroundColor = '';
  }
  selp = p;

  movFrom = movTo = null;

  //
  // Split and convert text and bold texts to elements.
  //

  transMovRec(p);

  //
  // Display game board.
  //

  ctx2d = c.getContext("2d");

  moveGame(mov1);
}