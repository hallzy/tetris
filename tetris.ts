/// <reference path="./polyfill.ts" />

// TODO:
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
const KEY_CODES = {
    // 13 is event.keyCode
    // Enter is event.key
    // ENTER is a common string that both map to so that I can easily use both
    // depending on what the browser supports
    '13':         'ENTER',
    'Enter':      'ENTER',

    '32':         'SPACE',
    ' ':          'SPACE',

    '37':         'LEFT',
    'ArrowLeft':  'LEFT',

    '39':         'RIGHT',
    'ArrowRight': 'RIGHT',

    '40':         'DOWN',
    'ArrowDown':  'DOWN',

    '88':         'X',
    'x':          'X',

    '90':         'Z',
    'z':          'Z',
}

// Types// {{{


type PieceLocation = {
    'row' : number,
    'col' : number,
}

// Type that is used to keep track of the squares used for a piece
type PieceLocations = [
    PieceLocation,
    PieceLocation,
    PieceLocation,
    PieceLocation,
];

// }}}

// Enums// {{{

// Colours that are allowed to be used for cells
enum CellColours {
    NO_COLOUR = '',
    RED       = 'red',
    BLUE      = 'royalblue',
    GREEN     = 'limegreen',
    PINK      = 'palevioletred',
    BROWN     = 'brown',
    ORANGE    = 'darkorange',
    TURQUOISE = 'darkturquoise',
}

// }}}

// Interfaces// {{{

// Interface for the information provided as GET arguments in the URL
interface GetOpts {
    lvl: string;
    seed: string;
}

// }}}

// Extending built in JavaScript classes// {{{

// Extending Array type// {{{

interface Array<T> {
    unique() : any[];
}

// Only keep the unique elements of an array
Array.prototype.unique = function() {
    return this.filter((val, idx, self) => self.indexOf(val) === idx);
}

// }}}
// Extending the Math class// {{{

interface Math {
    seedrandom(string) : void;
}

// }}}
// Extending the Event type// {{{

interface Event {
   getKeyCode() : string;
}

// Get the keycode that is pressed, and return the index of the correct enum
Event.prototype.getKeyCode = function() : string {
    // If the new .key is available use that
    let key : string = null;
    if (this.key !== undefined) {
        key = this.key;
    } else if (this.keyCode !== undefined) {
        key = this.keyCode;
    } else {
        throw new Error("Browser doesn't support event.key, or event.keyCode");
    }

    return KEY_CODES[key];
}

// }}}

// }}}

// Abstract Piece Class// {{{

// This class is contains everything common to all types of pieces
abstract class Piece {
    // Colour of the piece to use
    private colour : CellColours;

    // The cells that this piece takes up
    private cells  : PieceLocations;

    // Default piece as a preview piece
    private boardSelector = '.preview .board';

    public constructor() { }

    // Set the piece to the active piece
    public setActive() : Piece {
        // Set the board selector to the main board
        this.boardSelector = '.mainBoard.board';
        return this;
    }

    // Retrieve the colour of the piece
    private getColour() : CellColours {
        return this.colour;
    }

    protected setColour(colour : CellColours) : boolean {
        this.colour = colour;
        return true;
    }

    // Creates a copy (not a reference) of the piece locations to avoid
    // accidentally modifying the cells. This is only ever 4 cells anyways so
    // not too big if a memory issue.
    public getCells() : PieceLocations {
        return JSON.parse(JSON.stringify(this.cells));
    }

    public setCells(cells : PieceLocations) : boolean {
        this.cells = cells;
        return true;
    }

    // Rotate the piece.
    // The row factors are to do the rotation in the correct direction.
    private rotate(rowFactor : number, colFactor : number) : boolean {
        const cells = this.getCells();

        // First get the origin of rotation
        const origin = cells[1];

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];

            // Find how far this cell is from the origin
            const xdiff = cell.col - origin.col;
            const ydiff = cell.row - origin.row;

