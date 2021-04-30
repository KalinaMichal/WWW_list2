"use strict";

//****************************
//  ladowanie obrazow(wiele-te male)
//****************************
const images = [
   {jpgF : "content/JPEG/1.jpg", pngF: "content/1.png"},
   {jpgF : "content/JPEG/2.jpg", pngF: "content/2.png"},
   {jpgF : "content/JPEG/3.jpg", pngF: "content/3.png"},
   {jpgF : "content/JPEG/4.jpg", pngF: "content/4.png"},
   {jpgF : "content/JPEG/5.jpg", pngF: "content/5.png"},
   {jpgF : "content/JPEG/6.jpg", pngF: "content/6.png"},
   {jpgF : "content/JPEG/7.jpg", pngF: "content/7.png"},
   {jpgF : "content/JPEG/8.jpg", pngF: "content/8.png"},
   {jpgF : "content/JPEG/9.jpg", pngF: "content/9.png"},
   {jpgF : "content/JPEG/10.jpg", pngF: "content/10.png"},
   {jpgF : "content/JPEG/11.jpg", pngF: "content/11.png"},
   {jpgF : "content/JPEG/12.jpg", pngF: "content/12.png"}
];

//****************************
//   ladowanie obrazu(1)
//****************************
function loadImage(source) {
  let image = new Image();
  image.src = source;
  let promise = new Promise((resolve, reject) => {
    image.addEventListener("error", err => reject(err));
    image.addEventListener("load", () => resolve(image));
  });
  return promise;
}

//*******************************
//      zmiana rozmiaru
//*******************************
function resizeCanvas(image, canvas) {
  canvas.height = 0.35 * window.innerWidth;
  canvas.width = 0.35 * window.innerWidth;
  if (image) {
    canvas.getContext("2d").drawImage(
       image, 0, 0,
       image.naturalWidth, image.naturalHeight,
       0, 0, canvas.height, canvas.width);
  }
}

//****************************
//       Listenery
//****************************
window.addEventListener("load", () => {
  const mixButton = document.getElementById("mix");
  const imageC = document.getElementById("image");
  const data = generateGallery(
    images, imageC,
    document.getElementById("gallery"),
    document.getElementById("canvas-container"));

  mixButton.addEventListener("click", event => {
    event.preventDefault();
    mixButton.enabled = false;
    mixPuzzle(
      Number(document.getElementById("iterations").value),
      data.game, 2000, () => {
        mixButton.enabled = false;
      });
  });

  //zmiana rozmiaru - gdy zmieniam rozm. okna w trakcie gry
  window.addEventListener("resize", () => {
  if (data.image) resizeCanvas(data.image,imageC);
    if (data.canvas) resizeCanvas(null, data.canvas);
    if (data.game) data.game.draw();
  });
});

//*******************************
//     generowanie galerii
//*******************************
function generateGallery(imgs, imgC, cont1, cont2) {
  let rtrData = {
    game: null,
    canvas: null,
    image: null
  };
 imgs.forEach(image => {
  let img = document.createElement("img");
  img.addEventListener("click", () => {
    let columns = Number(document.getElementById("columns").value);
    let rows = Number(document.getElementById("rows").value);
    loadImage(image.pngF).then((image) => {
        //tworzenie nowej gry
        let canvasTmp = document.createElement("canvas");
        resizeCanvas(image,imgC);
        while (cont2.firstChild) {cont2.removeChild(cont2.firstChild);}
        resizeCanvas(null, canvasTmp);
        cont2.append(canvasTmp);
        let gameTmp = new Puzzle(rows, columns, canvasTmp);
        new gameControls(gameTmp, canvasTmp);
        gameTmp.setWon(() => alert("You won!"));
        gameTmp.loadImage(image);
        gameTmp.draw();
      rtrData.game = gameTmp;
      rtrData.canvas = canvasTmp;
      rtrData.image = image;
      }).catch(err => {
        console.error(err);
        alert("Error");
      });
    });
    img.src = image.jpgF;
    cont1.append(img);
  });

  return rtrData;
}

//ponizej elementy ukladanki

//*****************
//    puzel
//*****************
class PuzzlePiece {
  constructor(image, width, height,xO, yO, id) {//contr
    this.image = image;
    this.width = width;
    this.height = height;
    this.xO = xO;
    this.yO = yO;
    this.id = id;
    this.hovered = false;
  }

  draw(x, y, height, width, canvElem) {
    if (this.hovered) {
      canvElem.save();
      canvElem.globalAlpha = 0.5;
    }
    canvElem.drawImage(
      this.image, this.xO, this.yO, this.width,
      this.height, x, y, height, width);
    if (this.hovered) {
      canvElem.restore();
    }
  }
}

//*****************************
//      puzel 'zerowy'
//*****************************
class RedPiece {
  constructor(id, color) {
    this.color = color;
    this.id = id;
  }

  draw(x, y, width, height, canvElem) {
    canvElem.fillStyle = this.color;
    canvElem.fillRect(x, y, width, height);
  }
}

