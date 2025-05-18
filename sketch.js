let particles = [];
let species = [];
let interactionMatrix;
let quadtreeManager; // 四叉树管理器
let settings; // 全局设置对象
let resetButton, pauseButton, mutateButton, wrapButton;
let particleSlider, forceSlider, collisionSlider,colorSlider;
let particleValue, forceValue, collisionValue,colorValue;
let fpsCounter;
let matrix;
//手势抓取
let isDragging = false;
let draggedParticles = [];
let handpose;
let video;
let hands=[];
let handX = 0, handY = 0;
// 添加手势平滑处理相关变量
let smoothedHandX = 0;
let smoothedHandY = 0;
let handSmoothingFactor = 0.3; // 平滑系数，可以根据需要调整
let lastHandUpdateTime = 0;
let handUpdateInterval = 1000 / 30; // 限制手势更新频率为30fps
// 音频分析相关变量
let mic;
let fft;
let frequencyBands = 32; // 频率带数量
let audioInitialized = false; // 音频是否已初始化
let audioLevel = 0; // 音频水平
let smoothedAudioLevel = 0; // 平滑后的音频水平
let audioForceMultiplier = 1.0; // 音频力值乘数
let sizeFactor = 1.0; // 粒子大小系数
// 添加鼠标拖动相关变量
let isMouseDragging = false;
let mouseOffset = createVector(0, 0);

function preload(){
    handpose = ml5.handPose({flipped:true});
}

function gotHands(results){
    hands = results;
}

function setup() {
    // 初始化设置和矩阵
    settings = new Settings();
    
    // 创建画布并放置在canvas-container中
    const canvas = createCanvas(settings.world.width, settings.world.height);
    canvas.parent('canvas-container');
    
    // 设置画布样式
    const canvasElement = document.querySelector('canvas');
    canvasElement.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    canvasElement.style.borderRadius = '12px';

    
    // 初始化音频分析
    try {
        // 创建音频输入
        mic = new p5.AudioIn();
        
        // 设置音频输入音量
        mic.amp(1.0);
        
        // 启动音频输入
        mic.start(function() {
            // 创建FFT分析器
            fft = new p5.FFT(0.8, frequencyBands);
            fft.setInput(mic);
            
            // 设置音频系统状态
            audioInitialized = true;
        }, function(err) {
            console.error('麦克风启动失败:', err);
        });
    } catch (e) {
        console.error('创建音频输入失败:', e);
    }
    
    matrix = new Matrix(settings.speciesCount);
    
    // 初始化交互矩阵
    interactionMatrix = new Matrix(settings.controls.speciesCount.value());
    interactionMatrix.print(); // 打印初始矩阵
    
    // 初始化四叉树管理器
    quadtreeManager = new QuadTreeManager(width, height, 4);
    
    // 初始化物种和粒子
    resetSimulation();
    // 初始化手势
    video = createCapture(VIDEO);
    video.size(width,height);
    video.hide();
    handpose.detectStart(video,gotHands)
}

