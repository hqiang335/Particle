/**
 * 全局设置类，管理所有参数和UI控制
 */
class Settings {
    constructor() {
        // 基本参数
        this.particleCount = 300;  // 每种类型的粒子数量
        this.speciesCount = 5;     // 粒子类型数量
        //this.numParticles = 1000;  //粒子总数
        this.timeStep = 1.0;       // 时间步长
        this.cellSize = 40;        // 矩阵可视化单元格大小
        this.matrixX = 40;         // 矩阵显示位置X，增加以留出左侧颜色条空间
        this.matrixY = 40;         // 矩阵显示位置Y，增加以留出上方颜色条空间
        this.isPaused = false;       // 暂停状态
        this.showMatrix = false;      // 是否显示矩阵
        this.boundaryMode = 'wrap'; // 边界模式：'wrap' 或 'bounce'
        this.transparency= 150;
        // 创建颜色管理器实例
        this.colorManager = new ColorManager(this.transparency);
        
        // 初始化模式
        this.initialization = {
            mode: 'disk',         // 初始化模式：'random', 'disk', 'circle', 'bottom', 'edges', 'stripes', 'spiral'
            diskRadius: 200,        // 圆盘/圆环模式下的半径
            innerRadius: 100,       // 圆环模式下的内半径
            spiralTurns: 6,         // 螺旋模式下的旋转圈数
                  };
      
        // 物理参数
        this.physics = {
            friction: 0.25,
            maxSpeed: 5,  // 固定值，不再作为可调参数
            maxForce: 1,  // 固定值，用于限制最大力
            perceptionRadius: 50,
            collisionRadius: 10,
            collisionForce: 1,
            force: 1.0,  // 基础力度系数，控制粒子间相互作用的强度
            particleRadius:2, //粒子默认半径！
            maxSpeciesCount:8
        };
      
        // 世界设置
        this.world = {
            width: 1000,
            height: 800,
            background: 0              // 背景颜色（黑色）
        };
      
        // UI参数
        this.ui = {
            labelMargin: 10,          // 标签与画布边缘的距离
            controlMargin: 100        // 控件与标签之间的距离
        };
      
        // 添加拖尾效果设置
        this.effects = {
            trailStrength: 6,  // 拖尾强度 (0-255，值越大拖尾越强)
            haloEnabled: true, // 是否启用光晕效果
            haloAlpha: 0.15,   // 光晕透明度
            haloSizeMultiplier: 3.0, // 光晕大小倍数（相对于粒子半径）
        };
      
        // 粒子渲染模式
        this.rendering = {
            mode: 'circle'        // 渲染模式：'circle', 'square', 'triangle', 'image'
        };
      
        // 鼠标拖动相关设置
        this.interaction = {
            mode: 'mouse', // 'mouse' 或 'hand'
            dragRadius: 50,
            dragStrength: 0.2,
            dragSpread: 5
        };
        
        // 标签元素存储
        this.labelElements = {};
        
        // 音频控制参数
        this.audio = {
            enabled: true,         // 音频是否启用
            level: 0,             // 当前音频水平
            smoothedLevel: 0,     // 平滑后的音频水平
            sizeFactor: 1.0,      // 粒子大小系数
            forceMultiplier: 1.0  // 音频力值乘数
        };
        
        // 初始化UI
        this.setupUI();
    }
    
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    setupUI() {
        // 创建控制面板容器
        const controlPanel = select('.control-panel');
        
        // 初始化controls对象
        this.controls = {};
        
        // 创建按钮控制组（放在最前面）
        const buttonGroup = createDiv();
        buttonGroup.parent(controlPanel);
        buttonGroup.class('control-group');
        createP('控制').parent(buttonGroup).class('control-group-title');


        // 创建按钮
        this.controls.pauseButton = createButton('暂停/继续');
        this.controls.resetButton = createButton('重置');
        this.controls.boundaryButton = createButton('切换边界模式');
        this.controls.matrixButton = createButton('显示/隐藏矩阵');
        this.controls.reinitButton = createButton('重新初始化粒子');
        this.controls.audioToggle = createButton('麦克风状态：开启');
        this.controls.interactionModeButton = createButton('抓取模式: 鼠标');
        this.controls.audioToggle.parent(buttonGroup);
        

        // 将按钮添加到按钮组
        this.controls.pauseButton.parent(buttonGroup);
        this.controls.resetButton.parent(buttonGroup);
        this.controls.boundaryButton.parent(buttonGroup);
        this.controls.matrixButton.parent(buttonGroup);
        this.controls.reinitButton.parent(buttonGroup);
        this.controls.audioToggle.parent(buttonGroup);
        this.controls.interactionModeButton.parent(buttonGroup);

        // 设置按钮事件
        this.controls.pauseButton.mousePressed(() => this.isPaused = !this.isPaused);
        this.controls.resetButton.mousePressed(() => this.reset());
        this.controls.boundaryButton.mousePressed(() => this.toggleBoundaryMode());
        this.controls.matrixButton.mousePressed(() => this.showMatrix = !this.showMatrix);
        this.controls.reinitButton.mousePressed(() => resetSimulation());
        this.controls.audioToggle.mousePressed(() => {
            this.audio.enabled = !this.audio.enabled;
            this.controls.audioToggle.html(this.audio.enabled ? '麦克风状态：开启' : '麦克风状态：关闭');
            // 如果关闭音频，重置音频相关参数
            if (!this.audio.enabled) {
                this.audio.level = 0;
                this.audio.smoothedLevel = 0;
                this.audio.sizeFactor = 1.0;
                this.audio.forceMultiplier = 1.0;
            }
        });
        this.controls.interactionModeButton.mousePressed(() => this.toggleInteractionMode());

        // 创建预设和显示控制组（放在中间）
        const presetGroup = createDiv();
        presetGroup.parent(controlPanel);
        presetGroup.class('control-group');
        createP('预设与显示').parent(presetGroup).class('control-group-title');

        // 颜色方案选择器
        const colorSchemeContainer = createDiv();
        colorSchemeContainer.parent(presetGroup);
        createP('颜色方案').parent(colorSchemeContainer);
        this.controls.colorScheme = createSelect();
        this.controls.colorScheme.parent(colorSchemeContainer);
        
        // 添加所有颜色方案选项
        this.colorManager.getSchemeNames().forEach(scheme => {
            this.controls.colorScheme.option(scheme);
            let option = this.controls.colorScheme.elt.querySelector(`option[value="${scheme}"]`);
            option.title = this.colorManager.getSchemeDescription(scheme);
        });
        
        this.controls.colorScheme.selected(this.colorManager.currentScheme);
        this.controls.colorScheme.changed(() => this.updateColorScheme());

        // 初始化模式选择器
        const initModeContainer = createDiv();
        initModeContainer.parent(presetGroup);
        createP('初始化模式').parent(initModeContainer);
        this.controls.initMode = createSelect();
        this.controls.initMode.parent(initModeContainer);
        
        // 添加所有初始化模式选项
        const initModes = ['random', 'disk', 'ring', 'top', 'bottom', 'edges', 'stripes', 'grid', 'center', 'spiral'];
        const initModeNames = {
            'random': 'random',
            'disk': 'disk',
            'ring': 'ring',
            'bottom': 'bottom',
            'edges': 'edges',
            'stripes': 'stripes',
            'spiral': 'spiral'
        };
        
        initModes.forEach(mode => {
            this.controls.initMode.option(initModeNames[mode], mode);
        });
        
        this.controls.initMode.selected(this.initialization.mode);
        this.controls.initMode.changed(() => {
            this.initialization.mode = this.controls.initMode.value();
            // 更改初始化模式后重新创建粒子
            resetSimulation();
        });
        
        // 渲染模式选择器
        const renderModeContainer = createDiv();
        renderModeContainer.parent(presetGroup);
        createP('粒子渲染模式').parent(renderModeContainer);
        this.controls.renderMode = createSelect();
        this.controls.renderMode.parent(renderModeContainer);
        
        // 添加所有渲染模式选项
        const renderModes = ['circle', 'square', 'triangle', 'image'];
        const renderModeNames = {
            'circle': 'circle',
            'square': 'square',
            'triangle': 'triangle',
            'image': 'microorganism'
        };
        
        renderModes.forEach(mode => {
            this.controls.renderMode.option(renderModeNames[mode], mode);
        });
        
        this.controls.renderMode.selected(this.rendering.mode);
        this.controls.renderMode.changed(() => {
            this.rendering.mode = this.controls.renderMode.value();
        });

        // 矩阵预设选择器
        const matrixPresetContainer = createDiv();
        matrixPresetContainer.parent(presetGroup);
        createP('矩阵预设').parent(matrixPresetContainer);
        this.controls.matrixPreset = createSelect();
        this.controls.matrixPreset.parent(matrixPresetContainer);
        ['random', 'symmetry', 'chains', 'snakes', 'clusters', 'zero', 'one', 'minusone'].forEach(preset => {
            this.controls.matrixPreset.option(preset);
        });
        this.controls.matrixPreset.changed(() => this.updateMatrixPreset());
        
        // 创建基本参数控制组（放在最后）
        const basicGroup = createDiv();
        basicGroup.parent(controlPanel);
        basicGroup.class('control-group');
        createP('基本参数').parent(basicGroup).class('control-group-title');

        // 添加滑块控件
        Object.assign(this.controls, {
            particleCount: this.createSliderWithLabel(basicGroup, '每类粒子数量', 20, 500, this.particleCount, 20),
            speciesCount: this.createSliderWithLabel(basicGroup, '颜色数量', 1, 8, this.speciesCount, 1),
            particleRadius: this.createSliderWithLabel(basicGroup, '粒子半径', 0.1, 15, this.physics.particleRadius, 0.1),
            
            // 物理参数控制组
            friction: this.createSliderWithLabel(basicGroup, '摩擦力', 0, 1, this.physics.friction, 0.1),
            //maxSpeed: this.createSliderWithLabel(basicGroup, '最大速度', 1, 5, this.physics.maxSpeed, 0.5),
            // maxForce: this.createSliderWithLabel(basicGroup, '最大力', 0.1, 10, this.physics.maxForce, 0.1),
            perceptionRadius: this.createSliderWithLabel(basicGroup, '感知半径', 10, 100, this.physics.perceptionRadius, 1),
            collisionForce: this.createSliderWithLabel(basicGroup, '碰撞力', 0, 10, this.physics.collisionForce, 0.1),
            dragRadius: this.createSliderWithLabel(basicGroup, '拖动范围', 20, 100, this.interaction.dragRadius, 5),
            trailStrength: this.createSliderWithLabel(basicGroup, '粒子拖尾强度', 0, 8, this.effects.trailStrength, 0.5),
            
            // 光晕效果控制组
            haloEnabled: this.createCheckboxWithLabel(basicGroup, '启用光晕效果', this.effects.haloEnabled),
            haloAlpha: this.createSliderWithLabel(basicGroup, '光晕透明度', 0.01, 0.5, this.effects.haloAlpha, 0.01),
            haloSizeMultiplier: this.createSliderWithLabel(basicGroup, '光晕大小', 1, 6, this.effects.haloSizeMultiplier, 0.1),
            
        });
    }

