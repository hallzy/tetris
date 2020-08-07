// TODO:
//  - See if I can reduce the delay when holding down the arrow keys
//  - Rotating pieces at the top of the board doesn't work, probably due to
//    collision detection not letting things go off the top of the screen.
//  - Show a preview of the next piece
//  - Some sort of animation for clearing lines so it isn't so abrupt
//  - Seems to take some time to clear lines... What is causing that delay?
//  - Change colour of placed pieces to a Gray or something?
//  - Show statistics:
//      - Current long bar drought
//      - Longest long bar drought
//      - The count of each piece that you have seen
//  - There seems to be a delay at lower levels to get the next piece generated.
//    I would like that to be quicker
// - Add instructions somewhere
// - Add a way to specify the starting level
// - Mobile swipe/touch support
// - Have a way to create unique games that can be replayed with the same
// sequence of pieces and keep track of scores on that particular game


type PieceLocations = [
    { 'row' : number, 'col' : number},
    { 'row' : number, 'col' : number},
    { 'row' : number, 'col' : number},
    { 'row' : number, 'col' : number},
];

abstract class Piece {
    // Colour of the piece to use
    protected colour : string;

    protected name : string;

    // The cells that this piece takes up
    protected cells  : PieceLocations;

    public constructor() {
    }

    public getColour() : string {
        return this.colour;
    }

    public getName() : string {
        return this.name;
    }

    public getCells() : PieceLocations {
        return this.cells;
    }

    // Rotate the piece.
    // The row factors are to do the rotation in the correct direction.
    private rotate(rowFactor : number, colFactor : number) : boolean {
        // First get the origin of rotation
        var origin = this.cells[1];

        // Copy the cells so it is easy to revert if needed
        var tmpCells : PieceLocations = JSON.parse(JSON.stringify(this.cells));

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
    }

    public rotate90() : boolean {
        return this.rotate(-1, 1);
    }

    public rotate270() : boolean {
        return this.rotate(1, -1);
    }

    protected erase() : boolean {
        for (var i in this.cells) {
            var cell = this.cells[i];

            var selector = '.r' + cell.row + ' > .c' + cell.col;
            var element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                element.style.backgroundColor = '';
            } else {
                return false;
            }
        }
        return true;
    }

    protected draw() : boolean {
        for (var i in this.cells) {
            var cell = this.cells[i];

            var selector = '.r' + cell.row + ' > .c' + cell.col;
            var element = document.querySelector(selector);
            if (!(element instanceof HTMLElement)) {
                throw new Error("Failed to find cell -- " + selector);
                return false;
            }

            element.style.backgroundColor = this.colour;
        }
        return true;
    }

    // true => Collision Detected
    // false => No Collision Detected
    public collisionDetect(row : number, col : number) : boolean {
        // The row and column have to be within bounds
        if (row > 20 || row < 1 || col < 1 || col > 10) {
            return true;
        }

        var selector = '.r' + row + ' > .c' + col;
        var element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) {
            throw new Error('Failed to find cell element -- ' + selector);
        }

        this.erase();
        var colour = element.style.backgroundColor;
        this.draw();

        // Square is not empty, so it is occupied.
        if (colour !== '') {
            return true;
        }

        return false;
    }

    public moveLeft() : boolean {
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
    }

    public moveRight() : boolean {
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
    }

    public moveDown() : boolean {
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
    }
}

class LongBar extends Piece {
    private orientation = 'horziontal';

    public constructor() {
        super();
        this.colour = 'red';
        this.cells = [
            {'row' : 20, 'col' : 4},
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6}, // This is the axis of rotation I am using
            {'row' : 20, 'col' : 7},
        ];

        this.name = "Long Bar";

        this.draw();
    }

    // Rotate CCW just does the exact same thing that rotate90 does
    public rotate270() : boolean {
        return this.rotate90();
    }

    public rotate90() : boolean {
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
        var tmpCells : PieceLocations = JSON.parse(JSON.stringify(this.cells));

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
    }
}

class Square extends Piece {

    public constructor() {
        super();
        this.colour = 'royalblue';
        this.cells = [
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6},
            {'row' : 19, 'col' : 5},
            {'row' : 19, 'col' : 6},
        ];
        this.name = "Square";
        this.draw();
    }

    // Square doesn't rotate
    public rotate270() : boolean {
        return true;
    }
    public rotate90() : boolean {
        return true;
    }
}

abstract class SJPieces extends Piece {
    protected orientation = 'horizontal';

    public constructor() {
        super();
    }

    public rotate270() : boolean {
        // CCW rotation happens to be exactly the same as a CW rotation
        return this.rotate90();
    }

    public rotate90() : boolean {
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
        var tmpCells : PieceLocations = JSON.parse(JSON.stringify(this.cells));

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
    }
}

