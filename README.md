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
- Rotating pieces at the top of the board doesn't work, probably due to
  collision detection not letting things go off the top of the screen.
- Show a preview of the next piece
- Some sort of animation for clearing lines so it isn't so abrupt
- Seems to take some time to clear lines... What is causing that delay?
- Change colour of placed pieces to a Gray or something?
- Show statistics:
    - Current long bar drought
    - Longest long bar drought
    - The count of each piece that you have seen
- There seems to be a delay at lower levels to get the next piece generated.
  I would like that to be quicker
- Add instructions somewhere
- Add a way to specify the starting level
- Better Mobile swipe/touch support
    - Maybe use the touchmove event to have the piece track the users finger
      instead of having swipes
- Have a way to create unique games that can be replayed with the same
  sequence of pieces and keep track of scores on that particular game
