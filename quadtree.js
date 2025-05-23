/*
QuadTree spatial partitioning for efficient neighbor search in particle systems.
*/

// QuadTree spatial partitioning system
// Supports wrap-around boundaries and fast neighbor search

class Point {
    constructor(x, y, userData) {
        this.x = x;
        this.y = y;
        this.userData = userData;
    }
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(point) {
        return (point.x >= this.x - this.w &&
            point.x <= this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y <= this.y + this.h);
    }

    intersects(range) {
        return !(range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h);
    }
}

class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.rSquared = this.r * this.r;
    }

    contains(point) {
        let d = Math.pow((point.x - this.x), 2) + Math.pow((point.y - this.y), 2);
        return d <= this.rSquared;
    }

    intersects(range) {
        let xDist = Math.abs(range.x - this.x);
        let yDist = Math.abs(range.y - this.y);
        let r = this.r;
        let w = range.w;
        let h = range.h;
        let edges = Math.pow((xDist - w), 2) + Math.pow((yDist - h), 2);

        if (xDist > (r + w) || yDist > (r + h))
            return false;
        if (xDist <= w || yDist <= h)
            return true;
        return edges <= this.rSquared;
    }
}

class QuadTree {
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }

    // Split the current node into four sub-quadrants
    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w / 2;
        let h = this.boundary.h / 2;

        let ne = new Rectangle(x + w, y - h, w, h);
        this.northeast = new QuadTree(ne, this.capacity);
        let nw = new Rectangle(x - w, y - h, w, h);
        this.northwest = new QuadTree(nw, this.capacity);
        let se = new Rectangle(x + w, y + h, w, h);
        this.southeast = new QuadTree(se, this.capacity);
        let sw = new Rectangle(x - w, y + h, w, h);
        this.southwest = new QuadTree(sw, this.capacity);

        this.divided = true;
    }

    // Insert a point into the quadtree
    insert(point) {
        if (!this.boundary.contains(point)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        return (this.northeast.insert(point) ||
                this.northwest.insert(point) ||
                this.southeast.insert(point) ||
                this.southwest.insert(point));
    }

    // Query all points within a given range
    query(range, found = []) {
        if (!range.intersects(this.boundary)) {
            return found;
        }

        for (let p of this.points) {
            if (range.contains(p)) {
                found.push(p);
            }
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }

    // Clear all points and subdivisions
    clear() {
        this.points = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }
}

// QuadTree manager for handling particles and neighbor queries
class QuadTreeManager {
    constructor(width, height, capacity = 4) {
        this.width = width;
        this.height = height;
        this.boundary = new Rectangle(width/2, height/2, width/2, height/2);
        this.quadtree = new QuadTree(this.boundary, capacity);
    }

    // Insert a particle into the quadtree
    insert(particle) {
        let point = new Point(particle.pos.x, particle.pos.y, particle);
        this.quadtree.insert(point);
    }

    // Query particles within a radius, supporting wrap-around boundaries
    query(x, y, radius) {
        let neighbors = [];
        if (settings.boundaryMode === 'wrap') {
            // In wrap mode, check 9 regions around the query point
            let queries = [];
            queries.push({x: x, y: y});
            if (x < radius) queries.push({x: x + this.width, y: y});
            if (x > this.width - radius) queries.push({x: x - this.width, y: y});
            if (y < radius) queries.push({x: x, y: y + this.height});
            if (y > this.height - radius) queries.push({x: x, y: y - this.height});
            if (x < radius && y < radius) queries.push({x: x + this.width, y: y + this.height});
            if (x < radius && y > this.height - radius) queries.push({x: x + this.width, y: y - this.height});
            if (x > this.width - radius && y < radius) queries.push({x: x - this.width, y: y + this.height});
            if (x > this.width - radius && y > this.height - radius) queries.push({x: x - this.width, y: y - this.height});
            for (let q of queries) {
                let range = new Circle(q.x, q.y, radius);
                let found = this.quadtree.query(range);
                neighbors.push(...found);
            }
        } else {
            // Non-wrap mode, direct query
            let range = new Circle(x, y, radius);
            neighbors = this.quadtree.query(range);
        }
        // Return particle objects
        return neighbors.map(p => p.userData);
    }

    // Update all particle positions in the quadtree
    update(particles) {
        this.quadtree.clear();
        for (let particle of particles) {
            this.insert(particle);
        }
    }

    // Rebuild the quadtree
    rebuild() {
        this.boundary = new Rectangle(this.width/2, this.height/2, this.width/2, this.height/2);
        this.quadtree = new QuadTree(this.boundary, 4);
    }
}

// Export classes for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QuadTreeManager,
        QuadTree,
        Point,
        Rectangle,
        Circle
    };
} 