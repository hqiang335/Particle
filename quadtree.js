// 四叉树空间分区系统
// 基于点的四叉树实现，支持环绕边界

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

    clear() {
        this.points = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }
}

// 空间分区管理器
class QuadTreeManager {
    constructor(width, height, capacity = 4) {
        this.width = width;
        this.height = height;
        this.boundary = new Rectangle(width/2, height/2, width/2, height/2);
        this.quadtree = new QuadTree(this.boundary, capacity);
    }

    // 插入粒子
    insert(particle) {
        let point = new Point(particle.pos.x, particle.pos.y, particle);
        this.quadtree.insert(point);
    }

    // 查询指定范围内的粒子，支持环绕边界
    query(x, y, radius) {
        let neighbors = [];
        
        if (settings.boundaryMode === 'wrap') {
            // 在环绕模式下，需要检查边界周围的区域
            let queries = [];
            // 中心区域
            queries.push({x: x, y: y});
            
            // 边界周围的8个区域
            if (x < radius) queries.push({x: x + this.width, y: y}); // 右
            if (x > this.width - radius) queries.push({x: x - this.width, y: y}); // 左
            if (y < radius) queries.push({x: x, y: y + this.height}); // 下
            if (y > this.height - radius) queries.push({x: x, y: y - this.height}); // 上
            
            // 对角
            if (x < radius && y < radius) queries.push({x: x + this.width, y: y + this.height});
            if (x < radius && y > this.height - radius) queries.push({x: x + this.width, y: y - this.height});
            if (x > this.width - radius && y < radius) queries.push({x: x - this.width, y: y + this.height});
            if (x > this.width - radius && y > this.height - radius) queries.push({x: x - this.width, y: y - this.height});
            
            // 对每个查询点进行搜索
            for (let q of queries) {
                let range = new Circle(q.x, q.y, radius);
                let found = this.quadtree.query(range);
                neighbors.push(...found);
            }
        } else {
            // 非环绕模式，直接查询
            let range = new Circle(x, y, radius);
            neighbors = this.quadtree.query(range);
        }
        
        // 返回实际的粒子对象
        return neighbors.map(p => p.userData);
    }

    // 更新所有粒子位置
    update(particles) {
        this.quadtree.clear();
        for (let particle of particles) {
            this.insert(particle);
        }
    }

    // 重建四叉树
    rebuild() {
        this.boundary = new Rectangle(this.width/2, this.height/2, this.width/2, this.height/2);
        this.quadtree = new QuadTree(this.boundary, 4);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        QuadTreeManager,
        QuadTree,
        Point,
        Rectangle,
        Circle
    };
} 