            // Part of rotation is to swap the x and y coordinates so do that.
            // The column also needs to be negated to complete the rotation
            let newRow = rowFactor * xdiff;
            let newCol = colFactor * ydiff;

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
    }

    public rotate90() : boolean {
        return this.rotate(-1, 1);
    }

    public rotate270() : boolean {
        return this.rotate(1, -1);
    }

    public erase() : boolean {
        const cells = this.getCells();
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];

            const selector = this.boardSelector + ' .r' + cell.row + ' > .c' + cell.col;
            const element = document.querySelector(selector);
            if (element instanceof HTMLElement) {
                element.style.backgroundColor = '';
            }
        }
        return true;
    }

    public draw() : boolean {
        const cells = this.getCells();
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];

            const selector = this.boardSelector + ' .r' + cell.row + ' > .c' + cell.col;
            const element = document.querySelector(selector);
            if (!(element instanceof HTMLElement)) {
                continue;
            }

            element.style.backgroundColor = this.getColour();
        }
        return true;
    }

    // true => Collision Detected
    // false => No Collision Detected
    public collisionDetect(row : number, col : number) : boolean {
        // The row and column have to be within bounds
        if (row < 1 || col < 1 || col > 10) {
            return true;
        }

        const selector = '.r' + row + ' > .c' + col;
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) {
            // If board cell doesn't exist, then no collision. This could happen
            // if you rotate at the top of the board
            return false;
        }

        this.erase();
        const colour = element.style.backgroundColor;
        this.draw();

        // Square is not empty, so it is occupied.
        if (colour !== '') {
            return true;
        }

        return false;
    }

    public moveLeft() : boolean {
        const cells = this.getCells();
        // Make sure we have room to move left
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (this.collisionDetect(cell.row, cell.col - 1)) {
                return false;
            }
            cells[i].col--;
        }

        this.erase();
        this.setCells(cells);
        return this.draw();
    }

    public moveRight() : boolean {
        const cells = this.getCells();
        // Make sure we have room to move right
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (this.collisionDetect(cell.row, cell.col + 1)) {
                return false;
            }
            cells[i].col++;
        }

        this.erase();
        this.setCells(cells);
        return this.draw();
    }

    public moveDown() : boolean {
        const cells = this.getCells();
        // Make sure we have room to move down
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (this.collisionDetect(cell.row - 1, cell.col)) {
                return false;
            }
            cells[i].row--;
        }

        this.erase();
        this.setCells(cells);
        return this.draw();
    }
}

// }}}

// LongBar Class// {{{
class LongBar extends Piece {
    private orientation = 'horziontal';

    public constructor() {
        super();
        this.setColour(CellColours.RED);
        this.setCells([
            {'row' : 20, 'col' : 4},
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6}, // This is the axis of rotation I am using
            {'row' : 20, 'col' : 7},
        ]);
    }

    // Rotate CCW just does the exact same thing that rotate90 does
    public rotate270() : boolean {
        return this.rotate90();
    }

    public rotate90() : boolean {
        const cells = this.getCells();

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
        const origin = cells[2];

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];

            // Find how far this cell is from the origin
            const xdiff = cell.col - origin.col;
            const ydiff = cell.row - origin.row;

            // Part of rotation is to swap the x and y coordinates so do that.
            let newRow = xdiff;
            let newCol = ydiff;

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
    }
}

// }}}

// Square Class// {{{
class Square extends Piece {

    public constructor() {
        super();
        this.setColour(CellColours.BLUE);
        this.setCells([
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6},
            {'row' : 19, 'col' : 5},
            {'row' : 19, 'col' : 6},
        ]);
    }

    // Square doesn't rotate
    public rotate270() : boolean {
        return true;
    }
    public rotate90() : boolean {
        return true;
    }
}

// }}}

// S and J Abstract Class// {{{
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
        const cells = this.getCells();
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
        const origin = cells[1];

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];

            // Find how far this cell is from the origin
            const xdiff = cell.col - origin.col;
            const ydiff = cell.row - origin.row;

            // Part of rotation is to swap the x and y coordinates so do that.
            let newRow = xdiff;
            let newCol = ydiff;

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
    }
}