function draw() {
    
    // 分析音频
    if (audioInitialized && fft && settings.audio.enabled) {
        try {
            // 获取当前音频水平并平滑处理
            let currentLevel = mic.getLevel();
            
            // 平滑处理音频水平
            smoothedAudioLevel = lerp(smoothedAudioLevel, currentLevel, 0.1);
            audioLevel = smoothedAudioLevel;
            
            // 更新粒子大小系数和力值乘数
            sizeFactor = map(audioLevel, 0, 1, 1, 20);
            audioForceMultiplier = map(audioLevel, 0, 1, 1.0, 100.0);
            
            // 更新设置中的音频参数
            settings.audio.level = audioLevel;
            settings.audio.smoothedLevel = smoothedAudioLevel;
            settings.audio.sizeFactor = sizeFactor;
            settings.audio.forceMultiplier = audioForceMultiplier;
        } catch (e) {
            console.error('音频分析错误:', e);
        }
    } else if (!settings.audio.enabled) {
        // 如果音频被禁用，使用默认值
        settings.audio.level = 0;
        settings.audio.smoothedLevel = 0;
        settings.audio.sizeFactor = 1.0;
        settings.audio.forceMultiplier = 1.0;
    }
    
    // 反转透明度计算：值越大，透明度越大（拖尾越明显）
    push();
    noStroke();
    // 将trailStrength映射到透明度范围
    let alpha = map(settings.effects.trailStrength, 0, 8, 255, 0);
    // 使用黑色背景，透明度随trailStrength增加而减小
    fill(0, alpha);
    rect(0, 0, width, height);
    pop();
    
    // 更新设置
    settings.update();
    
    // 如果粒子数量改变，重新创建粒子
    if (particles.length / settings.speciesCount !== settings.particleCount) {
        createParticles();
    }
    
    // 显示矩阵（如果启用）
    if (settings.showMatrix) {
        matrix.show(settings.matrixX, settings.matrixY, settings.cellSize);
    }
    
    // 如果未暂停，更新粒子
    if (!settings.isPaused) {
        // 更新四叉树
        quadtreeManager.update(particles);
        
        // 更新所有粒子
        for (let particle of particles) {
            // 使用四叉树获取周围粒子
            let nearbyParticles = quadtreeManager.query(particle.pos.x, particle.pos.y, settings.physics.perceptionRadius);
            
            // 计算和应用力
            particle.interact(nearbyParticles);
        }
        
        // 更新粒子位置
        for (let particle of particles) {
            particle.update();
            particle.show();
        }
    } else {
        // 即使暂停也显示粒子
        for (let particle of particles) {
            particle.show();
        }
    }
    
    // 更新显示
    updateDisplays();
    
    // 更新物理参数
    settings.physics.collisionForce = settings.controls.collisionForce.value();
    
    // 手势抓取
    if(settings.interaction.mode === 'hand' && hands.length > 0) {
        let currentTime = millis();
        // 限制手势更新频率
        if (currentTime - lastHandUpdateTime >= handUpdateInterval) {
            let hand = hands[0];
            let index = hand.index_finger_tip;
            let thumb = hand.thumb_tip;
            
            let d = dist(index.x, index.y, thumb.x, thumb.y);
            
            // 计算新的手势位置
            handX = (index.x + thumb.x)/2;
            handY = (index.y + thumb.y)/2;
            
            // 应用平滑处理
            smoothedHandX = lerp(smoothedHandX, handX, handSmoothingFactor);
            smoothedHandY = lerp(smoothedHandY, handY, handSmoothingFactor);
            
            // 显示手势位置指示点
            push();
            colorMode(RGB, 255);
            noStroke();
            fill(255, 0, 0);
            circle(smoothedHandX, smoothedHandY, 16);
            pop();
            
            // 显示手势范围圆圈
            push();
            colorMode(RGB, 255);
            noFill();
            if(d < 50) { // 抓取状态
                isDragging = true;
                stroke(255, 255, 255); 
            } else {
                isDragging = false;
                stroke(255, 255, 255,0); 
            }
            strokeWeight(2);
            circle(smoothedHandX, smoothedHandY, settings.interaction.dragRadius * 2);
            pop();
            
            lastHandUpdateTime = currentTime;
        }
    }
    
    // 鼠标模式显示
    if(settings.interaction.mode === 'mouse') {
        push();
        colorMode(RGB, 255); 
        noFill();
        if(isMouseDragging) {
            stroke(255, 255, 255); 
        } else {
            stroke(255, 255, 255,0); 
        }
        strokeWeight(2);
        circle(mouseX, mouseY, settings.interaction.dragRadius * 2);
        
        // 显示鼠标位置指示点
        // noStroke();
        // fill(255, 0, 0);
        // circle(mouseX, mouseY, 8);
        pop();
    }
    
    //条件判断
    if(settings.interaction.mode === 'hand') {
        if(isDragging){
            handDragged();
        } else {
            handReleased();
        }
    } else if(settings.interaction.mode === 'mouse' && isMouseDragging) {
        mouseDragged();
    }
}

function resetSimulation() {
    // 创建粒子
    createParticles();
    
    // 初始化四叉树
    quadtreeManager.rebuild();
    quadtreeManager.update(particles);
}

function togglePause() {
    settings.isPaused = !settings.isPaused;
    pauseButton.html(settings.isPaused ? '继续' : '暂停');
}

function toggleWrapMode() {
    settings.boundaryMode = settings.boundaryMode === 'wrap' ? 'bounce' : 'wrap';
    wrapButton.html(settings.boundaryMode === 'wrap' ? '边界模式: 环绕' : '边界模式: 弹性');
}

