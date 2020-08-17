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
// TODO:
// - Some sort of animation for clearing lines so it isn't so abrupt
// - Change colour of placed pieces to a Gray or something?
// - Show statistics:
//   - The count of each piece that you have seen
// - Add instructions somewhere
// - Ability to restart after losing
// - Save highscores and show the high scores for a particular game sequence and
//   start level
// - The game doesn't render on old mobile devices. Fix the JS and CSS to be
//   compatible with older versions of mobile devices.
// The keys of this object are the outputs of event.key and event.keyCodes, so
// that I can use either of them since event.keyCodes is being deprecated
var KEY_CODES = {
    // 13 is event.keyCode
    // Enter is event.key
    // ENTER is a common string that both map to so that I can easily use both
    // depending on what the browser supports
    '13': 'ENTER',
    'Enter': 'ENTER',
    '32': 'SPACE',
    ' ': 'SPACE',
    '37': 'LEFT',
    'ArrowLeft': 'LEFT',
    '39': 'RIGHT',
    'ArrowRight': 'RIGHT',
    '40': 'DOWN',
    'ArrowDown': 'DOWN',
    '88': 'X',
    'x': 'X',
    '90': 'Z',
    'z': 'Z'
};
// }}}
// Enums// {{{
// Colours that are allowed to be used for cells
var CellColours;
(function (CellColours) {
    CellColours["NO_COLOUR"] = "";
    CellColours["RED"] = "red";
    CellColours["BLUE"] = "royalblue";
    CellColours["GREEN"] = "limegreen";
    CellColours["PINK"] = "palevioletred";
    CellColours["BROWN"] = "brown";
    CellColours["ORANGE"] = "darkorange";
    CellColours["TURQUOISE"] = "darkturquoise";
})(CellColours || (CellColours = {}));
// Only keep the unique elements of an array
Array.prototype.unique = function () {
    return this.filter(function (val, idx, self) { return self.indexOf(val) === idx; });
};
// Get the keycode that is pressed, and return the index of the correct enum
Event.prototype.getKeyCode = function () {
    // If the new .key is available use that
    var key = null;
    if (this.key !== undefined) {
        key = this.key;
    }
    else if (this.keyCode !== undefined) {
        key = this.keyCode;
    }
    else {
        throw new Error("Browser doesn't support event.key, or event.keyCode");
    }
    return KEY_CODES[key];
};
// }}}
// }}}
// Abstract Piece Class// {{{
// This class is contains everything common to all types of pieces
var Piece = /** @class */ (function () {
    function Piece() {
    }
    // Retrieve the colour of the piece
    Piece.prototype.getColour = function () {
        return this.colour;
    };
    Piece.prototype.setColour = function (colour) {
        this.colour = colour;
        return true;
    };
    // Creates a copy (not a reference) of the piece locations to avoid
    // accidentally modifying the cells. This is only ever 4 cells anyways so
    // not too big if a memory issue.
    Piece.prototype.getCells = function () {
        return JSON.parse(JSON.stringify(this.cells));
    };
    Piece.prototype.setCells = function (cells) {
        this.cells = cells;
        return true;
    };
    // Rotate the piece.
    // The row factors are to do the rotation in the correct direction.
    Piece.prototype.rotate = function (rowFactor, colFactor) {
        var cells = this.getCells();
        // First get the origin of rotation
        var origin = cells[1];
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
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
            cells[i].row = newRow;
            cells[i].col = newCol;
        }
        this.erase();
        this.setCells(cells);
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
        var cells = this.getCells();
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var selector = '.r' + cell.row + ' > .c' + cell.col;
            var element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                element.style.backgroundColor = '';
            }
        }
        return true;
    };
    Piece.prototype.drawHelper = function (selectorPrefix) {
        var cells = this.getCells();
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var selector = selectorPrefix + ' .r' + cell.row + ' > .c' + cell.col;
            var element = document.querySelector(selector);
            if (!(element instanceof HTMLElement)) {
                continue;
            }
            element.style.backgroundColor = this.getColour();
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
        var cells = this.getCells();
        // Make sure we have room to move left
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if (this.collisionDetect(cell.row, cell.col - 1)) {
                return false;
            }
            cells[i].col--;
        }
        this.erase();
        this.setCells(cells);
        return this.draw();
    };
    Piece.prototype.moveRight = function () {
        var cells = this.getCells();
        // Make sure we have room to move right
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if (this.collisionDetect(cell.row, cell.col + 1)) {
                return false;
            }
            cells[i].col++;
        }
        this.erase();
        this.setCells(cells);
        return this.draw();
    };
    Piece.prototype.moveDown = function () {
        var cells = this.getCells();
        // Make sure we have room to move down
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if (this.collisionDetect(cell.row - 1, cell.col)) {
                return false;
            }
            cells[i].row--;
        }
        this.erase();
        this.setCells(cells);
        return this.draw();
    };
    return Piece;
}());
// }}}
// LongBar Class// {{{
var LongBar = /** @class */ (function (_super) {
    __extends(LongBar, _super);
    function LongBar() {
        var _this = _super.call(this) || this;
        _this.orientation = 'horziontal';
        _this.setColour(CellColours.RED);
        _this.setCells([
            { 'row': 20, 'col': 4 },
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 20, 'col': 7 },
        ]);
        return _this;
    }
    // Rotate CCW just does the exact same thing that rotate90 does
    LongBar.prototype.rotate270 = function () {
        return this.rotate90();
    };
    LongBar.prototype.rotate90 = function () {
        var cells = this.getCells();
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
        var origin = cells[2];
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
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
            cells[i].row = newRow;
            cells[i].col = newCol;
        }
        this.erase();
        this.setCells(cells);
        this.draw();
        this.orientation = (this.orientation === 'horizontal') ? 'vertical' : 'horizontal';
        return true;
    };
    return LongBar;
}(Piece));
// }}}
// Square Class// {{{
var Square = /** @class */ (function (_super) {
    __extends(Square, _super);
    function Square() {
        var _this = _super.call(this) || this;
        _this.setColour(CellColours.BLUE);
        _this.setCells([
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 19, 'col': 5 },
            { 'row': 19, 'col': 6 },
        ]);
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
// }}}
// S and J Abstract Class// {{{
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
        var cells = this.getCells();
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
        var origin = cells[1];
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
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
            cells[i].row = newRow;
            cells[i].col = newCol;
        }
        this.erase();
        this.setCells(cells);
        this.draw();
        this.orientation = (this.orientation === 'horizontal') ? 'vertical' : 'horizontal';
        return true;
    };
    return SJPieces;
}(Piece));
// }}}
// S Piece Class// {{{
var SPiece = /** @class */ (function (_super) {
    __extends(SPiece, _super);
    function SPiece() {
        var _this = _super.call(this) || this;
        _this.setColour(CellColours.GREEN);
        _this.setCells([
            { 'row': 20, 'col': 7 },
            { 'row': 20, 'col': 6 },
            // horizontal for CCW, and CW for vertical
            { 'row': 19, 'col': 6 },
            { 'row': 19, 'col': 5 },
        ]);
        return _this;
    }
    return SPiece;
}(SJPieces));
// }}}
// Z Piece Class// {{{
var ZPiece = /** @class */ (function (_super) {
    __extends(ZPiece, _super);
    function ZPiece() {
        var _this = _super.call(this) || this;
        _this.setColour(CellColours.PINK);
        _this.setCells([
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            // horizontal for CCW, and CW for vertical
            { 'row': 19, 'col': 6 },
            { 'row': 19, 'col': 7 },
        ]);
        return _this;
    }
    return ZPiece;
}(SJPieces));
// }}}
// L Piece Class// {{{
var LPiece = /** @class */ (function (_super) {
    __extends(LPiece, _super);
    function LPiece() {
        var _this = _super.call(this) || this;
        _this.setColour(CellColours.BROWN);
        _this.setCells([
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 20, 'col': 7 },
            { 'row': 19, 'col': 5 },
        ]);
        return _this;
    }
    return LPiece;
}(Piece));
// }}}
// J Piece Class// {{{
var JPiece = /** @class */ (function (_super) {
    __extends(JPiece, _super);
    function JPiece() {
        var _this = _super.call(this) || this;
        _this.setColour(CellColours.ORANGE);
        _this.setCells([
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 20, 'col': 7 },
            { 'row': 19, 'col': 7 },
        ]);
        return _this;
    }
    return JPiece;
}(Piece));
// }}}
// T Piece Class// {{{
var TPiece = /** @class */ (function (_super) {
    __extends(TPiece, _super);
    function TPiece() {
        var _this = _super.call(this) || this;
        _this.setColour(CellColours.TURQUOISE);
        _this.setCells([
            { 'row': 20, 'col': 5 },
            { 'row': 20, 'col': 6 },
            { 'row': 20, 'col': 7 },
            { 'row': 19, 'col': 6 },
        ]);
        return _this;
    }
    return TPiece;
}(Piece));
// }}}
// Pausable Timer Class// {{{
var Timer = /** @class */ (function () {
    // Same signature as a normal timeout... Take a callback that will be
    // executed when the timer runs out, and a delay to wait before executing it
    function Timer(callback, delay) {
        this.remaining = delay;
        this.callback = callback;
        this.timerId = null;
        // Start the timer
        this.resume();
    }
    // pause the timer
    Timer.prototype.pause = function () {
        // Clear the timeout
        window.clearTimeout(this.timerId);
        this.timerId = null;
        // Find out how much time is remaining for when we resume
        this.remaining -= Date.now() - this.start;
    };
    ;
    // Resume the timer
    Timer.prototype.resume = function () {
        // Don't resume if there is no time remaining.
        if (this.remaining <= 0) {
            return;
        }
        // Don't resume if the timer is still active
        if (this.timerId !== null) {
            return;
        }
        // We are starting, or restarting the timer, so save the start time in
        // case we need to pause it again
        this.start = Date.now();
        // Set a new timeout with the delay being the remaining time
        this.timerId = window.setTimeout(this.callback, this.remaining);
    };
    ;
    return Timer;
}());
;
// }}}
// Game class// {{{
var Game = /** @class */ (function () {
    function Game() {
    }
    // Function to start the game
    Game.start = function (startLevel) {
        // Set the starting level
        this.startLevel = startLevel;
        this.level = startLevel;
        // Update the level shown to the user
        this.updateLevel();
        // Generate the starting piece
        this.generatePiece();
        // Advance the game so that the timer to move the piece down starts
        this.advance();
        // Pause the game to start with
        this.togglePause();
    };
    // Add points to the Games score variable according to the number of lines
    // cleared
    Game.addPointsForLinesCleared = function (linesScored) {
        // If you cleared less than 1 lines then why is this even being called?
        // If you cleared more than 4 then something has gone terribly wrong
        if (linesScored < 1 || linesScored > 4) {
            throw new Error("Tried to update the score with " + linesScored + " scored lines.");
        }
        // These are the base points for lines clears depending on how many
        // lines were cleared
        var basePoints = [
            40,
            100,
            300,
            1200,
        ];
        // The final score added is the base points multiplied by your
        // (level + 1)
        this.score += (this.level + 1) * basePoints[linesScored - 1];
    };
    // Update the score element on the page for the user to see
    Game.updateScoreElem = function () {
        // Find the score element on the page
        var scoreElem = document.getElementById('score');
        if (!(scoreElem instanceof HTMLElement)) {
            throw new Error("Could not find score element");
        }
        // Add the score to the element
        scoreElem.textContent = this.score.toString();
    };
    // Remove any completed lines from the board
    Game.removeCompleteLines = function () {
        // The only rows you need to check are the ones affected by the
        // final position of the last placed piece... So I will get those rows
        // here
        // Get the cells for the active piece.
        // Take that and create an array of just the row numbers
        // Then only keep unique rows so I don't have duplicates
        var rowsToCheck = this.activePiece.getCells().map(function (el) { return (el.row); }).unique();
        var completedRowsCount = 0;
        var isRowComplete = false;
        var _loop_1 = function (i) {
            // Find the row on the board
            var row = document.querySelector('.mainBoard.board .row.r' + rowsToCheck[i]);
            if (!(row instanceof HTMLElement)) {
                throw new Error("Couldn't find Row " + rowsToCheck[i] + " (idx " + i + ")");
            }
            // Retrieve the number of cells on that row that were filled by
            // getting the row children (which are the squares in that row) and
            // filter that to make sure that none of the squares have no colour.
            var numFilledCells = Array.from(row.children).filter(function (cell, j) {
                if (!(cell instanceof HTMLElement)) {
                    throw new Error("Couldn't find column index " + j + " in row idx " + i);
                }
                return cell.style.backgroundColor !== '';
            }).length;
            // If the number of filled cells is 10, then that row is filled and
            // can be removed
            if (numFilledCells === 10) {
                // That is 1 additional completed row
                completedRowsCount++;
                // Remove the row from the board. We will add a new one later at
                // the top. This is the easiest way to remove rows
                row.remove();
            }
        };
        // Check each row that the last piece affected
        for (var i = 0; i < rowsToCheck.length; i++) {
            _loop_1(i);
        }
        // If we completed a row, then we need to updated the score, the number
        // of lines cleared, and possibly the level that the user is on
        if (completedRowsCount > 0) {
            this.addPointsForLinesCleared(completedRowsCount);
            this.updateLines(completedRowsCount);
            this.updateLevel();
        }
        // We have now removed all complete lines. Insert the number of
        // removed lines to the top now. And add the c1 to c10 classes to each
        // column
        for (var i = 0; i < completedRowsCount; i++) {
            // This is a row, so add this to the top the correct number of times
            var rowHTML = "\n                <div class='row'>\n                    <div class='cell c1'></div>\n                    <div class='cell c2'></div>\n                    <div class='cell c3'></div>\n                    <div class='cell c4'></div>\n                    <div class='cell c5'></div>\n                    <div class='cell c6'></div>\n                    <div class='cell c7'></div>\n                    <div class='cell c8'></div>\n                    <div class='cell c9'></div>\n                    <div class='cell c10'></div>\n                </div>\n            ";
            // Find the board
            var board = document.querySelector('.mainBoard.board');
            if (!(board instanceof HTMLElement)) {
                throw new Error("Couldn't find Board");
            }
            // TODO: iOS fails on this line... Whether it is the call to
            // insertBefore, or something inside htmlToElement, I don't know...
            // It gets past all the lines in htmlToElement except for the return
            // statement
            // Insert the above row HTML into the board before the first row
            // (ie, add this new row to the very top of the board)
            board.insertBefore(htmlToElement(rowHTML), board.children[0]);
        }
        // Now go back through all the rows and update the r1 to r20 classes.
        var rows = document.querySelectorAll('.mainBoard.board .row');
        for (var i = rows.length - 1, count = 1; i >= 0; i--, count++) {
            var row = rows[i];
            if (!(row instanceof HTMLElement)) {
                throw new Error("Couldn't find Row index " + i);
            }
            // Add the rx class to the row
            row.classList.add('r' + count);
        }
    };
    // Advance the game
    Game.advance = function (instantAdvance) {
        var _this = this;
        if (instantAdvance === void 0) { instantAdvance = false; }
        // a Callback to advance the game
        var callback = function () {
            // If the active piece can be moved down, then it is moved down and
            // the game is advanced again
            if (_this.activePiece.moveDown()) {
                _this.advance();
            }
            else {
                // If the active piece can't be moved down then we have bottomed
                // out.
                // Find and remove finished lines
                _this.removeCompleteLines();
                // Try to generate a piece
                if (_this.generatePiece()) {
                    // If you could, then advance
                    Game.advance();
                }
                // If a piece couldn't be generated then assume the game is lost
                // TODO: I think we should actually do the lost game check here
                // instead, and draw the pieces here too
            }
            // Update the score element no matter what happens (moving down can
            // give you points, but so does clearing lines)
            _this.updateScoreElem();
        };
        // If instant advance, then run the advance steps instantly instead of
        // after a delay
        if (instantAdvance) {
            callback();
            return;
        }
        // Run the advance after a which is determined by your level
        this.gravity = new Timer(callback, this.getSpeed());
    };
    // Erase the preview of the next piece
    Game.previewErase = function () {
        // Find the rows of the preview board
        var rows = document.querySelector('.preview .board').children;
        // Loop through all the rows
        for (var i = 0; i < rows.length; i++) {
            // get the cells for that row
            var cells = rows[i].children;
            // Loop through the cells
            for (var j = 0; j < cells.length; j++) {
                var cell = cells[j];
                if (!(cell instanceof HTMLElement)) {
                    throw new Error("Couldn't find column");
                }
                // Set the cell to no colour
                cell.style.backgroundColor = '';
            }
        }
    };
    // Check if the game has been lost
    // This function call assumes that the active piece has just been generated
    // and is going to be placed at the top of the board, but hasn't been drawn
    // yet
    // TODO: I don't like that for this function to work that it assumes so
    // much...
    Game.isGameLost = function () {
        // Get the cells for the active piece and loop through them all
        var cells = this.activePiece.getCells();
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            // Find the cell element
            var selector = '.r' + cell.row + ' > .c' + cell.col;
            var element = document.querySelector(selector);
            if (!(element instanceof HTMLElement)) {
                throw new Error('selector failed [' + selector + ']');
            }
            // Check the colour of the cell. If it is not empty, then a piece is
            // already there, so player loses
            if (element.style.backgroundColor !== '') {
                Game.isActive = false;
                return true;
            }
        }
        return false;
    };
    Game.generatePiece = function () {
        // Active piece is the next piece
        Game.activePiece = Game.nextPiece;
        // If we don't have a piece, then generate a new one
        if (Game.activePiece === null) {
            var idx = Math.floor(Math.random() * this.Pieces.length);
            this.activePiece = this.Pieces[idx]();
        }
        // If the new active piece will be a longbar, then reset the drought to
        // 0, otherwise add 1.
        // TODO: Why is this in this function? It isn't related at all
        this.longbarDrought = (Game.activePiece instanceof LongBar) ? 0 : this.longbarDrought + 1;
        // If this drought is longer than the longest drought, then this is the
        // new longest drought
        // TODO: Why is this in this function? It isn't related at all
        if (this.longbarDrought > this.longestLongbarDrought) {
            this.longestLongbarDrought = this.longbarDrought;
        }
        // Erase the next piece preview
        this.previewErase();
        // Get the index for the next piece and generate it
        var nextPieceIdx = Math.floor(Math.random() * this.Pieces.length);
        this.nextPiece = this.Pieces[nextPieceIdx]();
        // Draw the next piece in the preview area
        this.nextPiece.previewDraw();
        // Update the longbar drought info on the screen
        // TODO: Why is this in this function? It isn't related at all
        document.querySelector('.info .longbar-drought h1').textContent = this.longbarDrought.toString();
        document.querySelector('.info .longest-longbar-drought h1').textContent = this.longestLongbarDrought.toString();
        // Check if the user has lost the game
        // TODO: Why is this in here? It isn't related to piece generation. Try
        // and move this
        if (this.isGameLost()) {
            // TODO: Show a message and a way to reset the game
            alert("You Lost");
            return false;
        }
        // Draw the active piece
        this.activePiece.draw();
        return true;
    };
    // User wants to move the piece left
    Game.moveLeft = function () {
        // If the game is lost or paused don't move
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.activePiece.moveLeft();
    };
    // User wants to move the piece right
    Game.moveRight = function () {
        // If the game is lost or paused don't move
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.activePiece.moveRight();
    };
    // User wants to move the piece down
    Game.moveDown = function () {
        // If the game is lost or paused don't move
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        // Try to move down.
        if (!this.activePiece.moveDown()) {
            // If couldn't move down then pause gravity because there is no
            // point in having the game try and move the piece as well
            this.gravity.pause();
            // Advance the game instantly
            Game.advance(true);
        }
    };
    // User wants to drop the piece
    Game.drop = function () {
        // If the game is lost or paused don't move
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        // Pause gravity because there is no point if we are dropping
        this.gravity.pause();
        // While we drop rows we need to add to a counter for scoring points
        var points = 0;
        while (this.activePiece.moveDown()) {
            // Every row we move down successfully, add a point
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
        // Add the points to the game score
        Game.score += points;
        // True is meant to instantly run the advance instead of waiting for a
        // delay. Dropping should instantly advance to the next piece
        this.advance(true);
    };
    // User wants to rotate CCW
    Game.rotateCCW = function () {
        // Don't allow a rotation if the game is paused or lost
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.activePiece.rotate270();
    };
    // User wants to rotate CW
    Game.rotateCW = function () {
        // Don't allow a rotation if the game is paused or lost
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        this.activePiece.rotate90();
    };
    // User wants to pause the game
    Game.togglePause = function () {
        // Don't allow a pause of the game was lost
        if (!Game.isActive) {
            return;
        }
        // Reverse the variable for future calls
        this.isPaused = !this.isPaused;
        // Find the parent element of the game
        var mainArea = document.getElementsByClassName('mainArea')[0];
        if (!(mainArea instanceof HTMLElement)) {
            throw new Error("Couldn't find mainArea");
        }
        // Find the pause banner
        var pauseBanner = document.getElementsByClassName('pause_banner')[0];
        if (!(pauseBanner instanceof HTMLElement)) {
            throw new Error("Couldn't find PauseBanner");
        }
        // If we are now paused
        if (this.isPaused) {
            // Pause gravity, show the pause banner and lighten the background
            this.gravity.pause();
            mainArea.classList.add('paused');
            pauseBanner.classList.remove('hidden');
        }
        else {
            // If unpaused, then hide the pause banner, darken the background,
            // and resume gravity
            mainArea.classList.remove('paused');
            pauseBanner.classList.add('hidden');
            this.gravity.resume();
        }
    };
    // Update the number of lines the user has completed
    // Also updates the element on the page to tell the user
    Game.updateLines = function (completedLines) {
        // Find the element on the page to show the lines
        var linesElem = document.getElementById('lines');
        if (!(linesElem instanceof HTMLElement)) {
            throw new Error("Could not find level element");
        }
        // Add the number of completed lines to our lines total
        this.lines += completedLines;
        // Update the element on the page
        linesElem.textContent = this.lines.toString();
    };
    // Update the level, and level element on the page
    Game.updateLevel = function () {
        // Find the level element
        var levelElem = document.getElementById('level');
        if (!(levelElem instanceof HTMLElement)) {
            throw new Error("Could not find level element");
        }
        // If the lines we have are higher than the line target for the current
        // level, then increase the level
        if (this.lines >= this.getLineTarget()) {
            this.level++;
        }
        // Set the level element on the page
        levelElem.textContent = this.level.toString();
    };
    // Calculate the speed of gravity for the user's current level
    Game.getSpeed = function () {
        if (this.level <= 8) {
            // Per NES Tetris, the speed of level 0 is 48 frames per grid. This
            // calculation converts that to milliseconds given that NES tetris ran
            // at 60 FPS.
            // Every level higher than 0 up to level 8 reduces the frames per grid
            // by 5.
            return Math.floor((48 - (this.level * 5)) / 60 * 1000);
        }
        // If level is higher than 8, then the speed is calculated differently
        // Level 9 is 6 'frames'
        // Level 10, 11, and 12 is 5 'frames'
        // Level 13, 14, and 15 is 4 'frames'
        // Level 16, 17, and 18 is 3 'frames'
        // Starting at frames per grid
        var speed = 1;
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
        // If the level is between 19 and 28, then add another to the speed...
        // That will make levels 19 to 28 2 frames
        if (this.level >= 19 && this.level <= 28) {
            speed++;
        }
        // Everything 29 and over is 1 frame
        // Convert the 'frame' speed to ms
        return speed / 60 * 1000;
    };
    // Find the target number of lines to advance to the next level
    Game.getLineTarget = function () {
        // If this is the starting level, this is apparently the calculation to
        // determine how many lines you need to advance to your second level.
        var lineTarget = Math.min((this.startLevel * 10 + 10), Math.max(100, (this.startLevel * 10 - 50)));
        // This adds on 10 extra lines for every level past your starting level
        // you are
        lineTarget += (this.level - this.startLevel) * 10;
        return lineTarget;
    };
    // Array of functions to create new pieces
    Game.Pieces = [
        function () { return new LongBar(); },
        function () { return new Square(); },
        function () { return new SPiece(); },
        function () { return new ZPiece(); },
        function () { return new LPiece(); },
        function () { return new JPiece(); },
        function () { return new TPiece(); },
    ];
    // This is used to keep track of how many lines the user has cleared so far.
    // This is used in order to show this stat, but also to track what level the
    // user should be on
    Game.lines = 0;
    // This is the currently active piece that the user is moving
    Game.activePiece = null;
    // This is the piece that will be active next (we track this so that we can
    // display it in the piece preview area)
    Game.nextPiece = null;
    // Keep track of how long the current longbar drought is, for statistical
    // purposes
    Game.longbarDrought = 0;
    // Keep track of how long your longest long bar drought was for statistical
    // purposes
    Game.longestLongbarDrought = 0;
    // Keep track of the users score
    Game.score = 0;
    // Track the game state. ie, whether it is paused, and whether it is active.
    // Active means, is the game playable, or is the game over
    Game.isPaused = false;
    Game.isActive = true;
    return Game;
}());
// }}}
// Function to setup the user's keys// {{{
var setupUserKeys = function () {
    // NES Tetris has a DAS delay of 16 frames and an ARR delay of 6 frames. At
    // 60 FPS, that is 267ms and 100ms respectively
    var startDAS = function (func, dasTime, arrTime) {
        if (dasTime === void 0) { dasTime = 267; }
        if (arrTime === void 0) { arrTime = 100; }
        // Move immediately after pressing the button
        func();
        // Wait the DAS delay before moving again
        dasTimeout = window.setTimeout(function () {
            func();
            // Once DAS is up, move at the ARR speed after that until released
            arrInterval = window.setInterval(func, arrTime);
        }, dasTime);
    };
    var keyUp = function (e) {
        // If the released key is not saved as the pressed key, then ignore
        if (e.getKeyCode() !== pressedKey) {
            return;
        }
        // Reset the pressed key
        pressedKey = null;
        // Clear the timers so that they keys aren't pressed again
        clearTimeout(dasTimeout);
        clearInterval(arrInterval);
    };
    // Function to handle keypresses
    var keyDown = function (e) {
        e = e || window.event;
        var keyCode = e.getKeyCode();
        if (keyCode === 'ENTER') {
            Game.togglePause();
            return;
        }
        if (keyCode === 'Z') {
            Game.rotateCCW();
            return;
        }
        if (keyCode === 'X') {
            Game.rotateCW();
            return;
        }
        if (keyCode === 'SPACE') {
            Game.drop();
            return;
        }
        // If a key is currently held down then exit
        if (pressedKey !== null) {
            return;
        }
        // If a key is not held down right now, then we need to check the arrow
        // keys and try to handle it being held down
        // Mark this key as being down now
        pressedKey = keyCode;
        // If the key pressed is any of these arrow keys, we need to detect if
        // the key is held down and if so, specify our own DAS (Basically, if we
        // detect the key to be held down then regulate how fast the piece moves)
        if (keyCode === 'DOWN') {
            // The 50 is setting a faster speed than default since NES Tetris
            // moves pretty fast going down
            startDAS(function () { Game.moveDown(); }, 50, 50);
        }
        else if (keyCode === 'LEFT') {
            startDAS(function () { Game.moveLeft(); });
        }
        else if (keyCode === 'RIGHT') {
            startDAS(function () { Game.moveRight(); });
        }
    };
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
};
// }}}
// Function to setup mobile touch support// {{{
var setupMobileTouchSupport = function () {
    // The starting location in the X and Y planes of a touch
    var startX;
    var startY;
    // The distance the touch gesture has moved
    var xDist;
    var yDist;
    // required min distance travelled to be considered swipe or touch movement
    var distanceThreshold = 50;
    // If something happens that causes us to want to skip the touchend event,
    // then set this to true
    var cancelTouchEnd = false;
    // Find the board
    var board = document.querySelector('.mainArea');
    if (!(board instanceof HTMLElement)) {
        throw new Error("Couldn't find Board");
    }
    // Add the touch start event handler
    board.addEventListener('touchstart', function (e) {
        // Get the touched object
        var touchobj = e.changedTouches[0];
        // Start with the cancelling of touch end to false
        cancelTouchEnd = false;
        // Distance is set to 0
        xDist = 0;
        yDist = 0;
        // Find the starting point of the touches
        startX = touchobj.pageX;
        startY = touchobj.pageY;
        // record time when finger first makes contact with surface
        e.preventDefault();
    }, false);
    // Event handler for moving your finger
    board.addEventListener('touchmove', function (e) {
        // prevent scrolling when inside DIV
        e.preventDefault();
        // Get the touched object
        var touchobj = e.changedTouches[0];
        // get total dist travelled by finger while in contact with surface
        xDist = touchobj.pageX - startX;
        yDist = touchobj.pageY - startY;
        // If the distance travelled in both the x and y direction is less than
        // our threshold, then ignore it
        if (Math.abs(xDist) < distanceThreshold && Math.abs(yDist) < distanceThreshold) {
            return;
        }
        // If the distance travelled in the X direction is more than what was
        // travelled in the Y, then we will assume a left or right movement.
        if (Math.abs(xDist) > Math.abs(yDist)) {
            // Set new start positions, which is wherever the finger was moved
            // to
            startX = touchobj.pageX;
            startY = touchobj.pageY;
            // Cancel the touch end for this
            cancelTouchEnd = true;
            // Move the piece left or right depending on the direction that the
            // user swiped
            xDist < 0 ? Game.moveLeft() : Game.moveRight();
        }
    }, false);
    // Touch end handler
    board.addEventListener('touchend', function (e) {
        e.preventDefault();
        // If we specified to cancel the touch end, then do nothing
        if (cancelTouchEnd) {
            return;
        }
        // Get the touched object
        var touchobj = e.changedTouches[0];
        // get total dist travelled by finger while in contact with surface
        xDist = touchobj.pageX - startX;
        yDist = touchobj.pageY - startY;
        // If The distance your finger travelled didn't exceed the threshold in
        // either the X or Y direction, then assume a screen tap, and rotate the
        // piece
        if (Math.abs(xDist) < distanceThreshold && Math.abs(yDist) < distanceThreshold) {
            Game.rotateCW();
        }
        else {
            // Otherwise either pause or drop
            yDist < 0 ? Game.togglePause() : Game.drop();
        }
    }, false);
};
// }}}
// Function to convert an HTML string to a ChildNode type// {{{
var htmlToElement = function (html) {
    // Create a template element
    var template = document.createElement('template');
    // Trim the HTML just in case
    html = html.trim();
    // Set the HTML of the template to what our string is
    template.innerHTML = html;
    // Return the first child of the template
    return template.content.firstChild;
};
// }}}
window.onload = function () {
    // alert('HELLO 1');
    // Add polyfill functionality
    addPolyFill();
    // Initialize our GET options
    var init = {
        'lvl': '-1',
        'seed': ''
    };
    // Get arguments from URL. We expect a level and seed for the RNG
    var GET_ARGS = location.search.substr(1).split('&').reduce(function (acc, val) {
        var _a = val.split('='), key = _a[0], value = _a[1];
        // If no value, then ignore
        if (value === undefined) {
            return acc;
        }
        acc[key] = value;
        return acc;
    }, init);
    // Get the level as an integer
    var level = parseInt(GET_ARGS.lvl, 10);
    if (isNaN(level) || level < 0) {
        // This could happen if someone messes with the URL, or if there just
        // wasn't a level in the URL, so ask the user
        level = parseInt(prompt("Choose a Starting Level (0 through 19):"), 10);
        while (isNaN(level) || level < 0 || level > 19) {
            level = parseInt(prompt("You must enter a level between 0 and 19"), 10);
        }
    }
    // Get the seed from the URL
    var seed = GET_ARGS.seed;
    if (seed === '') {
        // If no seed, then generate one
        // substring(2) is just to remove the '0.' from the beginning of the
        // random number
        seed = Math.random().toString().substring(2);
    }
    // Seed the RNG with the seed that was either generated and grabbed from the
    // URL
    Math.seedrandom(seed);
    // Add the level and seed info to the URL so the user can give the url to a
    // friend.
    window.history.replaceState(null, '', '/tetris?lvl=' + level + '&seed=' + seed);
    // Setup the user's keys and swipe gestures
    setupUserKeys();
    // Start the game at the specified level
    Game.start(level);
};