// }}}

// S Piece Class// {{{
class SPiece extends SJPieces {
    public constructor() {
        super();
        this.setColour(CellColours.GREEN);
        this.setCells([
            {'row' : 20, 'col' : 7},
            {'row' : 20, 'col' : 6}, // This square is the axis of rotation when
                                     // horizontal for CCW, and CW for vertical
            {'row' : 19, 'col' : 6},
            {'row' : 19, 'col' : 5},
        ]);
    }
}

// }}}

// Z Piece Class// {{{
class ZPiece extends SJPieces {
    public constructor() {
        super();
        this.setColour(CellColours.PINK);
        this.setCells([
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6}, // This square is the axis of rotation when
                                     // horizontal for CCW, and CW for vertical
            {'row' : 19, 'col' : 6},
            {'row' : 19, 'col' : 7},
        ]);
    }
}

// }}}

// L Piece Class// {{{
class LPiece extends Piece {
    public constructor() {
        super();
        this.setColour(CellColours.BROWN);
        this.setCells([
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6}, // This is axis of rotation
            {'row' : 20, 'col' : 7},
            {'row' : 19, 'col' : 5},
        ]);
    }
}

// }}}

// J Piece Class// {{{
class JPiece extends Piece {

    public constructor() {
        super();
        this.setColour(CellColours.ORANGE);
        this.setCells([
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6},
            {'row' : 20, 'col' : 7},
            {'row' : 19, 'col' : 7},
        ]);
    }
}

// }}}

// T Piece Class// {{{
class TPiece extends Piece {

    public constructor() {
        super();
        this.setColour(CellColours.TURQUOISE);
        this.setCells([
            {'row' : 20, 'col' : 5},
            {'row' : 20, 'col' : 6},
            {'row' : 20, 'col' : 7},
            {'row' : 19, 'col' : 6},
        ]);
    }
}

// }}}

// Pausable Timer Class// {{{
class Timer {
    // The ID of the timer so that we can clear it if needed
    private timerId : number;

    // The timestamp that the timer was started at
    private start : number;

    // The time remaining when the timer is paused
    private remaining : number;

    // A function to call when the timer runs out
    private callback : Function;

    // Same signature as a normal timeout... Take a callback that will be
    // executed when the timer runs out, and a delay to wait before executing it
    public constructor(callback : Function, delay : number) {
        this.remaining = delay;
        this.callback = callback;

        this.timerId = null;

        // Start the timer
        this.resume();
    }

    // pause the timer
    public pause() {
        // Clear the timeout
        window.clearTimeout(this.timerId);
        this.timerId = null;

        // Find out how much time is remaining for when we resume
        this.remaining -= Date.now() - this.start;
    };

    // Resume the timer
    public resume() {
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
};

// }}}

// Game class// {{{
class Game {
    // Array of functions to create new pieces
    private static Pieces = [
        () => new LongBar(),
        () => new Square(),
        () => new SPiece(),
        () => new ZPiece(),
        () => new LPiece(),
        () => new JPiece(),
        () => new TPiece(),
    ];

    // This is used to keep track of how many lines the user has cleared so far.
    // This is used in order to show this stat, but also to track what level the
    // user should be on
    private static lines : number = 0;

    // The level that the user is currently on. This is used for both visual
    // information, but also to know how fast the pieces should move
    private static level : number;

    // The level that the user started on. This needs to be kept because we need
    // to know this in order to figure out how many lines you need to clear to
    // advance to the next level after your starting level
    private static startLevel : number;

    // This is the currently active piece that the user is moving
    private static activePiece : Piece = null;

    // This is the piece that will be active next (we track this so that we can
    // display it in the piece preview area)
    private static nextPiece : Piece = null;

    // Keep track of how long the current longbar drought is, for statistical
    // purposes
    private static longbarDrought : number = 0;

