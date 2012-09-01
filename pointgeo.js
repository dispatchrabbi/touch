var PointGeometry = {
	/* point(x, y): creates a point object.
	 * x (Number): the x-coordinate of the point.
	 * y (Number): the y-coordinate of the point.
	 * returns (point): a point object representing the point at (x, y).
	 */
	point: function (x, y) {
		var px = parseFloat(x),
			py = parseFloat(y);

		if (isNaN(px) || isNaN(py)) {
			throw 'PointGeometry.point: invalid coordinates given.';
		}

		/* point object: represents a point in the 2-dimensional plane.
		 */
		return {
			/* x (Number): the x-coordinate of the point.
			 */
			x: px,
			/* y (Number): the y-coordinate of the point.
			 */
			y: py,

			/* vectorTo(point2): creates a vector from this point to a second point.
			 * point2 (point): the far endpoint of the vector.
			 * returns (vector): the vector from this point to the given point.
			 */
			vectorTo: function (point2) {
				return PointGeometry.vector(point2.x - this.x, point2.y - this.y);
			},
			/* distanceTo(point2): determines the distance from this point to a second point.
			 * point2 (point): the point to measure distance to.
			 * returns (Number): the distance from this point to the given point.
			 */
			distanceTo: function (point2) {
				return this.vectorTo(point2).magnitude();
			}
		};
	},

	/* vector(i, j): creates a vector object.
	 * i (Number): the i-component of the vector.
	 * j (Number): the j-component of the vector.
	 * returns (vector): a vector object representing the vector <i, j>.
	 */
	vector: function (i, j) {
		var pi = parseFloat(i),
			pj = parseFloat(j);

		if (isNaN(pi) || isNaN(pj)) {
			throw 'PointGeometry.vector: invalid coordinates given.';
		}

		return {
			/* i (Number): the i-component of the vector.
			 */
			i: pi,
			/* j (Number): the j-component of the vector.
			 */
			j: pj,

			/* magnitude(): returns this vector's magnitude (also known as length).
			 * returns (Number): this vector's magnitude.
			 */
			magnitude: function () {
				return Math.sqrt(Math.pow(this.i, 2) + Math.pow(this.j, 2));
			},
			/* unit(): returns the unit vector with this vector's heading.
			 * returns (vector): a vector with this vector's heading scaled to have magnitude 1.
			 */
			unit: function () {
				var m = this.magnitude();
				return PointGeometry.vector(this.i / m, this.j / m);
			},
			/* heading(): computes this vector's heading.
			 * returns (Number): this vector's heading in radians on the range [0, 2pi).
			 */
			heading: function () {
				var u = this.unit();
				var angle = Math.atan2(u.j, u.i);
				// -PI <= angle <= PI, but we want it to be 0 <= angle < 2PI
				while (angle < 0) {
					angle += (2 * Math.PI);
				}
				return angle;
			},
			/* headingInDegrees(): computes this vector's heading in degrees.
			 * returns (Number): this vector's heading in degrees on the range [0, 360).
			 */
			headingInDegrees: function () {
				return (this.heading() * 180 / Math.PI);
			},
			/* add(vector2): adds this vector and another vector together.
			 * vector2 (vector): the vector to add to this vector.
			 * returns (vector): the sum of this vector and vector2.
			 */
			add: function (vector2) {
				return PointGeometry.vector(this.i + vector2.i, this.j + vector2.j);
			},
			/* subtract(vector2): subtracts another vector from this vector.
			 * vector2 (vector): the vector to subtract from this vector.
			 * returns (vector): the difference of this vector and vector 2.
			 */
			subtract: function (vector2) {
				return PointGeometry.vector(this.i - vector2.i, this.j - vector2.j);
			},
			/* dot(vector2): computes the dot product of this vector and another vector.
			 * vector2 (vector): the vector to dot with this vector.
			 * returns (Number): the dot product of this vector and vector2.
			 */
			dot: function (vector2) {
				return (this.i * vector2.i) + (this.j * vector2.j);
			},
			/* cross(vector2): computes the cross product of this vector and another vector.
			 * vector2 (vector): the vector to cross with this vector.
			 * returns (Number): the cross product of this vector and vector2.
			 */
			cross: function (vector2) {
				// two-dimensional cross-products are a little strange,
				// but at least they are consistent.
				return (this.i * vector2.j) - (vector2.i * this.j)
			}
		};
	},

	/* circle(center, radius): creates a circle object.
	 * center (point): the center of the circle.
	 * radius (Number): the radius of the circle.
	 * returns (circle): a circle object representing a circle with the given circle and radius.
	 */
	circle: function (center, radius) {
		pr = parseFloat(radius);
		if(isNaN(pr)) {
			throw 'PointGeometry.circle: invalid radius given.';
		}
	
		return {
			/* center (point): the center of this circle.
			 */
			center: center,
			/* radius (Number): the radius of this circle.
			 */
			radius: pr,
			
			/* containsPoint(point): tests to see if the given point is in the circle.
			 * point (point): the point to test.
			 * returns (Boolean): whether point is in this circle.
			 */
			containsPoint: function (point) {
				return this.center.distanceTo(point) <= this.radius;
			}
		};
	},

	/* getConvexHull(points): determines the convex hull of a set of points.
	 * points (point[]): the set of points to determine the convex hull for.
	 * returns (point[]): the points making up the convex hull, going clockwise starting with the leftmost (smallest x-coordinate).
	 */
	getConvexHull: function (points) {
		// A big big thank you goes out to http://bloggingmath.wordpress.com/2009/06/04/convex-hulls/ for this algorithm
		// and to http://bloggingmath.wordpress.com/2009/06/03/right-and-left-turns/ for inspiring the isRightTurn function below.

		/* isRightTurn(p1, p2, p3): determines whether there is a "right turn" made at p2 when coming from p1 and going to p3.
		 * p1 (point): the starting point.
		 * p2 (point): the turning point.
		 * p3 (point): the ending point.
		 * returns (Boolean): whether there was a right turn made at p2.
		 */
		var isRightTurn = function (p1, p2, p3) {
			// yes, both from p2.
			var v1 = p2.vectorTo(p1),
				v2 = p2.vectorTo(p3);

			return (v1.cross(v2) > 0);
		};

		/* makeHalfHull(points): makes one half of the convex hull.
		 * points (point[]): the set of points to make half a convex hull for, sorted by x-coordinate.
		 * returns (point[]): the points that make up half a convex hull for the points given. If the points were
		 * sorted in ascending order, this will be the top half; if the points were sorted in descending order,
		 * this will be the bottom half.
		 */
		var makeHalfHull = function (points) {
			// start with the first two points
			var halfHull = [points[0], points[1]];

			for (var i = 2; i < points.length; ++i) {
				// append the next point down the line
				halfHull.push(points[i]);

				var hullLength = halfHull.length; // here for reference convenience
				// as long as the hull is 3 or more points long, check to see if the last three don't make a right turn
				// if they don't, delete the middle point of the three (as it's the one preventing the hull from being convex)
				// really this while loop *should* only run once per for loop iteration but it's not a bad thing to be safe here
				while (hullLength >= 3 && !isRightTurn(halfHull[hullLength - 3], halfHull[hullLength - 2], halfHull[hullLength - 1])) {
					halfHull.splice(hullLength - 2, 1);
					hullLength = halfHull.length;
				}
			}

			return halfHull;
		};

		// sort by x-coordinate first
		points.sort(function (a, b) { return a.x - b.x; });

		// let's take care of the degenerate cases
		if (points.length === 0) {
			// huh?!
			throw 'PointGeometry.getConvexHull: no points passed!';
		} else if (points.length < 3) {
			// why are you asking for a hull?
			return points;
		}

		//	make the upper hull starting from the left...
		var upperHull = makeHalfHull(points),
		//	...and the lower hull starting from the right.
			lowerHull = makeHalfHull(points.reverse());

		// delete the first and last points of the lower hull because they will be in the upper hull as well
		lowerHull.shift();
		lowerHull.pop();

		// combine them to make the full hull, in order starting from the leftmost point
		return upperHull.concat(lowerHull);
	},

	/* getMinimumContainingCircle(points): determines the circle of smallest radius that contains all the given points.
	 * points (point[]): the set of points to find the minimum enclosing circle for.
	 * returns (circle): the circle of smallest radius that still contains all the given points.
	 */
	getMinimumContainingCircle: function (points) {
		// A big thank you goes out to http://www.personal.kent.edu/~rmuhamma/Compgeometry/MyCG/CG-Applets/Center/centercli.htm for this MCE algorithm.
		// No, really, go read it. Because otherwise all the comments in the world here won't help you.

		/* getAngle(p1, p2, p3): gets the angle between two line segments determined by three points.
		 * p1 (point): the far endpoint of one line segment.
		 * p2 (point): the vertex of the angle being measured and the near end of both line segments.
		 * p3 (point): the far end of the second line segment.
		 * returns (Number): the angle in radians between the line segments determined by p1, p2, and p3.
		 */
		var getAngle = function (p1, p2, p3) {
			// yes, both from p2
			var v1 = p2.vectorTo(p1),
				v2 = p2.vectorTo(p3);

			// theta = arccos(a.b / |a||b|)
			var theta = Math.acos(v1.dot(v2) / (v1.magnitude() * v2.magnitude()));

			return theta;
		};

		var hull = PointGeometry.getConvexHull(points);

		// let's take care of the degenerate cases
		if (hull.length === 1) {
			// this isn't really a circle but okay.
			return PointGeomtery.circle(hull[0], 0);
		} else if (hull.length === 2) {
			// return the circle whose diameter is the line segment between these two points
			var midpoint = PointGeometry.point((hull[0].x + hull[1].x) / 2, (hull[0].y + hull[1].y) / 2);
			return PointGeomtery.circle(midpoint, midpoint.distanceTo(hull[0]));
		}

		// we're picking S to be the "first" side of the hull, just to make it easy
		var s1 = hull[0], 	// first endpoint of S
			s2 = hull[1], 	// second endpoint of S
			v, 				// will eventually represent one of the other (non-s1-and-s2) vertices of on the hull
			a, 				// will eventually be the angle from v subtended by S
			circle = null; // will eventually be the circle we return

		while (circle === null) { // we still haven't found it yet
			// got some initialization here
			v = null; 		// we don't know which vertex this should be yet
			a = Infinity; // starts at infinity so we are guaranteed it's bigger than whatever we will initially compare it to

			// look at every other (non-s1-and-s2) vertex on the hull to see which has the smallest subtended angle (v)
			for (var i = 0; i < hull.length; ++i) {
				if (hull[i] !== s1 && hull[i] !== s2) {
					var currentAngle = getAngle(s1, hull[i], s2);
					if (currentAngle < a) {
						v = hull[i];
						a = currentAngle;
					}
				}
			}

			if (a >= (Math.PI / 2)) {
				// if angle a is obtuse, we're done:
				// the MCE is the diametric circle of S.
				// I think this only happens with some 3-point hulls but I'm not sure
				var midpoint = PointGeometry.point((s1.x + s2.x) / 2, (s1.y + s2.y) / 2);
				circle = PointGeometry.circle(midpoint, midpoint.distanceTo(s1));
			} else {
				// angle a is acute, so we will look at the other angles in this triangle to see if any of them are are obtuse
				// because if they are, we picked the wrong side to be S
				var a2 = getAngle(v, s2, s1),
					a3 = getAngle(s2, s1, v);

				if (a2 >= (Math.PI / 2)) {
					// start again with side S opposite the obtuse angle (a2)
					s2 = s1;
					s1 = v;
					// continue to the top of the while loop
				} else if (a3 >= (Math.PI / 2)) {
					// start again with side S opposite the obtuse angle (a3)
					s1 = s2;
					s2 = v;
					// continue to the top of the while loop
				} else {
					// the MCE is the circle determined by s1, s2, and v
					// so how do you get the circle determined by 3 points?
					// ...painfully:
					var d = 2 * ((s1.x * (v.y - s2.y)) + (v.x * (s2.y - s1.y)) + (s2.x * (s1.y - v.y)));
					var center = PointGeometry.point(
						(((Math.pow(s1.y, 2) + Math.pow(s1.x, 2)) * (v.y - s2.y)) + ((Math.pow(v.y, 2) + Math.pow(v.x, 2)) * (s2.y - s1.y)) + ((Math.pow(s2.y, 2) + Math.pow(s2.x, 2)) * (s1.y - v.y))) / d,
						(((Math.pow(s1.y, 2) + Math.pow(s1.x, 2)) * (s2.x - v.x)) + ((Math.pow(v.y, 2) + Math.pow(v.x, 2)) * (s1.x - s2.x)) + ((Math.pow(s2.y, 2) + Math.pow(s2.x, 2)) * (v.x - s1.x))) / d
					);

					circle = PointGeometry.circle(center, center.distanceTo(s1));
				}
			}
		} // end circle-searching while loop

		return circle;
	}
};