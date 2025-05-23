/*
Particle - Core class for a single particle in the simulation.
Handles position, velocity, type, update, interaction, and rendering logic.
*/
class Particle {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(0.5, 1));
        this.acc = createVector();
        this.type = type;
        // Particle properties
        this.baseRadius = settings.physics.particleRadius;  // Base radius
        this.radius = this.baseRadius;
        this.baseColor = settings.getSpeciesColor(type);
        this.baseMaxSpeed = settings.physics.maxSpeed;
        this.maxSpeed = this.baseMaxSpeed;
        // Dragging properties
        this.dragOffset = null;  // Offset relative to mouse/hand
    }
    
    update() {
        // Update base radius from settings
        this.baseRadius = settings.physics.particleRadius;
        // If being dragged
        if (draggedParticles.includes(this)) {
            // Update position based on interaction mode
            if (settings.interaction.mode === 'hand' && isDragging) {
                if (!this.dragOffset) {
                    this.dragOffset = createVector(
                        this.pos.x - handX,
                        this.pos.y - handY
                    );
                }
                this.pos.x = handX + this.dragOffset.x;
                this.pos.y = handY + this.dragOffset.y;
            } else if (settings.interaction.mode === 'mouse' && isMouseDragging) {
                if (!this.dragOffset) {
                    this.dragOffset = createVector(
                        this.pos.x - mouseX,
                        this.pos.y - mouseY
                    );
                }
                this.pos.x = mouseX + this.dragOffset.x;
                this.pos.y = mouseY + this.dragOffset.y;
            }
            // Reset velocity and acceleration
            this.vel.mult(0);
            this.acc.mult(0);
            return;
        }
        // Clear drag offset if not dragging
        this.dragOffset = null;
        // Apply friction
        let frictionFactor = 1 - settings.physics.friction;
        this.vel.mult(frictionFactor * settings.audio.forceMultiplier);
        // Update position
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
        // Boundary check
        this.handleBoundary();
    }
  
    applyForce(force) {
        this.acc.add(force);
    }
  
    interact(particles) {
        let force = createVector(0, 0);
        let total = 0;
    
        for (let other of particles) {
            if (other === this) continue;
            // Calculate distance (consider wrap boundary)
            let d;
            let diff;
            if (settings.boundaryMode === 'wrap') {
                // Distance with wrap-around
                let dx = other.pos.x - this.pos.x;
                let dy = other.pos.y - this.pos.y;
                if (Math.abs(dx) > width / 2) {
                    dx = dx > 0 ? dx - width : dx + width;
                }
                if (Math.abs(dy) > height / 2) {
                    dy = dy > 0 ? dy - height : dy + height;
                }
                diff = createVector(dx, dy);
                d = diff.mag();
            } else {
                d = p5.Vector.dist(this.pos, other.pos);
                diff = p5.Vector.sub(other.pos, this.pos);
            }
            // Collision detection and response
            if (d < settings.physics.collisionRadius) {
                let repulsion = diff.copy().normalize();
                let strength = map(d, 0, settings.physics.collisionRadius, 
                                   settings.physics.collisionForce, 0);
                repulsion.mult(-strength*settings.audio.forceMultiplier);
                this.applyForce(repulsion);
                other.applyForce(p5.Vector.mult(repulsion, -1));
            }
            // Interaction force
            if (d < settings.physics.perceptionRadius) {
                if (this.type >= 0 && this.type < matrix.size && other.type >= 0 && other.type < matrix.size) {
                    let interactionForce = matrix.get(this.type, other.type);
                    let direction = diff.copy().normalize();
                    let safeDistance = Math.max(d, 0.1);
                    let strength = 1 / safeDistance;
                    direction.mult(strength * interactionForce * settings.physics.force * settings.audio.forceMultiplier);
                    force.add(direction);
                    total++;
                }
            }
        }
    
        if (total > 0) {
            force.div(total);
            force.setMag(this.maxSpeed);
            force.sub(this.vel);
            force.limit(settings.physics.maxForce * settings.audio.forceMultiplier);
            this.applyForce(force);
        }
    }
    
    handleBoundary(){
        if (settings.boundaryMode === 'wrap') {
            // Wrap-around boundary
            if (this.pos.x < 0) {
                this.pos.x += width;
            } else if (this.pos.x > width) {
                this.pos.x -= width;
            }
            if (this.pos.y < 0) {
                this.pos.y += height;
            } else if (this.pos.y > height) {
                this.pos.y -= height;
            }
        } 
        else {
            // Bounce boundary (smooth bounce)
            let buffer = settings.physics.particleRadius;
            if (this.pos.x < buffer) {
                this.vel.x = Math.abs(this.vel.x) * 0.8;
                this.pos.x = buffer;
            } else if (this.pos.x > width - buffer) {
                this.vel.x = -Math.abs(this.vel.x) * 0.8;
                this.pos.x = width - buffer;
            }
            if (this.pos.y < buffer) {
                this.vel.y = Math.abs(this.vel.y) * 0.8;
                this.pos.y = buffer;
            } else if (this.pos.y > height - buffer) {
                this.vel.y = -Math.abs(this.vel.y) * 0.8;
                this.pos.y = height - buffer;
            }
        }
    }
    
    show() {
        let col = settings.getSpeciesColor(this.type);
        push();
        // Use HSB color mode
        colorMode(HSB, 360, 100, 100, 255);
        // Calculate display radius (audio responsive)
        let displayRadius = this.baseRadius;
        if (settings.audio) {
            displayRadius *= settings.audio.sizeFactor;
        }
        fill(col);
        noStroke();
        // Render particle by mode
        switch (settings.rendering.mode) {
            case 'circle':
                circle(this.pos.x, this.pos.y, displayRadius * 2);
                break;
            case 'square':
                rectMode(CENTER);
                if (this.vel.mag() > 0.1) {
                    const angle = this.vel.heading();
                    translate(this.pos.x, this.pos.y);
                    rotate(angle);
                    rect(0, 0, displayRadius * 2, displayRadius * 2);
                } else {
                    rect(this.pos.x, this.pos.y, displayRadius * 2, displayRadius * 2);
                }
                break;
            case 'triangle':
                const angle = this.vel.mag() > 0.1 ? this.vel.heading() : 0;
                translate(this.pos.x, this.pos.y);
                rotate(angle);
                triangle(
                    displayRadius * 1.5, 0,
                    -displayRadius * 0.75, -displayRadius,
                    -displayRadius * 0.75, displayRadius
                );
                break;
            case 'image':
                // Microorganism style
                translate(this.pos.x, this.pos.y);
                if (this.vel.mag() > 0.1) {
                    rotate(this.vel.heading());
                }
                const size = displayRadius * 2;
                noStroke();
                ellipse(0, 0, size*2 , size*1.2);
                let pseudopodCount = 5;
                for (let i = 0; i < pseudopodCount; i++) {
                    let angle = TWO_PI / pseudopodCount * i + frameCount * 0.01;
                    let xOff = cos(angle) * size * 0.6;
                    let yOff = sin(angle) * size * 0.6;
                    ellipse(xOff, yOff, size * 0.6, size * 0.6);
                }
                break;
            default:
                circle(this.pos.x, this.pos.y, displayRadius * 2);
        }
        // Render halo effect if enabled
        if (settings.effects.haloEnabled) {
            colorMode(HSB, 360, 100, 100, 255);
            let h = hue(col);
            let s = saturation(col);
            let b = brightness(col);
            let haloColor = color(h, s, b, settings.effects.haloAlpha * 255);
            fill(haloColor);
            noStroke();
            let sizeMultiplier = this.tempHaloMultiplier || settings.effects.haloSizeMultiplier;
            let haloRadius = displayRadius * sizeMultiplier;
            resetMatrix();
            circle(this.pos.x, this.pos.y, haloRadius * 2);
            if (this.vel.mag() > 0.5 || isDragging && draggedParticles.includes(this)) {
                let movementFactor = isDragging && draggedParticles.includes(this) ? 
                    1.0 : constrain(this.vel.mag() / settings.physics.maxSpeed, 0, 1);
                let outerHaloAlpha = settings.effects.haloAlpha * 0.5 * movementFactor;
                let outerHaloColor = color(h, s, b, outerHaloAlpha * 255);
                fill(outerHaloColor);
                let outerHaloRadius = haloRadius * 1.5;
                circle(this.pos.x, this.pos.y, outerHaloRadius * 2);
            }
        }
        pop();
    }
}
    