    // Keep track of how long your longest long bar drought was for statistical
    // purposes
    private static longestLongbarDrought : number = 0;

    // This is the timer for gravity
    private static gravity : Timer;

    // Keep track of the users score
    private static score : number = 0;

    // Track the game state. ie, whether it is paused, and whether it is active.
    // Active means, is the game playable, or is the game over
    public static isPaused : boolean = false;
    public static isActive : boolean = true;

    // Function to start the game
    public static start(startLevel : number) : void {
        // Set the starting level
        Game.startLevel = startLevel;
        Game.level = startLevel;

        // Update the level shown to the user
        Game.updateLevel();

        // Generate the starting piece
        Game.generatePiece();

        Game.updateLongBarStats();

        Game.nextPiece.draw();
        Game.activePiece.draw();

        // Advance the game so that the timer to move the piece down starts
        Game.gravity = new Timer(Game.advance, Game.getSpeed());

        // Pause the game to start with
        Game.togglePause();
    }

    // Add points to the Games score variable according to the number of lines
    // cleared
    private static addPointsForLinesCleared(linesScored : number) : void {
        // If you cleared less than 1 lines then why is this even being called?
        // If you cleared more than 4 then something has gone terribly wrong
        if (linesScored < 1 || linesScored > 4) {
            throw new Error("Tried to update the score with " + linesScored + " scored lines.");
        }

        // These are the base points for lines clears depending on how many
        // lines were cleared
        const basePoints = [
            40,    // Clearing 1 line gets you 40 points * the level multiplier
            100,   // etc
            300,
            1200,
        ];

        // The final score added is the base points multiplied by your
        // (level + 1)
        Game.score += (Game.level + 1) * basePoints[linesScored - 1];
    }

    // Update the score element on the page for the user to see
    private static updateScoreElem() : void {
        // Find the score element on the page
        const scoreElem = document.getElementById('score');
        if (!(scoreElem instanceof HTMLElement)) {
            throw new Error("Could not find score element");
        }

        // Add the score to the element
        scoreElem.textContent = Game.score.toString();
    }

    // Remove completed lines
    private static removeCompleteLines(rows : HTMLElement[], runAfterAnimation : Function) : void {
        function deleteRows() {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i].remove();
            }

            runAfterAnimation();
        }

        // The animation will start at the middle and clear the lines from the
        // middle out and then delete the rows. So, I will actually need to get
        function animateBg(i1 : number = 4, i2 : number = 5) {
            if (i1 < 0 || i2 >= 10) {
                deleteRows();
                return;
            }


            for (let k = 0; k < rows.length; k++) {
                const col1 = rows[k].children[i1];
                const col2 = rows[k].children[i2];

                if (!(col1 instanceof HTMLElement)) {
                    throw new Error("Failed to clear row. col1 doesn't exist.");
                }

                if (!(col2 instanceof HTMLElement)) {
                    throw new Error("Failed to clear row. col2 doesn't exist.");
                }

                col1.style.backgroundColor = '';
                col2.style.backgroundColor = '';
            }

            // The delay when clearing lines is 17 to 20 frames in NES tetris.
            // at 60 FPS, that is about 333 ms. Since this animation takes 4
            // iterations make each iteration 80 ms fora total of 80*4=320
            setTimeout(() => {
                animateBg(i1 - 1, i2 + 1)
            }, 80);
        }

