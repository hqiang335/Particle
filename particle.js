class Particle {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(0.5, 1));
        this.acc = createVector();
        this.type = type;
        
        // 粒子属性
        this.baseRadius = settings.physics.particleRadius;  // 基础半径
        this.radius = this.baseRadius;  // 当前半径
        this.baseColor = settings.getSpeciesColor(type);
        this.baseMaxSpeed = settings.physics.maxSpeed;
        this.maxSpeed = this.baseMaxSpeed;
        
        // 添加拖动相关属性
        this.dragOffset = null;  // 存储相对于鼠标的偏移量
    }
    
    update() {
        // 更新基础半径（从设置中获取）
        this.baseRadius = settings.physics.particleRadius;
        
        // 如果正在被拖动
        if (draggedParticles.includes(this)) {
            // 根据当前交互模式更新位置
            if (settings.interaction.mode === 'hand' && isDragging) {
                // 手势拖动模式
                if (!this.dragOffset) {
                    this.dragOffset = createVector(
                        this.pos.x - handX,
                        this.pos.y - handY
                    );
                }
                
                // 使用存储的偏移量更新位置
                this.pos.x = handX + this.dragOffset.x;
                this.pos.y = handY + this.dragOffset.y;
            } else if (settings.interaction.mode === 'mouse' && isMouseDragging) {
                // 鼠标拖动模式
                if (!this.dragOffset) {
                    this.dragOffset = createVector(
                        this.pos.x - mouseX,
                        this.pos.y - mouseY
                    );
                }
                
                // 使用存储的偏移量更新位置
                this.pos.x = mouseX + this.dragOffset.x;
                this.pos.y = mouseY + this.dragOffset.y;
            }
            
            // 重置速度和加速度
            this.vel.mult(0);
            this.acc.mult(0);
            return;
        }
        
        // 如果不再被拖动，清除偏移量
        this.dragOffset = null;
      
        // 应用摩擦力
        let frictionFactor = 1 - settings.physics.friction;
        this.vel.mult(frictionFactor * settings.audio.forceMultiplier);
      
        // 更新位置
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
        
        // 边界检查
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
            
            // 计算粒子之间的距离，考虑环绕边界
            let d;
            let diff;
            
            if (settings.boundaryMode === 'wrap') {
                // 环绕边界下的距离计算
                let dx = other.pos.x - this.pos.x;
                let dy = other.pos.y - this.pos.y;
                
                // 考虑跨越边界的情况
                if (Math.abs(dx) > width / 2) {
                    dx = dx > 0 ? dx - width : dx + width;
                }
                if (Math.abs(dy) > height / 2) {
                    dy = dy > 0 ? dy - height : dy + height;
                }
                
                diff = createVector(dx, dy);
                d = diff.mag();
            } else {
                // 普通边界下的距离计算
                d = p5.Vector.dist(this.pos, other.pos);
                diff = p5.Vector.sub(other.pos, this.pos);
            }
            
            // 碰撞检测和响应
            if (d < settings.physics.collisionRadius) {
                // 计算碰撞力
                let repulsion = diff.copy().normalize();
                let strength = map(d, 0, settings.physics.collisionRadius, 
                                   settings.physics.collisionForce, 0);
                repulsion.mult(-strength*settings.audio.forceMultiplier); // 注意这里是反方向
                
                // 应用碰撞力
                this.applyForce(repulsion);
                other.applyForce(p5.Vector.mult(repulsion, -1));
            }
          
            // 交互力计算
            if (d < settings.physics.perceptionRadius) {
                // 获取两个粒子类型之间的相互作用力
                if (this.type >= 0 && this.type < matrix.size && other.type >= 0 && other.type < matrix.size) {
                    let interactionForce = matrix.get(this.type, other.type);
                    
                    // 计算力的方向和大小
                    let direction = diff.copy().normalize();
                    
                    // 反比力场
                    let safeDistance = Math.max(d, 0.1);
                    let strength = 1 / safeDistance;
                    
                    // 应用全局力度调整和音频乘数
                    direction.mult(strength * interactionForce * settings.physics.force * settings.audio.forceMultiplier);
                    
                    force.add(direction);
                    total++;
                }
            }
        }
    
        if (total > 0) {
            // 计算合力并应用
            force.div(total);
            // 使用动态最大速度而不是固定值
            force.setMag(this.maxSpeed);
            force.sub(this.vel);
            force.limit(settings.physics.maxForce * settings.audio.forceMultiplier);
            this.applyForce(force);
        }
    }
    
    handleBoundary(){
        if (settings.boundaryMode === 'wrap') {
            // 改进的环绕边界处理
            // 检查是否需要环绕
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
            // 反弹边界 - 使用更平滑的反弹
            let buffer = settings.physics.particleRadius;
            
            if (this.pos.x < buffer) {
                this.vel.x = Math.abs(this.vel.x) * 0.8; // 减少反弹力度，更平滑
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
        
        // 确保使用HSB颜色模式
        colorMode(HSB, 360, 100, 100, 255);
        
        // 计算显示半径：基础半径 * 音频响应系数
        let displayRadius = this.baseRadius;
        if (settings.audio) {
            displayRadius *= settings.audio.sizeFactor;
        }
        
        // 设置填充颜色并关闭轮廓
        fill(col);
        noStroke();
        
        // 根据渲染模式绘制粒子
        switch (settings.rendering.mode) {
            case 'circle':
                // 圆形渲染
                circle(this.pos.x, this.pos.y, displayRadius * 2);
                break;
                
            case 'square':
                // 方形渲染
                rectMode(CENTER);
                // 根据速度方向旋转方块
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
                // 三角形渲染
                // 根据速度方向绘制三角形
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
                // 模拟细胞生物形态
                translate(this.pos.x, this.pos.y);
                // 根据速度方向旋转
                if (this.vel.mag() > 0.1) {
                    rotate(this.vel.heading());
                }
                const size = displayRadius * 2;
                noStroke();
                // 主体
                ellipse(0, 0, size*2 , size*1.2);
                // 伪足突起
                let pseudopodCount = 5; // 伪足数量
                for (let i = 0; i < pseudopodCount; i++) {
                    let angle = TWO_PI / pseudopodCount * i + frameCount * 0.01; // 缓慢旋转
                    let xOff = cos(angle) * size * 0.6;
                    let yOff = sin(angle) * size * 0.6;
                    ellipse(xOff, yOff, size * 0.6, size * 0.6);
                }
                break;
                
            default:
                // 默认圆形渲染
                circle(this.pos.x, this.pos.y, displayRadius * 2);
        }
        
        // 如果启用了光晕效果，渲染光晕
        if (settings.effects.haloEnabled) {
            // 确保在HSB模式下提取颜色值
            colorMode(HSB, 360, 100, 100, 255);
            let h = hue(col);
            let s = saturation(col);
            let b = brightness(col);
            
            // 创建光晕颜色（使用相同的HSB值，但透明度更低）
            let haloColor = color(h, s, b, settings.effects.haloAlpha * 255);
            fill(haloColor);
            noStroke();
            
            // 光晕半径 = 粒子半径 × 光晕大小倍数
            // 如果粒子正在被拖动，使用临时的放大倍数
            let sizeMultiplier = this.tempHaloMultiplier || settings.effects.haloSizeMultiplier;
            let haloRadius = displayRadius * sizeMultiplier;
            
            // 重置变换，确保光晕是圆形的
            resetMatrix();
            circle(this.pos.x, this.pos.y, haloRadius * 2);
            
            // 如果粒子在移动，添加更大的、更透明的第二层光晕
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
    