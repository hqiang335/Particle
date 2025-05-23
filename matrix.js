/*
Matrix - Interaction matrix for controlling particle species interactions.
Supports presets, resizing, and visualization.
*/
/**
 * 交互矩阵类，控制不同类型粒子间的相互作用
 */
class Matrix {
    constructor(size) {
        // Use the provided size parameter
        this.size = size;
        // Initialize value array
        this.values = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.presets = {
            random: () => this.initializeRandom(),
            symmetry: () => this.initializeSymmetry(),
            chains: () => this.initializeChains(),
            snakes: () => this.initializeSnakes(),
            clusters: () => this.initializeClusters(),
            zero: () => this.initializeZero(),
            one: () => this.initializeOne(),
            minusone: () => this.initializeMinusOne()
        };
        this.currentPreset = 'random';
        this.initializeRandom();
    }

    // Basic matrix operations
    get(i, j) {
        return this.values[i][j];
    }

    set(i, j, value) {       
        this.values[i][j] = Math.max(-1, Math.min(1, value));
    }

    // Preset initializations
    initializeRandom() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, random(-1, 1));
            }
        }
        this.currentPreset = 'random';
    }

    initializeSymmetry() {
        // Symmetric matrix
        for (let i = 0; i < this.size; i++) {
            for (let j = i; j < this.size; j++) {
                let value = random(-1, 1);
                this.set(i, j, value);
                this.set(j, i, value);
            }
        }
        this.currentPreset = 'symmetry';
    }
    
    // Chain structure
    initializeChains() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (j === i || j === (i + 1) % this.size || j === (i + this.size - 1) % this.size) {
                    this.set(i, j, 1);
                } else {
                    this.set(i, j, -1);
                }
            }
        }
        this.currentPreset = 'chains';
    }

    // Snake structure
    initializeSnakes() {
        this.initializeZero();
        for (let i = 0; i < this.size; i++) {
            this.set(i, i, 1);  // Self-attraction
            this.set(i, (i + 1) % this.size, 0.3);  // Weak attraction to next type
        }
        this.currentPreset = 'snakes';
    }
  
    // Cluster structure
    initializeClusters() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === j) {
                    this.values[i][j] = 1;  // Strong self-attraction
                } else {
                    this.values[i][j] = -0.5;  // Weak repulsion between types
                }
            }
        }
        this.currentPreset = 'clusters';
    }
  
    // Zero matrix
    initializeZero() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, 0);
            }
        }
        this.currentPreset = 'zero';
    }
    
    // All ones
    initializeOne() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, 1);
            }
        }
        this.currentPreset = 'one';
    }
  
    // All minus ones
    initializeMinusOne() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, -1);
            }
        }
        this.currentPreset = 'minusone';
    }

    // Apply a preset
    applyPreset(presetName) {
        if (this.presets[presetName]) {
            this.presets[presetName]();
        }
    }
    
    // Update matrix size
    updateSize(newSize) {
        if (newSize === this.size) return;
        const oldValues = this.values;
        const oldSize = this.size;
        this.size = newSize;
        this.values = Array(newSize).fill().map(() => Array(newSize).fill(0));
        const minSize = Math.min(oldSize, newSize);
        for (let i = 0; i < minSize; i++) {
            for (let j = 0; j < minSize; j++) {
                this.values[i][j] = oldValues[i][j];
            }
        }
    }

    // Draw matrix visualization
    show(x, y, cellSize) {
        push();
        translate(x, y);
        colorMode(HSB, 360, 100, 100, 255);
        // Draw color bars above and to the left
        for (let j = 0; j < this.size; j++) {
            const speciesColor = settings.getSpeciesColor(j);
            fill(speciesColor);
            noStroke();
            rect(j * cellSize, -cellSize * 0.8, cellSize, cellSize * 0.6);
            fill(0, 0, 100, 255);
            textAlign(CENTER, CENTER);
            textSize(cellSize * 0.3);
            text(j, j * cellSize + cellSize/2, -cellSize * 0.4);
        }
        for (let i = 0; i < this.size; i++) {
            const speciesColor = settings.getSpeciesColor(i);
            fill(speciesColor);
            noStroke();
            rect(-cellSize * 0.8, i * cellSize, cellSize * 0.6, cellSize);
            fill(0, 0, 100, 255);
            textAlign(CENTER, CENTER);
            textSize(cellSize * 0.3);
            text(i, -cellSize * 0.4, i * cellSize + cellSize/2);
        }
        // Draw matrix grid
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.values[i][j];
                if (value > 0) {
                    fill(120, 80, value * 100, 255); // Green for attraction
                } else {
                    fill(0, 80, -value * 100, 255); // Red for repulsion
                }
                rect(j * cellSize, i * cellSize, cellSize, cellSize);
                fill(0, 0, 100, 255);
                noStroke();
                textAlign(CENTER, CENTER);
                textSize(cellSize * 0.3);
                text(value.toFixed(1), j * cellSize + cellSize/2, i * cellSize + cellSize/2);
            }
        }
        // Mouse interaction
        if (mouseX > x && mouseX < x + this.size * cellSize &&
            mouseY > y && mouseY < y + this.size * cellSize) {
            const i = floor((mouseY - y) / cellSize);
            const j = floor((mouseX - x) / cellSize);
            // Highlight current cell
            noFill();
            stroke(0, 0, 100, 255);
            strokeWeight(2);
            rect(j * cellSize, i * cellSize, cellSize, cellSize);
            // Handle click
            if (mouseIsPressed) {
                if (mouseButton === LEFT) {
                    this.values[i][j] = min(1, this.values[i][j] + 0.1);
                } else if (mouseButton === RIGHT) {
                    this.values[i][j] = max(-1, this.values[i][j] - 0.1);
                }
            }
        }
        pop();
    }

    // Print matrix (for debugging)
    print() {
        console.log("Interaction Matrix:");
        for (let i = 0; i < this.size; i++) {
            console.log(this.values[i].map(v => v.toFixed(2)).join("\t"));
        }
    }
}