        animateBg();
    }

    // Handle when a piece hits the bottom
    private static handlePieceHitsBottom(runAfterLineClearCleanup : Function) : void {
        // The only rows you need to check are the ones affected by the
        // final position of the last placed piece... So I will get those rows
        // here

        // Get the cells for the active piece.
        // Take that and create an array of just the row numbers
        // Then only keep unique rows so I don't have duplicates
        const rowsToCheck = Game.activePiece.getCells().map(el => (el.row)).unique();

        let completedRows: HTMLElement[] = [];

        let isRowComplete = false;

        // Check each row that the last piece affected
        for (let i = 0; i < rowsToCheck.length; i++) {
            // Find the row on the board
            const row = document.querySelector('.mainBoard.board .row.r' + rowsToCheck[i]);
            if (!(row instanceof HTMLElement)) {
                throw new Error("Couldn't find Row " + rowsToCheck[i] + " (idx " + i  + ")");
            }

            // Retrieve the number of cells on that row that were filled by
            // getting the row children (which are the squares in that row) and
            // filter that to make sure that none of the squares have no colour.
            const numFilledCells = Array.from(row.children).filter((cell, j) => {
                if (!(cell instanceof HTMLElement)) {
                    throw new Error("Couldn't find column index " + j + " in row idx " + i);
                }

                return cell.style.backgroundColor !== '';
            }).length;

            // If the number of filled cells is 10, then that row is filled and
            // can be removed
            if (numFilledCells === 10) {
                // That is 1 additional completed row
                completedRows.push(row);
            }
        }

        // If we completed a row, then we need to updated the score, the number
        // of lines cleared, and possibly the level that the user is on
        if (completedRows.length <= 0) {
            runAfterLineClearCleanup();
            return;
        }

        Game.addPointsForLinesCleared(completedRows.length);
        Game.updateLines(completedRows.length);
        Game.updateLevel();

        // Have to provide a callback here so that this doesn't execute until I
        // reach a certain point in this function call. I hate JavaScript for
        // this.
        Game.removeCompleteLines(completedRows, () => {
            // We have now removed all complete lines. Insert the number of
            // removed lines to the top now. And add the c1 to c10 classes to each
            // column
            for (let i = 0; i < completedRows.length; i++) {
                // This is a row, so add this to the top the correct number of times
                const rowHTML = `
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
            `;

                // Find the board
                const board = document.querySelector('.mainBoard.board');
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
            const rows = document.querySelectorAll('.mainBoard.board .row');
            for (let i = rows.length - 1, count = 1; i >= 0; i--, count++) {
                const row = rows[i];
                if (!(row instanceof HTMLElement)) {
                    throw new Error("Couldn't find Row index " + i);
                }

                // Add the rx class to the row
                row.classList.add('r' + count);
            }

            runAfterLineClearCleanup();
        });
    }

    // Advance the game
    private static advance() : void {
        // If the active piece can be moved down, then it is moved down and
        // the game is advanced again
        if (Game.activePiece.moveDown()) {
            // If the active piece can't be moved down then we have bottomed
            // out.
            Game.updateScoreElem();

            // Run the advance after a which is determined by your level
            Game.gravity = new Timer(Game.advance, Game.getSpeed());

            return;
        }

        // Find and remove finished lines
        // Because there is an asynchronous part in a nested function, I need to
        // have a callback so that I can actually make this work because JS
        // doesn't have synchronous sleeps...
        Game.handlePieceHitsBottom(() => {
            Game.nextPiece.erase();

            // Generate a new piece
            Game.generatePiece();

            // Check if the user has lost the game
            if (Game.isLost()) {
                // TODO: Show a message and a way to reset the game
                alert("You Lost");
                return;
            }

            Game.nextPiece.draw();
            Game.activePiece.draw();

            Game.updateLongBarStats();

            Game.updateScoreElem();

            // Run the advance after a which is determined by your level
            Game.gravity = new Timer(Game.advance, Game.getSpeed());
        });

    }

    // Check if the game has been lost
    // This function call assumes that the active piece has just been generated
    // and is going to be placed at the top of the board, but hasn't been drawn
    // yet
    // TODO: I don't like that for this function to work that it assumes so
    // much...
    private static isLost() : boolean {
        // Get the cells for the active piece and loop through them all
        const cells = Game.activePiece.getCells();
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];

            // Find the cell element
            const selector = '.r' + cell.row + ' > .c' + cell.col;
            const element = document.querySelector(selector);
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
    }

    private static updateLongBarStats() : void {
        // If the new active piece will be a longbar, then reset the drought to
        // 0, otherwise add 1.
        Game.longbarDrought = (Game.activePiece instanceof LongBar) ? 0 : Game.longbarDrought + 1;

        // If Game drought is longer than the longest drought, then this is the
        // new longest drought
        if (Game.longbarDrought > Game.longestLongbarDrought) {
            Game.longestLongbarDrought = Game.longbarDrought;
        }

        // Update the longbar drought info on the screen
        document.querySelector('.info .longbar-drought h1').textContent = Game.longbarDrought.toString();
        document.querySelector('.info .longest-longbar-drought h1').textContent = Game.longestLongbarDrought.toString();
    }

    public static generatePiece() {
        // If we don't have a piece, then generate a new one
        if (Game.nextPiece === null) {
            const idx = Math.floor(Math.random() * Game.Pieces.length);
            Game.activePiece = Game.Pieces[idx]();
        } else {
            // If we did have a next piece already, then erase it from the
            // preview
            Game.nextPiece.erase();

            // Active piece is the next piece
            Game.activePiece = Game.nextPiece;
        }

        // The preview piece is now the active piece
        Game.activePiece.setActive();

        // Get the index for the next piece and generate it
        const nextPieceIdx = Math.floor(Math.random() * Game.Pieces.length);
        Game.nextPiece = Game.Pieces[nextPieceIdx]();
    }

    // User wants to move the piece left
    public static moveLeft() {
        // If the game is lost or paused don't move
        if (Game.isPaused || !Game.isActive) {
            return;
        }

        Game.activePiece.moveLeft();
    }

    // User wants to move the piece right
    public static moveRight() {
        // If the game is lost or paused don't move
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        Game.activePiece.moveRight();
    }

    // User wants to move the piece down
    public static moveDown() {
        // If the game is lost or paused don't move
        if (Game.isPaused || !Game.isActive) {
            return;
        }

        // Try to move down.
        if (!Game.activePiece.moveDown()) {
            // If couldn't move down then pause gravity because there is no
            // point in having the game try and move the piece as well
            Game.gravity.pause();

            // Advance the game instantly
            Game.advance();
        }
    }

    // User wants to drop the piece
    public static drop() {
        // If the game is lost or paused don't move
        if (Game.isPaused || !Game.isActive) {
            return;
        }

        // Pause gravity because there is no point if we are dropping
        Game.gravity.pause();

        // While we drop rows we need to add to a counter for scoring points
        let points = 0;
        while (Game.activePiece.moveDown()) {
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
        Game.advance();
    }

    // User wants to rotate CCW
    public static rotateCCW() {
        // Don't allow a rotation if the game is paused or lost
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        Game.activePiece.rotate270();
    }

    // User wants to rotate CW
    public static rotateCW() {
        // Don't allow a rotation if the game is paused or lost
        if (Game.isPaused || !Game.isActive) {
            return;
        }
        Game.activePiece.rotate90();
    }

    // User wants to pause the game
    public static togglePause() {
        // Don't allow a pause of the game was lost
        if (!Game.isActive) {
            return;
        }

        // Reverse the variable for future calls
        Game.isPaused = !Game.isPaused;

        // Find the parent element of the game
        const mainArea = document.getElementsByClassName('mainArea')[0];
        if (!(mainArea instanceof HTMLElement)) {
            throw new Error("Couldn't find mainArea");
        }

        // Find the pause banner
        const pauseBanner = document.getElementsByClassName('pause_banner')[0];
        if (!(pauseBanner instanceof HTMLElement)) {
            throw new Error("Couldn't find PauseBanner");
        }

        // If we are now paused
        if (Game.isPaused) {
            // Pause gravity, show the pause banner and lighten the background
            Game.gravity.pause();
            mainArea.classList.add('paused');
            pauseBanner.classList.remove('hidden');
        } else {
            // If unpaused, then hide the pause banner, darken the background,
            // and resume gravity
            mainArea.classList.remove('paused');
            pauseBanner.classList.add('hidden');
            Game.gravity.resume();
        }
    }

    // Update the number of lines the user has completed
    // Also updates the element on the page to tell the user
    public static updateLines(completedLines : number) {
        // Find the element on the page to show the lines
        const linesElem = document.getElementById('lines');
        if (!(linesElem instanceof HTMLElement)) {
            throw new Error("Could not find level element");
        }

        // Add the number of completed lines to our lines total
        Game.lines += completedLines;

        // Update the element on the page
        linesElem.textContent = Game.lines.toString();
    }

    // Update the level, and level element on the page
    public static updateLevel() {
        // Find the level element
        const levelElem = document.getElementById('level');
        if (!(levelElem instanceof HTMLElement)) {
            throw new Error("Could not find level element");
        }

        // If the lines we have are higher than the line target for the current
        // level, then increase the level
        if (Game.lines >= Game.getLineTarget()) {
            Game.level++;
        }

        // Set the level element on the page
        levelElem.textContent = Game.level.toString();
    }

    // Calculate the speed of gravity for the user's current level
    public static getSpeed() : number {
        if (Game.level <= 8) {
            // Per NES Tetris, the speed of level 0 is 48 frames per grid. This
            // calculation converts that to milliseconds given that NES tetris ran
            // at 60 FPS.

            // Every level higher than 0 up to level 8 reduces the frames per grid
            // by 5.
            return Math.floor((48 - (Game.level*5)) / 60 * 1000);
        }

        // If level is higher than 8, then the speed is calculated differently
        // Level 9 is 6 'frames'
        // Level 10, 11, and 12 is 5 'frames'
        // Level 13, 14, and 15 is 4 'frames'
        // Level 16, 17, and 18 is 3 'frames'

        // Starting at frames per grid
        let speed = 1;

        switch(Game.level) {
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
        if (Game.level >= 19 && Game.level <= 28) {
            speed++;
        }

        // Everything 29 and over is 1 frame

        // Convert the 'frame' speed to ms
        return speed / 60 * 1000;
    }

    // Find the target number of lines to advance to the next level
    public static getLineTarget() : number {
        // If this is the starting level, this is apparently the calculation to
        // determine how many lines you need to advance to your second level.
        let lineTarget = Math.min((Game.startLevel * 10 + 10), Math.max(100, (Game.startLevel * 10 - 50)));

        // This adds on 10 extra lines for every level past your starting level
        // you are
        lineTarget += (Game.level - Game.startLevel) * 10;

        return lineTarget;
    }
}

// }}}

// Function to setup the user's keys// {{{
const setupUserKeys = () => {
    // NES Tetris has a DAS delay of 16 frames and an ARR delay of 6 frames. At
    // 60 FPS, that is 267ms and 100ms respectively
    const startDAS = (func : Function, dasTime : number = 267, arrTime : number = 100) => {
        // Move immediately after pressing the button
        func();

        // Wait the DAS delay before moving again
        dasTimeout = window.setTimeout(() => {
            func();

            // Once DAS is up, move at the ARR speed after that until released
            arrInterval = window.setInterval(func, arrTime);
        }, dasTime);
    }

    const keyUp = (e) => {
        // If the released key is not saved as the pressed key, then ignore
        if (e.getKeyCode() !== pressedKey) {
            return;
        }

        // Reset the pressed key
        pressedKey = null;

        // Clear the timers so that they keys aren't pressed again
        clearTimeout(dasTimeout);
        clearInterval(arrInterval);
    }

    // Function to handle keypresses
    const keyDown = (e) => {
        e = e || window.event;

        const keyCode = e.getKeyCode();

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
            startDAS(() => { Game.moveDown(); }, 50, 50);
        } else if (keyCode === 'LEFT') {
            startDAS(() => { Game.moveLeft(); });
        } else if (keyCode === 'RIGHT') {
            startDAS(() => { Game.moveRight(); });
        }
    }

    document.onkeydown = keyDown;

    // Keyup event is used to help determine if the key is being held down. The
    // only keys I really care about for this are the left and right arrows, and
    // the down arrow
    document.onkeyup = keyUp;

    setupMobileTouchSupport();

    // Keep track of what keys are current down
    // This maps the keycode to true so it is easy to lookup
    let pressedKey : string = null;

    let dasTimeout : number;
    let arrInterval : number;
}
// }}}

