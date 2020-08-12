/// <reference path="./polyfill.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Piece = /** @class */ (function () {
    function Piece() {
    }
    Piece.prototype.getColour = function () {
        return this.colour;
    };
    Piece.prototype.getName = function () {
        return this.name;
    };
    Piece.prototype.getCells = function () {
        return this.cells;
    };
    // Rotate the piece.
    // The row factors are to do the rotation in the correct direction.
    Piece.prototype.rotate = function (rowFactor, colFactor) {
        // First get the origin of rotation
        var origin = this.cells[1];
        // Copy the cells so it is easy to revert if needed
        var tmpCells = JSON.parse(JSON.stringify(this.cells));
        for (var i in this.cells) {
            var cell = this.cells[i];
            // Find how far this cell is from the origin
            var xdiff = cell.col - origin.col;
            var ydiff = cell.row - origin.row;
            // Part of rotation is to swap the x and y coordinates so do that.
            // The column also needs to be negated to complete the rotation
            var newRow = rowFactor * xdiff;
            var newCol = colFactor * ydiff;
            newRow += origin.row;
            newCol += origin.col;
            // If there is a collision, then we can't rotate
            if (this.collisionDetect(newRow, newCol)) {
                return false;
            }
            tmpCells[i].row = newRow;
            tmpCells[i].col = newCol;
        }
        this.erase();
        this.cells = tmpCells;
        this.draw();
        return true;
    };
    Piece.prototype.rotate90 = function () {
        return this.rotate(-1, 1);
    };
    Piece.prototype.rotate270 = function () {
        return this.rotate(1, -1);
    };
    Piece.prototype.erase = function () {
        for (var i in this.cells) {
            var cell = this.cells[i];
            var selector = '.r' + cell.row + ' > .c' + cell.col;
            var element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                element.style.backgroundColor = '';
            }
        }
        return true;
    };
    Piece.prototype.drawHelper = function (selectorPrefix) {
        for (var i in this.cells) {
            var cell = this.cells[i];
            var selector = selectorPrefix + ' .r' + cell.row + ' > .c' + cell.col;
            var element = document.querySelector(selector);
            if (!(element instanceof HTMLElement)) {
                continue;
            }
            element.style.backgroundColor = this.colour;
        }
        return true;
    };
    Piece.prototype.previewDraw = function () {
        return this.drawHelper('.preview .board');
    };
    Piece.prototype.draw = function () {
        return this.drawHelper('.mainBoard.board');
    };
    // true => Collision Detected
    // false => No Collision Detected
    Piece.prototype.collisionDetect = function (row, col) {
        // The row and column have to be within bounds
        if (row < 1 || col < 1 || col > 10) {
            return true;
        }
        var selector = '.r' + row + ' > .c' + col;
        var element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) {
            // If board cell doesn't exist, then no collision. This could happen
            // if you rotate at the top of the board
            return false;
        }
        this.erase();
        var colour = element.style.backgroundColor;
        this.draw();
        // Square is not empty, so it is occupied.
        if (colour !== '') {
            return true;
        }
        return false;
    };
    Piece.prototype.moveLeft = function () {
        // Make sure we have room to move left
        for (var i in this.cells) {
            var cell = this.cells[i];
            if (this.collisionDetect(cell.row, cell.col - 1)) {
                return false;
            }
        }
        this.erase();
        this.cells[0].col--;
        this.cells[1].col--;
        this.cells[2].col--;
        this.cells[3].col--;
        return this.draw();
    };
    Piece.prototype.moveRight = function () {
        // Make sure we have room to move right
        for (var i in this.cells) {
            var cell = this.cells[i];
            if (this.collisionDetect(cell.row, cell.col + 1)) {
                return false;
            }
        }
        this.erase();
        this.cells[0].col++;
        this.cells[1].col++;
        this.cells[2].col++;
        this.cells[3].col++;
        return this.draw();
    };
    Piece.prototype.moveDown = function () {
        // Make sure we have room to move down
        for (var i in this.cells) {
            var cell = this.cells[i];
            if (this.collisionDetect(cell.row - 1, cell.col)) {
                return false;
            }
        }
        this.erase();
        this.cells[0].row--;
        this.cells[1].row--;
        this.cells[2].row--;
        this.cells[3].row--;
        return this.draw();
    };
    return Piece;
}());
var LongBar = /** @class */ (function (_super) {
    __extends(LongBar, _super);
    function LongBar() {
        var _this = _super.call(this) || this;
        _this.orientation = 'horziontal';
        _this.colour = 'red';
        _this.cells = [
            { 'row': 20, 'col': 4 },
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 20, 'col': 7 },
        ];
        _this.name = "Long Bar";
        return _this;
    }
    // Rotate CCW just does the exact same thing that rotate90 does
    LongBar.prototype.rotate270 = function () {
        return this.rotate90();
    };
    LongBar.prototype.rotate90 = function () {
        // The axis of rotation here is really weird... It rotates about the
        // 3rd square Xs if rotated clockwise:
        //
        //  *** *** XXX ***
        //  *** *** XXX ***
        //
        // But not for counter clockwise rotation.
        //
        // Similarly, if this piece is in its vertical orientation, that is only
        // the axis of rotation if you rotate it counter clockwise
        //
        // So... I guess I am going to have to keep track of its orientation to
        // make this work...
        // First get the origin of rotation
        var origin = this.cells[2];
        // Copy the cells so it is easy to revert if needed
        var tmpCells = JSON.parse(JSON.stringify(this.cells));
        for (var i in this.cells) {
            var cell = this.cells[i];
            // Find how far this cell is from the origin
            var xdiff = cell.col - origin.col;
            var ydiff = cell.row - origin.row;
            // Part of rotation is to swap the x and y coordinates so do that.
            var newRow = xdiff;
            var newCol = ydiff;
            // The other part of rotation is to negate one of the coordinate
            // values. Which one we do depends on what way we rotate, and
            // because the axis of rotation we have chosen is specific to what
            // orientation we are in, we need both...
            // If we are currently horizontal, then we need to rotate CW
            // If we are currently vertical, then we need to rotate CCW
            newRow = (this.orientation === 'horizontal') ? (-1 * newRow) : newRow;
            newCol = (this.orientation === 'vertical') ? (-1 * newCol) : newCol;
            newRow += origin.row;
            newCol += origin.col;
            // If there is a collision, then we can't rotate
            if (this.collisionDetect(newRow, newCol)) {
                return false;
            }
            tmpCells[i].row = newRow;
            tmpCells[i].col = newCol;
        }
        this.erase();
        this.cells = tmpCells;
        this.draw();
        this.orientation = (this.orientation === 'horizontal') ? 'vertical' : 'horizontal';
        return true;
    };
    return LongBar;
}(Piece));
var Square = /** @class */ (function (_super) {
    __extends(Square, _super);
    function Square() {
        var _this = _super.call(this) || this;
        _this.colour = 'royalblue';
        _this.cells = [
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 19, 'col': 5 },
            { 'row': 19, 'col': 6 },
        ];
        _this.name = "Square";
        return _this;
    }
    // Square doesn't rotate
    Square.prototype.rotate270 = function () {
        return true;
    };
    Square.prototype.rotate90 = function () {
        return true;
    };
    return Square;
}(Piece));
var SJPieces = /** @class */ (function (_super) {
    __extends(SJPieces, _super);
    function SJPieces() {
        var _this = _super.call(this) || this;
        _this.orientation = 'horizontal';
        return _this;
    }
    SJPieces.prototype.rotate270 = function () {
        // CCW rotation happens to be exactly the same as a CW rotation
        return this.rotate90();
    };
    SJPieces.prototype.rotate90 = function () {
        // The axis of rotation here is really weird... It rotates about the
        // block marked by Xs if rotated counter clockwise:
        //
        //  *** XXX
        //  *** XXX
        //      *** ***
        //      *** ***
        //
        // But not for clockwise rotation.
        //
        // Similarly, if this piece is in its vertical orientation, that is only
        // the axis of rotation if you rotate it clockwise
        //
        // So... I guess I am going to have to keep track of its orientation to
        // make this work...
        // First get the origin of rotation
        var origin = this.cells[1];
        // Copy the cells so it is easy to revert if needed
        var tmpCells = JSON.parse(JSON.stringify(this.cells));
        for (var i in this.cells) {
            var cell = this.cells[i];
            // Find how far this cell is from the origin
            var xdiff = cell.col - origin.col;
            var ydiff = cell.row - origin.row;
            // Part of rotation is to swap the x and y coordinates so do that.
            var newRow = xdiff;
            var newCol = ydiff;
            // The other part of rotation is to negate one of the coordinate
            // values. Which one we do depends on what way we rotate, and
            // because the axis of rotation we have chosen is specific to what
            // orientation we are in, we need both...
            // If we are currently horizontal, then we need to rotate CCW
            // If we are currently vertical, then we need to rotate CW
            newRow = (this.orientation === 'vertical') ? (-1 * newRow) : newRow;
            newCol = (this.orientation === 'horizontal') ? (-1 * newCol) : newCol;
            newRow += origin.row;
            newCol += origin.col;
            // If there is a collision, then we can't rotate
            if (this.collisionDetect(newRow, newCol)) {
                return false;
            }
            tmpCells[i].row = newRow;
            tmpCells[i].col = newCol;
        }
        this.erase();
        this.cells = tmpCells;
        this.draw();
        this.orientation = (this.orientation === 'horizontal') ? 'vertical' : 'horizontal';
        return true;
    };
    return SJPieces;
}(Piece));
var SPiece = /** @class */ (function (_super) {
    __extends(SPiece, _super);
    function SPiece() {
        var _this = _super.call(this) || this;
        _this.colour = 'limegreen';
        _this.cells = [
            { 'row': 20, 'col': 7 },
            { 'row': 20, 'col': 6 },
            // horizontal for CCW, and CW for vertical
            { 'row': 19, 'col': 6 },
            { 'row': 19, 'col': 5 },
        ];
        _this.name = "S Piece";
        return _this;
    }
    return SPiece;
}(SJPieces));
var ZPiece = /** @class */ (function (_super) {
    __extends(ZPiece, _super);
    function ZPiece() {
        var _this = _super.call(this) || this;
        _this.colour = 'palevioletred';
        _this.cells = [
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            // horizontal for CCW, and CW for vertical
            { 'row': 19, 'col': 6 },
            { 'row': 19, 'col': 7 },
        ];
        _this.name = "Z Piece";
        return _this;
    }
    return ZPiece;
}(SJPieces));
var LPiece = /** @class */ (function (_super) {
    __extends(LPiece, _super);
    function LPiece() {
        var _this = _super.call(this) || this;
        _this.colour = 'brown';
        _this.cells = [
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 20, 'col': 7 },
            { 'row': 19, 'col': 5 },
        ];
        _this.name = "L Piece";
        return _this;
    }
    return LPiece;
}(Piece));
var JPiece = /** @class */ (function (_super) {
    __extends(JPiece, _super);
    function JPiece() {
        var _this = _super.call(this) || this;
        _this.colour = 'darkorange';
        _this.cells = [
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 20, 'col': 7 },
            { 'row': 19, 'col': 7 },
        ];
        _this.name = "J Piece";
        return _this;
    }
    return JPiece;
}(Piece));
var TPiece = /** @class */ (function (_super) {
    __extends(TPiece, _super);
    function TPiece() {
        var _this = _super.call(this) || this;
        _this.colour = 'darkturquoise';
        _this.cells = [
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 20, 'col': 7 },
            { 'row': 19, 'col': 6 },
        ];
        _this.name = "T Piece";
        return _this;
    }
    return TPiece;
}(Piece));
var Timer = /** @class */ (function () {
    function Timer(callback, delay) {
        this.remaining = delay;
        this.callback = callback;
        this.resume();
    }
    Timer.prototype.pause = function () {
        window.clearTimeout(this.timerId);
        this.remaining -= Date.now() - this.start;
    };
    ;
    Timer.prototype.resume = function () {
        this.start = Date.now();
        window.clearTimeout(this.timerId);
        this.timerId = window.setTimeout(this.callback, this.remaining);
    };
    ;
    return Timer;
}());
;
var Game = /** @class */ (function () {
    function Game() {
    }
    Game.start = function (startLevel) {
        this.startLevel = startLevel;
        this.level = startLevel;
        this.updateLevel();
        this.generatePiece();
        this.advance();
        this.togglePause();
    };
    Game.addPointsForLinesCleared = function (linesScored) {
        if (linesScored < 1 || linesScored > 4) {
            throw new Error("Tried to update the score with " + linesScored + " scored lines.");
        }
        var basePoints = {
            1: 40,
            2: 100,
            3: 300,
            4: 1200
        };
        this.score += (this.level + 1) * basePoints[linesScored];
    };
    Game.updateScore = function () {
        var scoreElem = document.getElementById('score');
        if (!(scoreElem instanceof HTMLElement)) {
            throw new Error("Could not find score element");
        }
        scoreElem.textContent = this.score.toString();
    };
    Game.removeCompleteLines = function (piecePosition) {
        // Something to keep in mind... All rows that are removed after a block
        // placement will be adjacent to each other. So if you find a row that
        // has been removed, then the next one hasn't, you can stop looking.
        // Also, the only rows you need to check are the ones affected by t he
        // final position of the last placed piece... So I will get those rows
        // here
        var rowsToCheck = unique(piecePosition.map(function (el) { return (el.row); }));
        var completedRows = [];
        var isRowComplete = false;
        for (var i = 0; i < rowsToCheck.length; i++) {
            var row = document.querySelector('.mainBoard.board .row.r' + rowsToCheck[i]);
            if (!(row instanceof HTMLElement)) {
                throw new Error("Couldn't find Row " + rowsToCheck[i] + " (idx " + i + ")");
            }
            var numFilledCells = Array.from(row.children).filter(function (cell, j) {
                if (!(cell instanceof HTMLElement)) {
                    throw new Error("Couldn't find column index " + j + " in row idx " + i);
                }
                return cell.style.backgroundColor !== '';
            }).length;
            if (numFilledCells === 10) {
                completedRows.push(i);
                row.remove();
            }
        }
        if (completedRows.length > 0) {
            this.addPointsForLinesCleared(completedRows.length);
            this.updateLines(completedRows.length);
            this.updateLevel();
        }
        // alert('updated score, lines, and level')
        // We have now removed all complete lines now. Insert the number of
        // removed lines to the top now. And add the c1 to c10 classes to each
        // column
        for (var i = 0; i < completedRows.length; i++) {
            var rowHTML = "\n                <div class='row'>\n                    <div class='cell c1'></div>\n                    <div class='cell c2'></div>\n                    <div class='cell c3'></div>\n                    <div class='cell c4'></div>\n                    <div class='cell c5'></div>\n                    <div class='cell c6'></div>\n                    <div class='cell c7'></div>\n                    <div class='cell c8'></div>\n                    <div class='cell c9'></div>\n                    <div class='cell c10'></div>\n                </div>\n            ";
            var board = document.querySelector('.mainBoard.board');
            if (!(board instanceof HTMLElement)) {
                throw new Error("Couldn't find Board");
            }
            // alert('before insertbefore');
            // TODO: iOS fails on this line... Whether it is the call to
            // insertBefore, or something inside htmlToElement, I don't know...
            // It gets past all the lines in htmlToElement except for the return
            // statement
            var newRow = board.insertBefore(htmlToElement(rowHTML), board.children[0]);
            // alert('done inserting')
        }
        // alert('Inserted rows')
        // Now go back through all the rows and update the r1 to r20 classes.
        var count = 1;
        var rows = document.querySelectorAll('.mainBoard.board .row');
        for (var i = rows.length - 1; i >= 0; i--) {
            var row = rows[i];
            if (!(row instanceof HTMLElement)) {
                throw new Error("Couldn't find Row index " + i);
            }
            row.classList.add('r' + count);
            count++;
        }
    };
    Game.advance = function (instantAdvance) {
        var _this = this;
        if (instantAdvance === void 0) { instantAdvance = false; }
        var callback = function () {
            if (_this.activePiece.moveDown()) {
                _this.advance();
            }
            else {
                var finalPosition = _this.activePiece.getCells();
                _this.removeCompleteLines(finalPosition);
                // If couldn't generate piece (probably because game was lost),
                // then don't continue
                if (_this.generatePiece()) {
                    Game.advance();
                }
            }
            _this.updateScore();
        };
        // If instant advance, then run the advance steps instantly instead of
        // after a delay
        if (instantAdvance) {
            callback();
            return;
        }
        this.timer = new Timer(callback, this.getSpeed());
    };
    // Erase the preview board
    Game.previewErase = function () {
        var previewBoard = document.querySelector('.preview .board');
        var rows = previewBoard.children;
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var columns = row.children;
            for (var j = 0; j < columns.length; j++) {
                var column = columns[j];
                if (!(column instanceof HTMLElement)) {
                    throw new Error("Couldn't find column");
                }
                column.style.backgroundColor = '';
            }
        }
    };
    Game.isGameLost = function () {
        var cells = this.activePiece.getCells();
        for (var i in cells) {
            var cell = cells[i];
            var selector = '.r' + cell.row + ' > .c' + cell.col;
            var element = document.querySelector(selector);
            if (!(element instanceof HTMLElement)) {
                return true;
            }
            // Square is not empty, so the piece can not be played. Player loses
            if (element.style.backgroundColor !== '') {
                Game.isActive = false;
                return true;
            }
        }
        return false;
    };
    Game.generatePiece = function () {
        // If we don't have a next piece or the next piece is invalid, generate
        // a random index for the current piece. Otherwise, we will use the
        // nextPieceIdx
        var idx = this.nextPieceIdx;
        if (idx < 0 || idx >= this.Pieces.length) {
            var idx = Math.floor(Math.random() * this.Pieces.length);
        }
        // If the new active piece will be a longbar, then reset the drought to
        // 0, otherwise add 1.
        // TODO: Add an ENUM for the idx so it is easier to read
        this.longbarDrought = (idx === 0) ? 0 : this.longbarDrought + 1;
        if (this.longbarDrought > this.longestLongbarDrought) {
            this.longestLongbarDrought = this.longbarDrought;
        }
        // Determine what the next piece will be
        this.previewErase();
        this.nextPieceIdx = Math.floor(Math.random() * this.Pieces.length);
        this.nextPiece = this.Pieces[this.nextPieceIdx]();
        this.nextPiece.previewDraw();
        document.querySelector('.info .longbar-drought h1').textContent = this.longbarDrought.toString();
        document.querySelector('.info .longest-longbar-drought h1').textContent = this.longestLongbarDrought.toString();
        // Create the new piece
        this.activePiece = this.Pieces[idx]();
        if (this.isGameLost()) {
            // TODO: Show a message and a way to reset the game
            alert("You Lost");
            return false;
        }
        this.activePiece.draw();
        return true;
    };
    Game.moveLeft = function () {
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.activePiece.moveLeft();
    };
    Game.moveRight = function () {
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.activePiece.moveRight();
    };
    Game.moveDown = function () {
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        if (!this.activePiece.moveDown()) {
            this.timer.pause();
            this.generatePiece();
            Game.advance();
        }
    };
    Game.drop = function () {
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.timer.pause();
        // While we drop rows we need to add to a counter for scoring points
        var points = 0;
        while (this.activePiece.moveDown()) {
            points++;
        }
        // Now the fun begins... We should just be able to add the points to our
        // score, but to be consistent with NES Tetris, I have to program in a
        // scoring bug that exists in the original game.
        // In the game, you get 1 point per square dropped, but up to a maximum
        // of 15, and after that the score resets back to 10 and continues. So
        // if you drop a piece 17 rows, you get 11 points for example.
        if (points > 15) {
            points = (points % 16) + 10;
        }
        Game.score += points;
        // True is mean to instantly run the advance instead of waiting for a
        // delay. Dropping should instantly advance to the next piece
        this.advance(true);
    };
    Game.rotateCCW = function () {
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.activePiece.rotate270();
    };
    Game.rotateCW = function () {
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.activePiece.rotate90();
    };
    Game.togglePause = function () {
        if (!Game.isActive) {
            return;
        }
        this.isPaused = this.isPaused ? false : true;
        var mainArea = document.getElementsByClassName('mainArea')[0];
        if (!(mainArea instanceof HTMLElement)) {
            throw new Error("Couldn't find mainArea");
        }
        var pauseBanner = document.getElementsByClassName('pause_banner')[0];
        if (!(pauseBanner instanceof HTMLElement)) {
            throw new Error("Couldn't find PauseBanner");
        }
        if (this.isPaused) {
            this.timer.pause();
            mainArea.classList.add('paused');
            pauseBanner.classList.remove('hidden');
        }
        else {
            mainArea.classList.remove('paused');
            pauseBanner.classList.add('hidden');
            this.timer.resume();
        }
    };
    Game.updateLines = function (completedLines) {
        var linesElem = document.getElementById('lines');
        if (!(linesElem instanceof HTMLElement)) {
            throw new Error("Could not find level element");
        }
        this.lines += completedLines;
        linesElem.textContent = this.lines.toString();
    };
    Game.updateLevel = function () {
        var levelElem = document.getElementById('level');
        if (!(levelElem instanceof HTMLElement)) {
            throw new Error("Could not find level element");
        }
        if (this.lines >= this.getLineTarget()) {
            this.level++;
        }
        levelElem.textContent = this.level.toString();
    };
    Game.getSpeed = function () {
        if (this.level <= 8) {
            // Per NES Tetris, the speed of level 0 is 48 frames per grid. This
            // calculation converts that to milliseconds given that NES tetris ran
            // at 60 FPS.
            // Every level higher than 0 up to level 8 reduces the frames per grid
            // by 5.
            return Math.floor((48 - (this.level * 5)) / 60 * 1000);
        }
        // Starting at frames per grid
        var speed = 0;
        switch (this.level) {
            case 9:
                speed++;
            case 10:
            case 11:
            case 12:
                speed++;
            case 13:
            case 14:
            case 15:
                speed++;
            case 16:
            case 17:
            case 18:
                speed++;
            default:
                speed++;
        }
        // Could have put this into the switch statement, but that would have
        // been a lot of lines and I couldn't be bothered.
        if (this.level >= 19 && this.level <= 28) {
            speed++;
        }
        return speed / 60 * 1000;
    };
    Game.getLineTarget = function () {
        // If this is the starting level, this is apparently the calculation to
        // determine how many lines you need to advance to your second level.
        var lineTarget = Math.min((this.startLevel * 10 + 10), Math.max(100, (this.startLevel * 10 - 50)));
        // This adds on 10 extra lines for every level past your starting level
        // you are
        lineTarget += (this.level - this.startLevel) * 10;
        return lineTarget;
    };
    Game.Pieces = [
        function () { return new LongBar(); },
        function () { return new Square(); },
        function () { return new SPiece(); },
        function () { return new ZPiece(); },
        function () { return new LPiece(); },
        function () { return new JPiece(); },
        function () { return new TPiece(); },
    ];
    Game.lines = 0;
    Game.nextPieceIdx = -1;
    Game.longbarDrought = 0;
    Game.longestLongbarDrought = 0;
    Game.score = 0;
    Game.isPaused = false;
    Game.isActive = true;
    return Game;
}());
function setupUserKeys() {
    document.onkeydown = keyDown;
    // Keyup event is used to help determine if the key is being held down. The
    // only keys I really care about for this are the left and right arrows, and
    // the down arrow
    document.onkeyup = keyUp;
    setupMobileTouchSupport();
    // Keep track of what keys are current down
    // This maps the keycode to true so it is easy to lookup
    var pressedKey = null;
    var dasTimeout;
    var arrInterval;
    // NES Tetris has a DAS delay of 16 frames and an ARR delay of 6 frames. At
    // 60 FPS, that is 267ms and 100ms respectively
    function startDAS(func, dasTime, arrTime) {
        if (dasTime === void 0) { dasTime = 267; }
        if (arrTime === void 0) { arrTime = 100; }
        // Move immediately after pressing the button
        func();
        // Wait the DAS delay before moving again
        dasTimeout = setTimeout(function () {
            func();
            // Once DAS is up, move at the ARR speed after that until released
            arrInterval = setInterval(func, arrTime);
        }, dasTime);
    }
    function keyUp(e) {
        // If the released key is not saved as the pressed key, then ignore
        if (e.keyCode !== pressedKey) {
            return;
        }
        // Reset the pressed key
        pressedKey = null;
        // Clear the timers so that they keys aren't pressed again
        clearTimeout(dasTimeout);
        clearInterval(arrInterval);
    }
    function keyDown(e) {
        e = e || window.event;
        // Enter Key
        if (e.keyCode == '13') {
            Game.togglePause();
            return;
            // Z key
        }
        else if (e.keyCode == '90') {
            Game.rotateCCW();
            // X Key
        }
        else if (e.keyCode == '88') {
            Game.rotateCW();
            // Space Bar
        }
        else if (e.keyCode == '32') {
            Game.drop();
            // These keys will not have any effect in the default manner if they are
            // held down. So if the key is still down, ignore it
        }
        else if (pressedKey === null) {
            // Mark this key as being down now
            pressedKey = e.keyCode;
            // down arrow
            if (e.keyCode == '40') {
                // Moving down the piece has no DAS and moves quite fast, so
                // just make it faster and consistent
                startDAS(function () { Game.moveDown(); }, 50, 50);
                // left arrow
            }
            else if (e.keyCode == '37') {
                startDAS(function () { Game.moveLeft(); });
                // right arrow
            }
            else if (e.keyCode == '39') {
                startDAS(function () { Game.moveRight(); });
            }
        }
    }
}
function setupMobileTouchSupport() {
    console.log('hello');
    var startX;
    var startY;
    var xDist;
    var yDist;
    // required min distance travelled to be considered swipe
    var distanceThreshold = 50;
    // Screen must be touched for 50ms to be registered, otherwise it is
    // ignored
    var requiredTime = 50;
    var maxTime = 1000;
    var elapsedTime;
    var startTime = 0;
    var cancelTouchEnd = false;
    var board = document.querySelector('.mainArea');
    if (!(board instanceof HTMLElement)) {
        throw new Error("Couldn't find Board");
    }
    board.addEventListener('touchstart', function (e) {
        // Get the touched object
        var touchobj = e.changedTouches[0];
        cancelTouchEnd = false;
        // Distance is set to 0
        xDist = 0;
        yDist = 0;
        // Find the starting point of the touches
        startX = touchobj.pageX;
        startY = touchobj.pageY;
        // record time when finger first makes contact with surface
        startTime = new Date().getTime();
        e.preventDefault();
    }, false);
    board.addEventListener('touchmove', function (e) {
        // prevent scrolling when inside DIV
        e.preventDefault();
        // Get the touched object
        var touchobj = e.changedTouches[0];
        // get total dist travelled by finger while in contact with surface
        xDist = touchobj.pageX - startX;
        yDist = touchobj.pageY - startY;
        if (Math.abs(xDist) < distanceThreshold && Math.abs(yDist) < distanceThreshold) {
            return;
        }
        else if (Math.abs(xDist) > Math.abs(yDist)) {
            startX = touchobj.pageX;
            startY = touchobj.pageY;
            cancelTouchEnd = true;
            xDist < 0 ? Game.moveLeft() : Game.moveRight();
        }
    }, false);
    board.addEventListener('touchend', function (e) {
        e.preventDefault();
        if (cancelTouchEnd) {
            return;
        }
        // Get the touched object
        var touchobj = e.changedTouches[0];
        // get total dist travelled by finger while in contact with surface
        xDist = touchobj.pageX - startX;
        yDist = touchobj.pageY - startY;
        // get time elapsed
        elapsedTime = new Date().getTime() - startTime;
        if (elapsedTime < requiredTime || elapsedTime > maxTime) {
            e.preventDefault();
            return;
        }
        if (Math.abs(xDist) < distanceThreshold && Math.abs(yDist) < distanceThreshold) {
            // Screen tap
            if (elapsedTime > 300) {
                // msg = "Screen Tap and Hold";
            }
            else {
                Game.rotateCW();
            }
        }
        else if (Math.abs(xDist) > Math.abs(yDist)) {
            xDist < 0 ? Game.moveLeft() : Game.moveRight();
        }
        else {
            yDist < 0 ? Game.togglePause() : Game.drop();
        }
    }, false);
}
function htmlToElement(html) {
    // alert('start htmltoelement')
    var template = document.createElement('template');
    // alert('created element')
    // Never return a text node of whitespace as the result
    html = html.trim();
    // alert('trimmed')
    template.innerHTML = html;
    // alert('set html')
    return template.content.firstChild;
}
function unique(list) {
    return list.filter(function (val, idx, self) { return self.indexOf(val) === idx; });
}
window.onload = function () {
    // alert('HELLO 1');
    addPolyFill();
    var init = {
        'lvl': '-1',
        'seed': ''
    };
    // Get arguments from URL. We expect a level and seed for the RNG
    var GET_ARGS = location.search.substr(1).split('&').reduce(function (acc, val) {
        var _a = val.split('='), key = _a[0], value = _a[1];
        if (value === undefined) {
            return acc;
        }
        acc[key] = value;
        return acc;
    }, init);
    var level = parseInt(GET_ARGS.lvl, 10);
    if (isNaN(level)) {
        level = 0;
    }
    else if (level < 0) {
        // This means that no level was specified. Ask the User for a starting
        // level
        level = parseInt(prompt("Choose a Starting Level (0 through 19):"), 10);
        while (isNaN(level) || level < 0 || level > 19) {
            level = parseInt(prompt("You must enter a level between 0 and 19"), 10);
        }
    }
    var seed = GET_ARGS.seed;
    if (seed === '') {
        // If no seed, then generate one
        seed = (Math.random() * 100000000000000000).toString();
    }
    // XXX: Ignore the typescript error for this. The seedrandom.min.js adds
    // this and I can't get the TS type definitions to work.
    Math.seedrandom(seed);
    window.history.replaceState(null, '', '/tetris?lvl=' + level + '&seed=' + seed);
    if (!Array.from) {
        alert('Array.from is not present. The polyfill did not work');
    }
    setupUserKeys();
    Game.start(level);
};
