touch
=====

A cross-browser touch event framework.

Why?
----

I wrote this framework because I could find no framework that did what I needed - that is:
* work across the multitude of mobile browsers;
* supply a small but not bare-metal set of common touch gestures including flicking, pinching, and splaying;
* handle an arbitrary number of touches;
* and not be part of a larger mobile framework.

There's also a bonus point-geometry library in here, because I needed to write that to make the touch framework do its job. Because someone else might need these, I've thrown them up here. Hooray for libraries!

Touch Events Emitted
---------------------
This library emits, at appropriate times:
* click (if your browser doesn't already)
* tap (in case you want a touch-only event)
* flick
* flickup
* flickdown
* flickleft
* flickright
* dragstart
* drag
* dragend
* pinchstart
* pinch
* pinchend
* splaystart
* splay
* splayend

Requirements
------------
This framework does require jQuery and for you to register your touch events using jQuery. It's my eventual goal to not have this be the case, but you know the rest.
