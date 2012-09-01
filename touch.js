(function () {
	/* supportsEvent(eventType): checks to see if a given event is supported.
	 * eventType (string): the event to check for.
	 * returns (Boolean): whether eventType is supported in this browser.
	 */
	var supportsEvent = function(eventType) {
		eventType = eventType.toString();
		
		var testDiv = document.createElement('div');
		
		if('on' + eventType in testDiv) {
			return true;
		} else {
			testDiv.setAttribute(eventType, 'return;');
			return (typeof testDiv[eventType] === 'function');
		}
	};
	
	if(! supportsEvent('touchstart')) {
		// You don't support touch events. You have no need to load this code.
		return;
	}

	// Self-executing function encloses private touch functions.
	// Yeah, go on, make your jokes. You're 12, you know that?

	var MAX_TAP_DURATION_E = 50/*ms*/,
		MAX_TAP_DISTANCE_E = 5/*px*/,
		MAX_FLICK_DURATION = 150/*px*/,
		MAX_FLICK_VARIANCE = 15/*°*/;

	var touchStates;
	(function () {
		/* touchstate(touch, jEvent): makes an object that tracks a touchpoint.
		 * touch (Touch): the touch to store information for.
		 * jEvent (jQuery Event): the jQuery event where this touch was first enountered.
		 * returns (touchstate): a touchstate object that tracks the given touch.
		 */
		var touchstate = function(touch, jEvent) {
			/* touchstate object: keeps history and state for a particular touchpoint.
			 */
			return {
				/* identifier (Number): this touchpoint's identifier, as given by the browser.
				 */
				identifier: touch.identifier,
				/* target (Element): the element where this touchpoint was first set down.
				 */
				target: jEvent.target,
				/* dragged (Boolean): whether this touchpoint is participating in a drag.
				 */
				dragged: false,

				/* tStart (Number): when this touchpoint was first set down, in milliseconds since the epoch.
				 */
				tStart: jEvent.timeStamp,
				/* tLast (Number): when this touchpoint was last updated, in milliseconds since the epoch.
				 */
				tLast: jEvent.timeStamp,
				/* duration(): calculates how long this touchstate has been active.
				 * returns (Number): how long this touchstate has been active in milliseconds.
				 */
				duration: function () {
					return this.tLast - this.tStart;
				},

				/* xStart (Number): the x-coordinate on the screen where the touchpoint was when it was first set down.
				 */
				xStart: touch.clientX,
				/* xLast (Number): the x-coordinate on the screen where the touchpoint was when it was last updated.
				 */
				xLast: touch.clientX,
				/* xDistance(): calculates how far this touchpoint has moved horizontally.
				 * returns (Number): how many pixels this touchpoint has moved horizontally.
				 */
				xDistance: function () {
					return this.xLast - this.xStart;
				},

				/* yStart (Number): the y-coordinate on the screen where the touchpoint was when it was first set down.
				 */
				yStart: touch.clientY,
				/* yLast (Number): the y-coordinate on the screen where the touchpoint was when it was last updated.
				 */
				yLast: touch.clientY,
				/* yDistance(): calculates how far this touchpoint has moved vertically.
				 * returns (Number): how many pixels this touchpoint has moved vertically.
				 */
				yDistance: function () {
					return this.yLast - this.yStart;
				},

				/* distance(): calculates how far this touchpoint has moved.
				 * returns (Number): how many pixels this touchpoing has moved.
				 */
				distance: function () {
					return PointGeometry.point(this.xStart, this.yStart).distanceTo(PointGeometry.point(this.xLast, this.yLast));
				},
				/* heading() : calculates the angle this touchpoint moved from its origin.
				 * returns (Number): the angle from this touchpoint's origin to its current position in degrees on the range [0, 360).
				 */
				heading: function () {
					// 0 degrees is straight right, like in the unit circle
					// hip hip huzzah for trig!
					// why is yDistance negated? because in the browser, 0 is at the top and positive is as you go down the page
					var degrees = Math.atan2(-this.yDistance(), this.xDistance()) * 180 / Math.PI;
					if (degrees < 0) {
						degrees += 360;
					}

					return degrees;
				},

				/* _update(touch, jEvent): updates this touchpoint with new information. Don't use this function yourself!
				 * touch (Touch): the touch information from the event.
				 * jEvent (jQuery Event): the jQuery event where this touch was updated.
				 */
				_update: function (touch, jEvent) {
					if (this.identifier !== touch.identifier) {
						throw 'touchstate._update: tried to update state for a different touch (identifiers did not match).';
					}

					this.tLast = jEvent.timeStamp;
					this.xLast = touch.clientX;
					this.yLast = touch.clientY;
				}
			};
		};
	
		var numberOfStates = 0;

		/* touchStates: holds information about all the current touchpoints and has useful methods to deal with them.
		 */
		touchStates = {
			/* states: a dictionary of touchstates. The key is the touchstate's identifier; the value is the
			 * touchstate data.
			 */
			states: {},
			
			/* length(): the number of current touchstates.
			 * returns (Number): the number of current touchstates.
			 */
			length: function () {
				return numberOfStates;
			},
			/* toArray(): returns the touchstates as an array.
			 * returns (touchpoint[]): the current touchstates as an array, sorted by identifier.
			 */
			toArray: function () {
				var arr = [];
				for (var s in this.states) {
					arr.push(this.states[s]);
				}
				arr.sort(function(a, b) { return a.identifier - b.identifier; });
				return arr;
			},

			/* add(touch, jEvent): register a touchpoint with the touchStates object.
			 * touch (Touch): the touch to register, from the event.
			 * jEvent (jQuery Event): the jQuery event because of which this touch is being registered.
			 */
			add: function (touch, jEvent) {
				this.remove(touch);

				this.states[touch.identifier] = touchstate(touch, jEvent);
				++numberOfStates;
			},
			/* update(touch, jEvent): update a touchpoint's state.
			 * touch (Touch): the touch to update, from the event.
			 * jEvent (jQuery Event): the jQuery event because of which this touch is being updated.
			 */
			update: function (touch, jEvent) {
				if (this.states[touch.identifier]) {
					this.states[touch.identifier]._update(touch, jEvent);
				} else {
					this.add(touch, jEvent);
				}
			},
			/* remove(touch): remove a touchpoint from the touchStates object.
			 * touch (Touch): the touch to remove.
			 */
			remove: function (touch) {
				if (this.states[touch.identifier]) {
					delete this.states[touch.identifier];
					numberOfStates--;
				}
			},
			/* nuke(): remove all touchpoints from the touchStates object.
			 */
			nuke: function () {
				this.states = {};
				numberOfStates = 0;
			},

			/* commonTarget(): find the lowest common target for all current touchpoints.
			 * returns (Element): the deepest element that is the same as or a parent of every current touchpoint's target.
			 */
			commonTarget: function() {
				var touchArray = this.toArray();
				var $target = $(touchArray[0].target);
				for(var j = 1; j < touchArray.length; ++j) {
					if($target[0] !== touchArray[j].target) {
						$target = $target.add($target.parents()).has(touchArray[j].target).first();
					}
				}

				return $target[0];
			},
			/* pinchVector(): calculate the vector between the two current touchpoints.
			 * returns (vector): the vector from the earlier touchpoint to the later touchpoint.
			 */
			pinchVector: function() {
				if (this.length() !== 2) {
					throw 'touchStates.pinchVector: tried to get pinch vector without exactly two points.';
				}

				var touches = this.toArray();
				var vector = PointGeometry.point(touches[0].xLast, touches[0].yLast).vectorTo(PointGeometry.point(touches[1].xLast, touches[1].yLast));

				return vector;
			},
			/* splayCircle(): calculate the circle that encloses all the current touchpoints. There must be at least 3 touchpoints.
			 * returns (circle): the minimal enclosing circle that inclues all current touchpoints.
			 */
			splayCircle: function () {
				if (this.length() < 3) {
					throw 'touchStates.splayCircle: tried to get splay circle with less than three points.';
				}

				var touchPoints = this.toArray().map(function(el) {
					return PointGeometry.point(el.xLast, el.yLast);
				});

				var circle = PointGeometry.getMinimumContainingCircle(touchPoints);
				return circle;
			}
		};
	})();

	/* checkForHandlers(element, events): checks to see if an event fired on an element has any handlers registered.
	 * element (Element): the element to check.
	 * events (string[]): the event types to check for handlers for.
	 * returns (Boolean): whether there are any handlers registered to be called if any of the events given were fired on element.
	 */
	var checkForHandlers = function(element, events) {
		if(! $.isArray(events)) {
			throw 'checkForHandlers: events was not given as an array.';
		}

		var eventsRegistered = [];
		$(element).parents().andSelf().each(function(ix, el) {
			var handlers = $(el).data('events');
			if(handlers) {
				eventsRegistered = eventsRegistered.concat(Object.keys(handlers));
			}
		});
		eventsRegistered = $.unique(eventsRegistered);
		
		for(var i = 0; i < events.length; ++i) {
			if(eventsRegistered.indexOf(events[i]) >= 0) {
				return true;
			}
		}

		return false;
	};

	var touchStart = function (event) {
		// which gestures are ending now?
		var previousTouches = touchStates.toArray();
		if(previousTouches.length === 1 && previousTouches[0].dragged) {
			// a drag
			$(previousTouches[0].target).trigger('dragend', [previousTouches[0]]);
		} else if(previousTouches.length === 2) {
			// a pinch
			$(touchStates.commonTarget()).trigger('pinchend', [touchStates.pinchVector(), previousTouches]);
		} else if(previousTouches.length >= 3) {
			// a splay (adding another finger starts a new splay)
			$(touchStates.commonTarget()).trigger('splayend', [touchStates.splayCircle(), previousTouches]);
		}

		// start over with a new gesture
		touchStates.nuke();
		var touches = event.originalEvent.touches;
		for (var i = 0; i < touches.length; ++i) {
			touchStates.add(touches[i], event);
		}

		/*if(touches.length === 1) {
			// nothing special happens because the touchstart event already exists
		} else*/ if(touches.length === 2) {
			$(touchStates.commonTarget()).trigger('pinchstart', [touchStates.pinchVector(), touchStates.toArray()]);
		} else if(touches.length >= 3) {
			$(touchStates.commonTarget()).trigger('splaystart', [touchStates.splayCircle(), touchStates.toArray()]);
		}
	};
	var touchMove = function (event) {
		var changedTouches = event.originalEvent.changedTouches;
		for (var i = 0; i < changedTouches.length; ++i) {
			touchStates.update(changedTouches[i], event);
		}

		if (touchStates.length() === 1) {
			// one finger is a possible drag
			var draggedTouchState = touchStates.states[changedTouches[0].identifier];

			// has it been long enough to be a drag?
			if (draggedTouchState.duration() > MAX_FLICK_DURATION) {
				if(! draggedTouchState.dragged) {
					draggedTouchState.dragged = true;
					$(draggedTouchState.target).trigger('dragstart', [draggedTouchState]);
					if(checkForHandlers(draggedTouchState.target, ['dragstart'])) {
						event.preventDefault();
					}
				}
				$(draggedTouchState.target).trigger('drag', [draggedTouchState]);
				if(checkForHandlers(draggedTouchState.target, ['drag'])) {
					event.preventDefault();
				}
			} else {
				if(checkForHandlers(draggedTouchState.target, ['dragstart', 'drag', 'flick', 'flickright', 'flickup', 'flickdown', 'flickleft'])) {
					event.preventDefault();
				}
			}
		} else if(touchStates.length() === 2) {
			// two fingers is a pinch
			var commonTarget = touchStates.commonTarget();
			$(commonTarget).trigger('pinch', [touchStates.pinchVector(), touchStates.toArray()]);
			if(checkForHandlers(commonTarget, ['pinch'])) {
				event.preventDefault();
			}
		} else if(touchStates.length() >= 3) {
			// three or more is a splay
			var commonTarget = touchStates.commonTarget();
			$(commonTarget).trigger('splay', [touchStates.splayCircle(), touchStates.toArray()]);
			if(checkForHandlers(commonTarget, ['splay'])) {
				event.preventDefault();
			}
		} /* else { how did you get here with no touches? } */
	};
	var touchEnd = function (event) {
		if (touchStates.length() === 1/* && event.originalEvent.changedTouches.length === 1*/) {

			var onlyTouchState = touchStates.states[event.originalEvent.changedTouches[0].identifier],
				duration = onlyTouchState.duration(),
				distance = onlyTouchState.distance();

			// depending on distance and duration, we may have had a tap or a flick or a drag
			if (distance <= MAX_TAP_DISTANCE_E && duration <= MAX_TAP_DURATION_E) {
				if(! supportsEvent('click')) {
					// some mobile browsers don't emit click
					// but it's really useful (for responsive sites, for example) so we'll do it too
					$(onlyTouchState.target).trigger('click');
				}

				$(onlyTouchState.target).trigger('tap', [onlyTouchState]);

			} else if (duration <= MAX_FLICK_DURATION) {
				$(onlyTouchState.target).trigger('flick', [onlyTouchState]);

				var headingVariance = onlyTouchState.heading();
				while (headingVariance > 45) {
					headingVariance -= 90;
				}
				// headingVariance is now between (-45, 45].

				// was this flick close enough to a cardinal direction to be special?
				if (Math.abs(headingVariance) <= MAX_FLICK_VARIANCE) {
					var normalizedHeading = onlyTouchState.heading() - headingVariance;
					while(normalizedHeading >= 360) {
						normalizedHeading -= 360;
					}

					switch (normalizedHeading) {
						case 0:
							$(onlyTouchState.target).trigger('flickright', [onlyTouchState]);
							break;
						case 90:
							$(onlyTouchState.target).trigger('flickup', [onlyTouchState]);
							break;
						case 180:
							$(onlyTouchState.target).trigger('flickleft', [onlyTouchState]);
							break;
						case 270:
							$(onlyTouchState.target).trigger('flickdown', [onlyTouchState]);
							break;
					}
				}

			} else if(onlyTouchState.dragged) {
				$(onlyTouchState.target).trigger('dragend', [onlyTouchState]);
			}

		} else if(touchStates.length() === 2) {
			// two is a pinch
			$(touchStates.commonTarget()).trigger('pinchend', [touchStates.pinchVector(), touchStates.toArray()]);
		} else if(touchStates.length() >= 3) {
			// three or more is a splay
			$(touchStates.commonTarget()).trigger('splayend', [touchStates.splayCircle(), touchStates.toArray()]);
		}

		// it's a new gesture now, so we start over
		touchStates.nuke();
		var touches = event.originalEvent.touches;
		for (var i = 0; i < touches.length; ++i) {
			touchStates.add(touches[i], event);
		}

		// does this seem familiar to anyone else?
		/*if(touches.length === 1) {
			// nothing special happens because the touchstart event already exists
		} else*/ if(touches.length === 2) {
			$(touchStates.commonTarget()).trigger('pinchstart', [touchStates.pinchVector(), touchStates.toArray()]);
		} else if(touches.length >= 3) {
			$(touchStates.commonTarget()).trigger('splaystart', [touchStates.splayCircle(), touchStates.toArray()]);
		}
	};
	var touchCancel = function (event) {
		/* touchcancel happens when:
		 * A. something interrupts the touch, in which case all touches are cancelled; or
		 * B. more touch points exist than the device can handle, in which case the first touch is cancelled.
		 * 
		 * B is why this function has code to restart gestures.
		 */
		if (touchStates.length() === 1/* && event.originalEvent.changedTouches.length === 1*/) {

			var onlyTouchState = touchStates.states[event.originalEvent.changedTouches[0].identifier];
			if(onlyTouchState.dragged) {
				$(onlyTouchState.target).trigger('dragcancel', [onlyTouchState]);
			}

		} else if(touchStates.length() === 2) {
			// two is a pinch
			$(touchStates.commonTarget()).trigger('pinchcancel', [touchStates.pinchVector(), touchStates.toArray()]);
		} else if(touchStates.length() >= 3) {
			// three or more is a splay
			$(touchStates.commonTarget()).trigger('splaycancel', [touchStates.splayCircle(), touchStates.toArray()]);
		}

		// it's a new gesture now, so we start over
		touchStates.nuke();
		var touches = event.originalEvent.touches;
		for (var i = 0; i < touches.length; ++i) {
			touchStates.add(touches[i], event);
		}

		// does this seem familiar to anyone else?
		/*if(touches.length === 1) {
			// nothing special happens because the touchstart event already exists
		} else*/ if(touches.length === 2) {
			$(touchStates.commonTarget()).trigger('pinchstart', [touchStates.pinchVector(), touchStates.toArray()]);
		} else if(touches.length >= 3) {
			$(touchStates.commonTarget()).trigger('splaystart', [touchStates.splayCircle(), touchStates.toArray()]);
		}
	};

	$(window).on({
		'touchstart': touchStart,
		'touchmove': touchMove,
		'touchend': touchEnd,
		'touchcancel': touchCancel
	});

})();