//*****************
//    puzle
//*****************
export class Puzzle {
  //konstruktor
  constructor(rows = 4, columns = 4, canv) {
    this.pieces = [];
    this.won = null;
    this.isMixed = false;//czy zaczeto mieszac puzle
    this.nullRow = -1;
    this.nullCol = -1;

    this.rows = rows;
    this.columns = columns;
    this.canvas = canv;
  }

setWon(cb) {
  this.won = cb;
}

//***************************************************
//    czy moge zamienic z nullowym puzlem
//***************************************************
isAbleToSwapNull(row, column) {
  if (this.nullRow === row) {
    if (column > -1 && column < this.columns
     && Math.abs(column - this.nullCol) === 1) {
      return true;
    }
  } else if (row > -1 && row < this.rows
     && Math.abs(row - this.nullRow) === 1) {
    if (this.nullCol === column) {
      return true;
    }
  }
  return false;
}

//***************************************************
//    zamiana z nullowym puzzlem
//***************************************************
swapRed(row, columnTmp) {
  if (this.isAbleToSwapNull(row, columnTmp)) {
    this.pieces[row][columnTmp].hovered = false;
    [this.pieces[row][columnTmp], this.pieces[this.nullRow][this.nullCol]] =
      [this.pieces[this.nullRow][this.nullCol], this.pieces[row][columnTmp]];
    this.nullRow = row;
    this.nullCol = columnTmp;

    if (this.checkWon() && !this.isMixed) {if (this.won) this.won();}
    } else {console.log("impossible swap");}
  }

//***************************************************
//     ladowanie obrazka na poczatku
//***************************************************
loadImage(image) {
  let imgW = image.naturalWidth / this.columns;
  let imgH = image.naturalHeight / this.rows;

  for (let i = 0; this.rows > i; i++) {
    this.pieces.push([]);
    for (let j = 0; j < this.columns; j++) {
      let serial = i * this.columns + j;
      if (i==0 && j ==0) {//dla nullowego kafelka
        this.nullRow = i;
        this.nullCol = j;
        this.pieces[i].push(new RedPiece(serial, "#FF0000"));
      } else {//dla pozostalych
        this.pieces[i].push(new PuzzlePiece(
          image,
          imgW, imgH,
          imgW * j, imgH * i,
          serial
          ));
      }
    }
  }
}

//***********************************
//    sprawdz czy wygralem
//***********************************
checkWon() {
  let previousSerial = null;
  for (let row of this.pieces) {
    for (let piece of row) {
      if (piece.id < previousSerial) return false;
        previousSerial = piece.id;
      }
    }
    return true;
  }

  //*********************
  //    rysowanko
  //*********************
  draw(canvasElement = this.canvas) {
    let w = canvasElement.width / this.columns;
    let h = canvasElement.height / this.rows;
    let canvElem = canvasElement.getContext("2d");
    canvElem.clearRect(
     0, 0,
     canvasElement.width, canvasElement.height);

    this.pieces.forEach((row, r) => {
      row.forEach((piece, c) => {
        piece.draw(
          w * c, h * r,
          w, h,canvElem);
      });
    })
}

//*********************
//   rerysowanko
//*********************
redrawPiece(row, column, canvasElement = this.canvas) {
  let w = canvasElement.width / this.columns;
  let h = canvasElement.height / this.rows;
  let canvElem = canvasElement.getContext("2d");

  canvElem.clearRect(
    w * column, h * row,
    w, h);

  this.pieces[row][column].draw(
   w * column, h * row,
   w, h,canvElem);
}
}


//***********************************
//    mieszanie puzli
//***********************************
export function mixPuzzle(times, puzzle, time = 2000, cb) {
  puzzle.isMixed = true;
  let localNullCol = puzzle.nullCol;
  let localNullRow = puzzle.nullRow;
  let i = times;

  while (i-- > 0) {
    let j = i;
    let col;
    let row;
    if (Math.random() > 0.5) {
      col = localNullCol;
      if (localNullRow === puzzle.rows - 1) {row = localNullRow - 1;}
      else if (localNullRow === 0) {row = 1;}
      else {row = localNullRow + (Math.random() > 0.5 ? -1 : 1);}
    } else {
      row = localNullRow;
      if (localNullCol === puzzle.columns - 1) {col = localNullCol - 1;}
      else if (localNullCol === 0) {col = 1;}
      else {col = localNullCol + (Math.random() > 0.5 ? -1 : 1);}
    }
    setTimeout(() => {
      puzzle.swapRed(row, col);
      puzzle.draw();
      if (j === 0 && cb) {
        puzzle.isMixed = false;
        cb();
      }
    }, time / times * (times - i));
    localNullCol = col;
    localNullRow = row;
  }
  puzzle.draw();
}

//***********************************
//    sterowanie puzlami
//***********************************
export class gameControls {
  constructor(puzel, objt) {
    this.puzzle = puzel;
    objt.addEventListener("click", event => {
      let col = Math.floor(event.layerX / (objt.width / puzel.columns));
      let row = Math.floor(event.layerY / (objt.height / puzel.rows));
      try {
        this.puzzle.swapRed(row, col);
        this.puzzle.draw();
      } catch (e) {
        console.log("Thats impossible. Puzzle swap exception!");
      }
    });
    objt.addEventListener("pointermove", event => {
      let col = Math.floor(event.layerX / (objt.width / puzel.columns));
      let row = Math.floor(event.layerY / (objt.height / puzel.rows));

      this.puzzle.pieces.forEach(
       (piecesRow, r) => piecesRow.forEach(
       (piece, c) => {
        if (piece.hovered !== (puzel.isAbleToSwapNull(r, c) &&
          c === col && r === row)) {
          if(r === row && c === col){piece.hovered=true;}
          else{piece.hovered=false;}
          this.puzzle.redrawPiece(r, c);
        }
      }));
    });
  }
}