class SPiece extends SJPieces {
    public constructor() {
        super();
        this.colour = 'limegreen';
        this.cells = [
            {'row' : 20, 'col' : 7},
            {'row' : 20, 'col' : 6}, // This square is the axis of rotation when
                                     // horizontal for CCW, and CW for vertical
            {'row' : 19, 'col' : 6},
            {'row' : 19, 'col' : 5},
        ];
        this.name = "S Piece";
        this.draw();
    }
}

class ZPiece extends SJPieces {
    public constructor() {
        super();
        this.colour = 'palevioletred';
        this.cells = [
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6}, // This square is the axis of rotation when
                                     // horizontal for CCW, and CW for vertical
            {'row' : 19, 'col' : 6},
            {'row' : 19, 'col' : 7},
        ];

        this.name = "Z Piece";
        this.draw();
    }
}

class LPiece extends Piece {
    public constructor() {
        super();
        this.colour = 'brown';
        this.cells = [
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6}, // This is axis of rotation
            {'row' : 20, 'col' : 7},
            {'row' : 19, 'col' : 5},
        ];
        this.name = "L Piece";
        this.draw();
    }

}

class JPiece extends Piece {

    public constructor() {
        super();
        this.colour = 'darkorange';
        this.cells = [
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6},
            {'row' : 20, 'col' : 7},
            {'row' : 19, 'col' : 7},
        ];
        this.name = "J Piece";
        this.draw();
    }
}

class TPiece extends Piece {

    public constructor() {
        super();
        this.colour = 'darkturquoise';
        this.cells = [
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6},
            {'row' : 20, 'col' : 7},
            {'row' : 19, 'col' : 6},
        ];
        this.name = "T Piece";
        this.draw();
    }

}

class Timer {
    private timerId;
    private start
    private remaining;
    private callback;

    public constructor(callback : Function, delay : number) {
        this.remaining = delay;
        this.callback = callback;

        this.resume();
    }

    public pause() {
        window.clearTimeout(this.timerId);
        this.remaining -= Date.now() - this.start;
    };

    public resume() {
        this.start = Date.now();
        window.clearTimeout(this.timerId);
        this.timerId = window.setTimeout(this.callback, this.remaining);
    };
};

class Game {
    private static Pieces = [
        () => new LongBar(),
        () => new Square(),
        () => new SPiece(),
        () => new ZPiece(),
        () => new LPiece(),
        () => new JPiece(),
        () => new TPiece(),
    ];

    private static lines : number = 0;

    private static level : number;

    private static startLevel : number;

    private static activePiece : Piece;

    private static timer;

    private static score : number = 0;

    public static isPaused = false;

    public static start(startLevel : number) {
        this.startLevel = startLevel;
        this.level = startLevel;

        this.updateLevel();

        this.generatePiece();
        this.advance();
        this.togglePause();
    }

    private static updateScore(linesScored : number) {
        if (linesScored < 1 || linesScored > 4) {
            throw new Error("Tried to update the score with " + linesScored + " scored lines.");
        }

        var basePoints = {
            1: 40,    // Clearing 1 line gets you 40 points * the level multiplier
            2: 100,   // etc
            3: 300,
            4: 1200,
        }

        this.score += (this.level + 1) * basePoints[linesScored];
        console.log(this.score);

        var scoreElem = document.getElementById('score');
        if (!(scoreElem instanceof HTMLElement)) {
            throw new Error("Could not find score element");
        }

        scoreElem.textContent = this.score.toString();
    }