// Function to setup mobile touch support// {{{
const setupMobileTouchSupport = () => {
    // The starting location in the X and Y planes of a touch
    let startX : number;
    let startY : number;

    // The distance the touch gesture has moved
    let xDist : number;
    let yDist : number;

    // required min distance travelled to be considered swipe or touch movement
    const distanceThreshold : number = 50;

    // If something happens that causes us to want to skip the touchend event,
    // then set this to true
    let cancelTouchEnd : boolean = false;

    // Find the board
    const board = document.querySelector('.mainArea');
    if (!(board instanceof HTMLElement)) {
        throw new Error("Couldn't find Board");
    }

    // Add the touch start event handler
    board.addEventListener('touchstart', (e) => {
        // Get the touched object
        const touchobj = e.changedTouches[0]

        // Start with the cancelling of touch end to false
        cancelTouchEnd = false;

        // Distance is set to 0
        xDist = 0;
        yDist = 0;

        // Find the starting point of the touches
        startX = touchobj.pageX;
        startY = touchobj.pageY;

        // record time when finger first makes contact with surface
        e.preventDefault()
    }, false);

    // Event handler for moving your finger
    board.addEventListener('touchmove', (e) => {
        // prevent scrolling when inside DIV
        e.preventDefault()

        // Get the touched object
        const touchobj = e.changedTouches[0]

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
    }, false)

    // Touch end handler
    board.addEventListener('touchend', (e) => {
        e.preventDefault()

        // If we specified to cancel the touch end, then do nothing
        if (cancelTouchEnd) {
            return;
        }
        // Get the touched object
        const touchobj = e.changedTouches[0]

        // get total dist travelled by finger while in contact with surface
        xDist = touchobj.pageX - startX;
        yDist = touchobj.pageY - startY;

        // If The distance your finger travelled didn't exceed the threshold in
        // either the X or Y direction, then assume a screen tap, and rotate the
        // piece
        if (Math.abs(xDist) < distanceThreshold && Math.abs(yDist) < distanceThreshold) {
            Game.rotateCW();
        } else {
            // Otherwise either pause or drop
            yDist < 0 ? Game.togglePause() : Game.drop();
        }
    }, false)
}

