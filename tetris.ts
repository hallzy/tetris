/// <reference path="./polyfill.ts" />

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
// - Better Mobile swipe/touch support
//   - Maybe use the touchmove event to have the piece track the users finger
//   instead of having swipes
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
    private static nextPieceIdx : number = -1;

    private static longbarDrought : number  = 0;
    private static longestLongbarDrought : number  = 0;

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
            var row = document.querySelector('.board .row.r' + rowsToCheck[i]);
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

        // alert('updated score, lines, and level')

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
        var rows = document.querySelectorAll('.board .row');
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

        // If we don't have a next piece or the next piece is invalid, generate
        // a random index for the current piece. Otherwise, we will use the
        // nextPieceIdx
        var idx : number = this.nextPieceIdx;
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
        this.nextPieceIdx = Math.floor(Math.random() * this.Pieces.length);

        // TODO: Generate a preview of next piece
        var msg : string;
        switch (this.nextPieceIdx) {
            case 0:
                msg = "Long Bar";
                break;
            case 1:
                msg = "Square";
                break;
            case 2:
                msg = "S Piece";
                break;
            case 3:
                msg = "Z Piece";
                break;
            case 4:
                msg = "L Piece";
                break;
            case 5:
                msg = "J Piece";
                break;
            case 6:
                msg = "T Piece";
                break;
            default:
                msg = "UNKNOWN";
        }

        document.querySelector('.info .preview span').textContent = msg;
        document.querySelector('.info .longbar-drought span').textContent = this.longbarDrought.toString();
        document.querySelector('.info .longest-longbar-drought span').textContent = this.longestLongbarDrought.toString();

        // Create the new piece
        this.activePiece = this.Pieces[idx]();
    }

    public static moveLeft() {
        if (Game.isPaused) {
            return;
        }
        this.activePiece.moveLeft();
    }

    public static moveRight() {
        if (Game.isPaused) {
            return;
        }
        this.activePiece.moveRight();
    }

    public static moveDown() {
        if (Game.isPaused) {
            return;
        }
        if (!this.activePiece.moveDown()) {
            this.timer.pause();
            this.generatePiece();
            Game.advance();
        }
    }

    public static drop() {
        if (Game.isPaused) {
            return;
        }
        this.timer.pause();
        while (this.activePiece.moveDown());
        this.advance();
    }

    public static rotateCCW() {
        if (Game.isPaused) {
            return;
        }
        this.activePiece.rotate270();
    }

    public static rotateCW() {
        if (Game.isPaused) {
            return;
        }
        this.activePiece.rotate90();
    }

    public static togglePause() {
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
        } else {
            mainArea.classList.remove('paused');
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

    setupMobileTouchSupport();

    function checkKey(e) {
        e = e || window.event;

        if (e.keyCode == '13') {
            Game.togglePause();
            return;
        // down arrow
        } else if (e.keyCode == '40') {
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

function setupMobileTouchSupport() {
    console.log('hello');
    var startX;
    var startY;
    var xDist;
    var yDist;

    // required min distance travelled to be considered swipe
    const distanceThreshold = 50;

    // Screen must be touched for 50ms to be registered, otherwise it is
    // ignored
    const requiredTime = 50;

    const maxTime = 1000;

    var elapsedTime;
    var startTime = 0;

    var board = document.getElementsByClassName('board')[0];
    if (!(board instanceof HTMLElement)) {
        throw new Error("Couldn't find Board");
    }

    board.addEventListener('touchstart', function(e){
        // Get the touched object
        var touchobj = e.changedTouches[0]

        // Distance is set to 0
        xDist = 0;
        yDist = 0;

        // Find the starting point of the touches
        startX = touchobj.pageX;
        startY = touchobj.pageY;

        // record time when finger first makes contact with surface
        startTime = new Date().getTime();
        e.preventDefault()
    }, false);

    board.addEventListener('touchmove', function(e){
        // prevent scrolling when inside DIV
        e.preventDefault()
    }, false)

    board.addEventListener('touchend', function(e){
        // Get the touched object
        var touchobj = e.changedTouches[0]

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
            } else {
                Game.rotateCW();
            }
        } else if (Math.abs(xDist) > Math.abs(yDist)) {
            xDist < 0 ? Game.moveLeft() : Game.moveRight();
        } else {
            yDist < 0 ? Game.togglePause() : Game.drop();
        }

        e.preventDefault()
    }, false)
}

function htmlToElement(html : string) : ChildNode {
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

function unique(list : number[]) : number[] {
    return list.filter((val, idx, self) => self.indexOf(val) === idx);
}

interface GetOpts {
    lvl: string;
    seed: string;
}

window.onload = function() {
    // alert('HELLO 1');
    addPolyFill();

    var init : GetOpts = {
        'lvl' : '-1',
        'seed': '',
    };

    // Get arguments from URL. We expect a level and seed for the RNG
    const GET_ARGS = location.search.substr(1).split('&').reduce(function(acc, val) {
        var [key, value] = val.split('=');

        if (value === undefined) {
            return acc;
        }

        acc[key] = value;
        return acc;
    }, init);

    var level = parseInt(GET_ARGS.lvl, 10);
    if (isNaN(level)) {
        level = 0;
    } else if (level < 0) {
        // This means that no level was specified. Ask the User for a starting
        // level
        level = parseInt(prompt("Choose a Starting Level (0 through 19):"), 10);
        while (isNaN(level) || level < 0 || level > 19) {
            level = parseInt(prompt("You must enter a level between 0 and 19"), 10);
        }

    }

    var seed : string = GET_ARGS.seed;
    if (seed === '') {
        // If no seed, then generate one
        seed = (Math.random() * 10000000000000000).toString();
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
}