    // 创建带标签和值显示的滑块的辅助方法
    createSliderWithLabel(parent, label, min, max, value, step) {
        const container = createDiv();
        container.parent(parent);
        
        const labelElement = createP(label);
        labelElement.parent(container);
        
        const slider = createSlider(min, max, value, step);
        slider.parent(container);
        
        const valueDisplay = createP(value);
        valueDisplay.parent(container);
        valueDisplay.class('value-display');
        
        // 更新值显示
        slider.input(() => {
            valueDisplay.html(slider.value());
        });
        
        return slider;
    }

    // 创建带标签的复选框
    createCheckboxWithLabel(parent, label, checked) {
        const container = createDiv();
        container.parent(parent);
        
        const labelElement = createP(label);
        labelElement.parent(container);
        
        const checkbox = createCheckbox('', checked);
        checkbox.parent(container);
        
        return checkbox;
    }
    
    /**
     * 创建HTML标签元素
     */
    createLabelElements() {
        // 创建颜色方案和矩阵预设标签
        this.labelElements.colorScheme = createP('颜色方案');
        this.labelElements.matrixPreset = createP('矩阵预设');
        
        // 创建滑块标签
        const sliderLabels = {
            particleCount: '每类粒子数量',
            friction: '摩擦力',
            //maxSpeed: '最大速度',
            // maxForce: '最大力',
            perceptionRadius: '感知半径',
            collisionForce: '碰撞力',
            speciesCount:'颜色数量',
            particleRadius:'粒子半径'
        };
        
        Object.entries(sliderLabels).forEach(([key, label]) => {
            this.labelElements[key] = createP(label);
            this.styleLabelElement(this.labelElements[key]);
        });
        // 添加拖动范围标签
        this.labelElements.dragRadius = createP('拖动范围');
        this.styleLabelElement(this.labelElements.dragRadius);
      
        // 在createLabelElements中添加标签
        this.labelElements.trailStrength = createP('粒子拖尾强度');
        this.styleLabelElement(this.labelElements.trailStrength);
        
        // 给所有标签应用样式
        this.styleLabelElement(this.labelElements.colorScheme);
        this.styleLabelElement(this.labelElements.matrixPreset);
    }
    
