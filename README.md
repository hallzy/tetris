# DISCLAIMER

This project is still be actively developed and I use the below 'Play Here'
link for testing, so it may happen that the link doesn't work sometimes for now,
or will spit out debug messages.

This is because I am trying to get this to work on old mobile devices as well
(iOS 7 for example) and testing on mobile is quite the pain when frontend code
breaks because there is no console I can look at... So, I resort to alerts to
see where it breaks on those devices.

I hope to be done with testing mobile soon.

# Tetris

My Tetris project written with TypeScript.
[Play Here](https://hallzy.github.io/tetris/index.html)

This game is intended to work on mobile devices using swipe gestures as well.

This was largely intended as a side project as something to do, but I'd like to
do something which seems to be original.

My intention here is to build a modern web based version of the classic NES
Tetris game, because it seems to be one of the more pure and classic versions of
a classic game.

Some specifics of NES Tetris are:

* No hold feature, you play what you are given
* The pieces are randomly generated (a lot of modern Tetris games guarantee that
  each piece will show up within the next 7 or so pieces, while NES Tetris is
  random and you may not see a piece for a long time.)
* Only a preview of the next piece instead of the next 3, 4, 5, or more
* The scoring is all the same
    * 40 points for clearing 1 line
    * 100 points for clearing 2 lines
    * 300 points for clearing 3 lines
    * 1200 points for a tetris
    * Each of these points is multiplied by your current level + 1 and added to
      your point total.
    * You can also get points for pressing the down button to drop a piece
      faster, but the scoring for that is actually kind of weird and
      complicated, so I will explain that later below.
* The speed of levels is the same. The speed of NES Tetris was actually based on
  the frame rate. Level 0 is where a piece stays in the same grid for 48 frames
  for example. North American NES Tetris ran at very close to 60 FPS, so at level
  0 the pieces drop at a rate of 0.8 seconds per square. The frames per grid drops
  by 5 ever level up to level 8 and then it starts to change. If you want more
  specifics on that, read up on it or look at the code here.

Something I plan to add at some point is the ability to give a friend the URL to
your game that you are currently playing, and your friend can play the same game
as you (the same starting level, and the exact same series of randomly generated
pieces). That way you can compete and compare fairly with others and friends. I
would like to have top scores for that particular game posted on the page as
well so you can see how others compare.

This was inspired by the Classic Tetris World Championships (CTWC), which works
in a similar way where they play NES Tetris on original NES systems, but there
is some sort of modification to to game such that 2 competing players are
guaranteed the same sequence of pieces to be as fair as possible.

I haven't seen anything online that does this, so I thought I could kill some
time and do it myself.

## Scoring

As stated, I have tried my best to make the scoring as similar as possible to
the original game.

You get:

* 40 points for clearing 1 line
* 100 points for clearing 2 lines
* 300 points for clearing 3 lines
* 1200 points for clearing 4 lines (scoring a Tetris)

You also get points when you press down to drop a piece faster, and as mentioned
earlier, the rules for this are pretty complicated

* You only get points when you hold down the drop button and the piece actually
  hits the bottom or another piece. If you press the button or only hold it down
  part way and then let go, you don't get any points
* Due to a bug in the code, the most points you can get for a drop is 15. I will
  explain the bug below
* With the exception of the case where the bug crops up, you get 1 point for
  each square that you drop the piece.

The bug seems to be that the 1's digit of the hexadecimal number that counts the
rows is added correctly to the score, but the 16's digit is not, and is added as
if it is the 10's digit.

As an example, 0x0E is 14 in decimal. The E is added correctly to your score
which is then displayed as an increase of 14. The 0 doesn't do anything because
it is a 0.

If we have 0x12, this is 18 in decimal. You add the 2 which works correctly and
that is added to your score, but the 1 is added as a 10 instead of a 16, so you
get 12 points instead of 18.

Because there are only 20 rows in the game, score should range from 0x00 to 0x14
(or 0 to 20), and because of this limitation, it is probably reasonable to
assume that a rule to follow is that if the 16's digit is a 0, you convert the
number to decimal and that is your score. If the 16's digit is a 1, then your
decimal score is basically just taking off the `0x` from the number and using it
as is.

So, that is what I will do for this game.

The main difference is that NES Tetris doesn't have a 'drop' button but a down
button which just moves the piece down 1 cell at a time. This game has a drop
button for convenience but also a down button. Because the behaviour of NES
Tetris is that the piece actually has to be dropped, I will only add points if
the drop key is pressed, not the down arrow.

## Code and Files

I use the Makefile to easily build the JS files from the TypeScript code, and
then run a script to increment version counts on script references.

I have been having issues with caching on mobile devices particularly so I
wanted to automate the update of the names of the JS file references.

The polyfill file is just for polyfills I need if I run into problems with
JavaScript that can't be run on older devices that I am trying to support. The
code in those files is not mine, they are taken from the internet.

seedrandom.min.js is also not mine, that belongs to David at
[davidbau.com](http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html)

I use seedrandom to assist with the ability to randomly generate the same set of
pieces for a given URL. Because JavaScript doesn't have a way to seed the random
number generator, it is basically impossible to accomplish this without
something that will let me seed the generator with something constant. Hence,
the need for this project.

All other code in this project is mine, and written by me. The tetris.js file is
just a generation of the tetris.ts file, but I need the JS file here in order
for the website to work.

I do have 2 TypeScript errors currently which I can't figure out how to get rid
of. One is it complaining about the 'console' because it conflicts with a type
definition I have installed for Google App Scripts for some reason that I have
not been able to figure out.

The second is telling me that 'seedrandom' doesn't exist inside of 'Math' even
though it does and I have the type definitions for it. So unless the type
definitions are wrong, I am not sure why this is happening. In either case, I
know that it is, so I am choosing to ignore it.

If you are reading this and know how to fix either of these errors, please let
me know and/or submit a pull request. I'd love to have that fixed and use it as
a learning opportunity.

## TODO

I have a list of features I want to add still, and bugs that I have noticed
which I need to address, or just other issues.

- See if I can reduce the delay when holding down the arrow keys
- Some sort of animation for clearing lines so it isn't so abrupt
- Change colour of placed pieces to a Gray or something?
- Show statistics:
  - The count of each piece that you have seen
- Add instructions somewhere
- Better Mobile swipe/touch support
  - Maybe use the touchmove event to have the piece track the users finger
    instead of having swipes
- Ability to restart after losing
- Save highscores and show the high scores for a particular game sequence and
  start level