function regenerateMatrix() {
    interactionMatrix.initializeRandom();
    interactionMatrix.print(); // 打印新矩阵
}

function updateDisplays() {
    // 更新粒子数量显示
    if (settings.controls.particleCount.value() !== settings.particleCount) {
        settings.particleCount = settings.controls.particleCount.value();
        resetSimulation();
    }
    
    // 更新物种数量
    if(settings.controls.speciesCount.value() !== settings.speciesCount) {
        let oldSpeciesCount = settings.speciesCount;
        settings.speciesCount = settings.controls.speciesCount.value();
        
        // 更新矩阵大小
        if (matrix.size !== settings.speciesCount) {
            if (typeof matrix.updateSize === 'function') {
                matrix.updateSize(settings.speciesCount);
            } else {
                matrix = new Matrix(settings.speciesCount);
            }
        }
        
        console.log(`Species count changed from ${oldSpeciesCount} to ${settings.speciesCount}`);
        resetSimulation();
    }
}

// 根据初始化模式生成粒子位置
function initializeParticlePosition(type, index, totalParticles) {
    const w = width;
    const h = height;
    const centerX = w / 2;
    const centerY = h / 2;
    const buffer = settings.physics.particleRadius * 2;
    const diskRadius = settings.initialization.diskRadius;
    const innerRadius = settings.initialization.innerRadius;
    const spiralTurns = settings.initialization.spiralTurns;
    
    // 类型百分比
    const typePercent = type / settings.speciesCount;
    // 粒子在其类型中的百分比位置
    const particlePercent = index / settings.particleCount;
    // 粒子在总体中的百分比位置
    const globalPercent = (type * settings.particleCount + index) / (settings.speciesCount * settings.particleCount);
    
    let x, y;
    
    switch (settings.initialization.mode) {
        case 'random':
            // 随机分布在整个画布上
            x = buffer + random(w - buffer * 2);
            y = buffer + random(h - buffer * 2);
            break;
            
        case 'disk':
            // 在圆盘中分布
            // 使用平方根使分布均匀
            const radius = sqrt(random()) * diskRadius;
            const angle = random(TWO_PI);
            x = centerX + radius * cos(angle);
            y = centerY + radius * sin(angle);
            break;
            
        case 'ring':
            // 在圆环上分布
            // 均匀分布在圆上
            const circleAngle = globalPercent * TWO_PI;
            x = centerX + diskRadius * cos(circleAngle);
            y = centerY + diskRadius * sin(circleAngle);
            break;
            
            
        case 'bottom':
            // 在底部分布
            x = buffer + globalPercent * (w - buffer * 2);
            y = h - buffer;
            break;
            
        case 'edges':
            // 在边缘分布
            if (random() < 0.5) {
                // 左右边缘
                y = buffer + random(h - buffer * 2);
                x = random() < 0.5 ? buffer : w - buffer;
            } else {
                // 上下边缘
                x = buffer + random(w - buffer * 2);
                y = random() < 0.5 ? buffer : h - buffer;
            }
            break;
            
        case 'stripes':
            // 水平条纹分布，每个物种一行
            x = buffer + particlePercent * (w - buffer * 2);
            // 每个物种一行
            y = buffer + typePercent * (h - buffer * 2);
            break;
            
            
        case 'spiral':
            // 螺旋分布
            // 所有粒子线性分布在整个螺旋上
            const spiralPosition = globalPercent;
            
            const spiralAngle = spiralPosition * TWO_PI * spiralTurns;
            const spiralRadius = (spiralPosition * diskRadius) / spiralTurns*10;
            
            x = centerX + spiralRadius * cos(spiralAngle);
            y = centerY + spiralRadius * sin(spiralAngle);
            break;
            
        default:
            // 默认随机分布
            x = buffer + random(w - buffer * 2);
            y = buffer + random(h - buffer * 2);
    }
    
    return createVector(x, y);
}

function createParticles() {
    particles = [];
    for (let type = 0; type < settings.speciesCount; type++) {
        for (let i = 0; i < settings.particleCount; i++) {
            // 使用新的初始化位置函数
            const position = initializeParticlePosition(type, i, settings.particleCount);
            particles.push(new Particle(
                position.x,
                position.y,
                type
            ));
        }
    }
}