// }}}

// Function to convert an HTML string to a ChildNode type// {{{
const htmlToElement = (html : string) : ChildNode => {
    // Create a template element
    const template = document.createElement('template');

    // Trim the HTML just in case
    html = html.trim();

    // Set the HTML of the template to what our string is
    template.innerHTML = html;

    // Return the first child of the template
    return template.content.firstChild;
}

// }}}

window.onload = () => {
    // alert('HELLO 1');

    // Add polyfill functionality
    addPolyFill();

    // Initialize our GET options
    const init : GetOpts = {
        'lvl' : '-1',
        'seed': '',
    };

    // Get arguments from URL. We expect a level and seed for the RNG
    const GET_ARGS = location.search.substr(1).split('&').reduce((acc, val) => {
        const [key, value] = val.split('=');

        // If no value, then ignore
        if (value === undefined) {
            return acc;
        }

        acc[key] = value;
        return acc;
    }, init);

    // Get the level as an integer
    let level = parseInt(GET_ARGS.lvl, 10);
    if (isNaN(level) || level < 0) {
        // This could happen if someone messes with the URL, or if there just
        // wasn't a level in the URL, so ask the user
        level = parseInt(prompt("Choose a Starting Level (0 through 19):"), 10);
        while (isNaN(level) || level < 0 || level > 19) {
            level = parseInt(prompt("You must enter a level between 0 and 19"), 10);
        }
    }

    // Get the seed from the URL
    let seed : string = GET_ARGS.seed;
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
}