    /**
     * 应用标签元素样式
     */
    styleLabelElement(element) {
        element.style('color', 'white');
        element.style('margin', '0');
        element.style('font-size', '14px');
        element.style('font-family', 'Arial, sans-serif');
    }

    updateColorScheme() {
        const selectedScheme = this.controls.colorScheme.value();
        this.colorManager.setScheme(selectedScheme);
    }

    updateMatrixPreset() {
        const preset = this.controls.matrixPreset.value();
        matrix.applyPreset(preset);
    }

    toggleBoundaryMode() {
        this.boundaryMode = this.boundaryMode === 'wrap' ? 'bounce' : 'wrap';
    }

    reset() {
        // 重置所有参数到默认值
        //this.particleCount = 100;
        this.controls.particleCount.value(this.particleCount);
        Object.keys(this.physics).forEach(key => {
            if (this.controls[key]) {
                this.physics[key] = this.controls[key].value();
            }
        });
        matrix.initializeRandom();
    }

    update() {
        // 更新所有参数值
        this.particleCount = this.controls.particleCount.value();
        this.physics.friction = this.controls.friction.value();
        //this.physics.maxSpeed = this.controls.maxSpeed.value();
        // this.physics.maxForce = this.controls.maxForce.value();
        this.physics.perceptionRadius = this.controls.perceptionRadius.value();
        this.physics.collisionForce = this.controls.collisionForce.value();
        this.physics.particleRadius = this.controls.particleRadius.value();
        this.interaction.dragRadius = this.controls.dragRadius.value();
        this.effects.trailStrength = this.controls.trailStrength.value();
        
        // 更新光晕效果设置
        this.effects.haloEnabled = this.controls.haloEnabled.checked();
        this.effects.haloAlpha = this.controls.haloAlpha.value();
        this.effects.haloSizeMultiplier = this.controls.haloSizeMultiplier.value();
        
        // 更新渲染模式
        this.rendering.mode = this.controls.renderMode.value();
    }

    /**
     * 根据索引获取物种颜色
     * @param {number} index - 物种索引
     * @returns {p5.Color} - 返回HSB颜色对象
     */
    getSpeciesColor(index) {
        return this.colorManager.getColor(index);
    }

    toggleInteractionMode() {
        this.interaction.mode = this.interaction.mode === 'mouse' ? 'hand' : 'mouse';
        this.controls.interactionModeButton.html('抓取模式: ' + (this.interaction.mode === 'mouse' ? '鼠标' : '手势'));
    }
} 