function handDragged() {
    if (smoothedHandX < width && smoothedHandY < height) {
        isDragging = true;
        
        // 使用四叉树查找范围内的粒子
        let nearbyParticles = quadtreeManager.query(
            smoothedHandX, 
            smoothedHandY, 
            settings.interaction.dragRadius
        );
        
        // 从四叉树查询结果中过滤出实际在范围内的粒子
        draggedParticles = nearbyParticles.filter(p => {
            let d = dist(smoothedHandX, smoothedHandY, p.pos.x, p.pos.y);
            return d < settings.interaction.dragRadius;
        });
        
        // 在拖动时增加被选中粒子的光晕大小
        if (settings.effects.haloEnabled) {
            draggedParticles.forEach(p => {
                // 临时增加光晕大小，当释放鼠标时会还原
                p.tempHaloMultiplier = settings.effects.haloSizeMultiplier * 1.5;
                
                // 计算到手势中心的偏移量
                if (!p.dragOffset) {
                    p.dragOffset = createVector(
                        p.pos.x - smoothedHandX,
                        p.pos.y - smoothedHandY
                    );
                }
                
                // 使用平滑的手势位置更新粒子位置
                p.pos.x = smoothedHandX + p.dragOffset.x;
                p.pos.y = smoothedHandY + p.dragOffset.y;
            });
        }
    }
}

function handReleased() {
    isDragging = false;
    // 清除所有被拖动粒子的偏移量和临时光晕增强
    draggedParticles.forEach(p => {
        p.dragOffset = null;
        p.tempHaloMultiplier = null;
    });
    draggedParticles = [];
}

// 添加鼠标事件处理函数
function mousePressed() {
    if(settings.interaction.mode === 'mouse') {
        isMouseDragging = true;
        // 使用四叉树查找范围内的粒子
        let nearbyParticles = quadtreeManager.query(
            mouseX, 
            mouseY, 
            settings.interaction.dragRadius
        );
        
        // 从四叉树查询结果中过滤出实际在范围内的粒子
        draggedParticles = nearbyParticles.filter(p => {
            let d = dist(mouseX, mouseY, p.pos.x, p.pos.y);
            return d < settings.interaction.dragRadius;
        });
        
        // 记录每个粒子相对于鼠标的偏移
        draggedParticles.forEach(p => {
            p.dragOffset = createVector(p.pos.x - mouseX, p.pos.y - mouseY);
        });
    }
}

function mouseReleased() {
    if(settings.interaction.mode === 'mouse') {
        isMouseDragging = false;
        // 清除所有被拖动粒子的偏移量
        draggedParticles.forEach(p => {
            p.dragOffset = null;
            p.tempHaloMultiplier = null;
        });
        draggedParticles = [];
    }
}

function mouseDragged() {
    if(settings.interaction.mode === 'mouse' && isMouseDragging) {
        // 更新被拖动粒子的位置
        draggedParticles.forEach(p => {
            if(p.dragOffset) {
                p.pos.x = mouseX + p.dragOffset.x;
                p.pos.y = mouseY + p.dragOffset.y;
            }
            
            // 添加光晕效果
            if (settings.effects.haloEnabled) {
                p.tempHaloMultiplier = settings.effects.haloSizeMultiplier * 1.5;
            }
        });
    }
}

// 窗口大小改变时调整画布大小
function windowResized() {
    // 获取main-content的尺寸
    const mainContent = document.querySelector('.main-content');
    const mainWidth = mainContent.clientWidth;
    const mainHeight = mainContent.clientHeight;
    
    // 计算新的画布尺寸，保持原始比例
    const aspectRatio = settings.world.width / settings.world.height;
    let newWidth, newHeight;
    
    if (mainWidth / mainHeight > aspectRatio) {
        // 如果容器更宽，以高度为基准
        newHeight = mainHeight * 0.9; // 留出一些边距
        newWidth = newHeight * aspectRatio;
    } else {
        // 如果容器更高，以宽度为基准
        newWidth = mainWidth * 0.9; // 留出一些边距
        newHeight = newWidth / aspectRatio;
    }
    
    // 更新画布尺寸
    resizeCanvas(newWidth, newHeight);
    
    // 更新世界尺寸
    settings.world.width = newWidth;
    settings.world.height = newHeight;
    
    // 重新初始化四叉树系统
    quadtreeManager = new QuadTreeManager(newWidth, newHeight, 4);
}