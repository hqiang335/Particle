/**
 * 交互矩阵类，控制不同类型粒子间的相互作用
 */
class Matrix {
    constructor(size) {
        // 使用传入的size参数，而不是从settings中获取
        this.size = size;
        // 确保使用正确的大小初始化值数组
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

    // 基本矩阵操作
    get(i, j) {
            return this.values[i][j];
    }

    set(i, j, value) {       
            this.values[i][j] = Math.max(-1, Math.min(1, value));
    }

    // 预设模式初始化函数
    initializeRandom() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, random(-1, 1));
            }
        }
        this.currentPreset = 'random';
    }

    initializeSymmetry() {
        // 生成对称矩阵
        for (let i = 0; i < this.size; i++) {
            for (let j = i; j < this.size; j++) {
                let value = random(-1, 1);
                this.set(i, j, value);
                this.set(j, i, value);
            }
        }
        this.currentPreset = 'symmetry';
    }
    
    // 链式结构
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

    // 蛇形结构
    initializeSnakes() {
        //先全部初始化为0
        this.initializeZero() 
        // 然后设置自吸引和对下一类的吸引
        for (let i = 0; i < this.size; i++) {
            this.set(i, i, 1);  // 自吸引
            this.set(i, (i + 1) % this.size, 0.3);  // 弱吸引下一类型
        }
        this.currentPreset = 'snakes';
    }
  
    // 群集结构
    initializeClusters() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (i === j) {
                    this.values[i][j] = 1;  // 同类强吸引
                } else {
                    this.values[i][j] = -0.5;  // 异类弱排斥
                }
            }
        }
        this.currentPreset = 'clusters';
    }
  
    // 零矩阵
    initializeZero() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, 0);
            }
        }
        this.currentPreset = 'zero';
    }
    
    // 1矩阵
    initializeOne() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, 1);
            }
        }
        this.currentPreset = 'one';
    }
  
    // -1矩阵
    initializeMinusOne() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.set(i, j, -1);
            }
        }
        this.currentPreset = 'minusone';
    }

    // 应用预设
    applyPreset(presetName) {
        if (this.presets[presetName]) {
            this.presets[presetName]();
        }
    }
    
    // 更新矩阵大小
    updateSize(newSize) {
        if (newSize === this.size) return;
        
        // 保存当前值
        const oldValues = this.values;
        const oldSize = this.size;
        
        // 更新大小
        this.size = newSize;
        this.values = Array(newSize).fill().map(() => Array(newSize).fill(0));
        
        // 复制旧值到新矩阵
        const minSize = Math.min(oldSize, newSize);
        for (let i = 0; i < minSize; i++) {
            for (let j = 0; j < minSize; j++) {
                this.values[i][j] = oldValues[i][j];
            }
        }
    }

    // 绘制矩阵可视化
    show(x, y, cellSize) {
        push();
        translate(x, y);
        
        // 确保使用HSB颜色模式
        colorMode(HSB, 360, 100, 100, 255);
        
        // 在矩阵上方和左侧显示粒子颜色条
        // 上方颜色条
        for (let j = 0; j < this.size; j++) {
            // 获取对应颜色
            const speciesColor = settings.getSpeciesColor(j);
            
            // 绘制颜色块
            fill(speciesColor);
            noStroke();
            rect(j * cellSize, -cellSize * 0.8, cellSize, cellSize * 0.6);
            
            // 添加类型索引（白色文本）
            fill(0, 0, 100, 255);
            textAlign(CENTER, CENTER);
            textSize(cellSize * 0.3);
            text(j, j * cellSize + cellSize/2, -cellSize * 0.4);
        }
        
        // 左侧颜色条
        for (let i = 0; i < this.size; i++) {
            // 获取对应颜色
            const speciesColor = settings.getSpeciesColor(i);
            
            // 绘制颜色块
            fill(speciesColor);
            noStroke();
            rect(-cellSize * 0.8, i * cellSize, cellSize * 0.6, cellSize);
            
            // 添加类型索引（白色文本）
            fill(0, 0, 100, 255);
            textAlign(CENTER, CENTER);
            textSize(cellSize * 0.3);
            text(i, -cellSize * 0.4, i * cellSize + cellSize/2);
        }
        
        // 绘制矩阵网格
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const value = this.values[i][j];
                
                // 设置颜色：HSB模式
                if (value > 0) {
                    // 绿色色系（120色相）表示吸引
                    fill(120, 80, value * 100, 255);
                } else {
                    // 红色色系（0色相）表示排斥
                    fill(0, 80, -value * 100, 255);
                }
                
                rect(j * cellSize, i * cellSize, cellSize, cellSize);
                
                // 添加数值标签（白色文本）
                fill(0, 0, 100, 255);
                noStroke();
                textAlign(CENTER, CENTER);
                textSize(cellSize * 0.3);
                text(value.toFixed(1), j * cellSize + cellSize/2, i * cellSize + cellSize/2);
            }
        }

        // 检查鼠标交互
        if (mouseX > x && mouseX < x + this.size * cellSize &&
            mouseY > y && mouseY < y + this.size * cellSize) {
            const i = floor((mouseY - y) / cellSize);
            const j = floor((mouseX - x) / cellSize);
            
            // 高亮当前单元格（白色边框）
            noFill();
            stroke(0, 0, 100, 255);
            strokeWeight(2);
            rect(j * cellSize, i * cellSize, cellSize, cellSize);
            
            // 处理点击
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

    // 打印矩阵（用于调试）
    print() {
        console.log("Interaction Matrix:");
        for (let i = 0; i < this.size; i++) {
            console.log(this.values[i].map(v => v.toFixed(2)).join("\t"));
        }
    }
}