    private static removeCompleteLines(piecePosition : PieceLocations) {
        // Something to keep in mind... All rows that are removed after a block
        // placement will be adjacent to each other. So if you find a row that
        // has been removed, then the next one hasn't, you can stop looking.

        // Also, the only rows you need to check are the ones affected by t he
        // final position of the last placed piece... So I will get those rows
        // here
        var rowsToCheck = unique(piecePosition.map(el => (el.row)));

        var completedRows : number[] = [];

        var isRowComplete = false;

        for (var i = 0; i < rowsToCheck.length; i++) {
            var row = document.querySelector('.row.r' + rowsToCheck[i]);
            if (!(row instanceof HTMLElement)) {
                throw new Error("Couldn't find Row index " + i);
            }

            var numFilledCells = Array.from(row.children).filter(function(cell, j) {
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
            this.updateScore(completedRows.length);
            this.updateLines(completedRows.length);
            this.updateLevel();
        }

        // We have now removed all complete lines now. Insert the number of
        // removed lines to the top now. And add the c1 to c10 classes to each
        // column
        for (var i = 0; i < completedRows.length; i++) {
            var rowHTML = `
                <div class='row'>
                    <div class='cell c1'></div>
                    <div class='cell c2'></div>
                    <div class='cell c3'></div>
                    <div class='cell c4'></div>
                    <div class='cell c5'></div>
                    <div class='cell c6'></div>
                    <div class='cell c7'></div>
                    <div class='cell c8'></div>
                    <div class='cell c9'></div>
                    <div class='cell c10'></div>
                </div>
            `
            var board = document.getElementsByClassName('board')[0];
            if (!(board instanceof HTMLElement)) {
                throw new Error("Couldn't find Board");
            }

            var newRow = board.insertBefore(htmlToElement(rowHTML), board.children[0]);
        }

        // Now go back through all the rows and update the r1 to r20 classes.
        var count = 1;
        var rows = document.getElementsByClassName('row');
        for (var i = rows.length - 1; i >= 0; i--) {
            var row = rows[i];
            if (!(row instanceof HTMLElement)) {
                throw new Error("Couldn't find Row index " + i);
            }

            row.classList.add('r' + count);
            count++;
        }
    }

    private static advance() {
        this.timer = new Timer(() => {
            if (this.activePiece.moveDown()) {
                    this.advance();
            } else {
                var finalPosition = this.activePiece.getCells();
                this.removeCompleteLines(finalPosition);
                this.generatePiece();
                Game.advance();
            }
        }, this.getSpeed());
    }

    public static generatePiece() {
        var random = Math.floor(Math.random() * this.Pieces.length);
        this.activePiece = this.Pieces[random]();
    }

    public static moveLeft() {
        this.activePiece.moveLeft();
    }

    public static moveRight() {
        this.activePiece.moveRight();
    }

    public static moveDown() {
        if (!this.activePiece.moveDown()) {
            this.timer.pause();
            this.generatePiece();
            Game.advance();
        }
    }

    public static drop() {
        this.timer.pause();
        while (this.activePiece.moveDown());
        this.advance();
    }

    public static rotateCCW() {
        this.activePiece.rotate270();
    }

    public static rotateCW() {
        this.activePiece.rotate90();
    }

    public static togglePause() {
        this.isPaused = this.isPaused ? false : true;

        var board = document.getElementsByClassName('board')[0];
        if (!(board instanceof HTMLElement)) {
            throw new Error("Couldn't find Board");
        }

        var pauseBanner = document.getElementsByClassName('pause_banner')[0];
        if (!(pauseBanner instanceof HTMLElement)) {
            throw new Error("Couldn't find PauseBanner");
        }

        if (this.isPaused) {
            this.timer.pause();
            board.style.opacity = '0.3';
            pauseBanner.classList.remove('hidden');
        } else {
            board.style.opacity = '1';
            pauseBanner.classList.add('hidden');
            this.timer.resume();
        }
    }

    public static updateLines(completedLines : number) {
        var linesElem = document.getElementById('lines');
        if (!(linesElem instanceof HTMLElement)) {
            throw new Error("Could not find level element");
        }

        this.lines += completedLines;

        linesElem.textContent = this.lines.toString();
    }

    public static updateLevel() {
        var levelElem = document.getElementById('level');
        if (!(levelElem instanceof HTMLElement)) {
            throw new Error("Could not find level element");
        }

        if (this.lines >= this.getLineTarget()) {
            this.level++;
        }

        levelElem.textContent = this.level.toString();
    }

    public static getSpeed() : number {
        if (this.level <= 8) {
            // Per NES Tetris, the speed of level 0 is 48 frames per grid. This
            // calculation converts that to milliseconds given that NES tetris ran
            // at 60 FPS.

            // Every level higher than 0 up to level 8 reduces the frames per grid
            // by 5.
            return Math.floor((48 - (this.level*5)) / 60 * 1000);
        }

        // Starting at frames per grid
        var speed = 0;

        switch(this.level) {
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
    }

    public static getLineTarget() : number {
        // If this is the starting level, this is apparently the calculation to
        // determine how many lines you need to advance to your second level.
        var lineTarget = Math.min((this.startLevel * 10 + 10), Math.max(100, (this.startLevel * 10 - 50)));

        // This adds on 10 extra lines for every level past your starting level
        // you are
        lineTarget += (this.level - this.startLevel) * 10;

        return lineTarget;
    }
}

function setupUserKeys() {
    document.onkeydown = checkKey;

    function checkKey(e) {
        e = e || window.event;

        if (e.keyCode == '13') {
            Game.togglePause();
            return;
        }

        if (Game.isPaused) {
            return;
        }

        // down arrow
        if (e.keyCode == '40') {
            Game.moveDown();
        // left arrow
        } else if (e.keyCode == '37') {
            Game.moveLeft();
        // right arrow
        } else if (e.keyCode == '39') {
            Game.moveRight();
        // Enter Key
        } else if (e.keyCode == '13') {
            Game.togglePause();
        // Z key
        } else if (e.keyCode == '90') {
            Game.rotateCCW();
        // X Key
        } else if (e.keyCode == '88') {
            Game.rotateCW();
        // Space Bar
        } else if (e.keyCode == '32') {
            Game.drop();
        }
    }
}

function htmlToElement(html : string) : ChildNode {
    var template = document.createElement('template');
    // Never return a text node of whitespace as the result
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function unique(list : number[]) : number[] {
    return list.filter((val, idx, self) => self.indexOf(val) === idx);
}

window.onload = function() {
    setupUserKeys();
    Game.start(6);
}
