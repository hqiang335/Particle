/*
Settings - Global Configuration and UI Manager for Particleus

This class manages all global parameters, simulation settings, and dynamic UI controls for the Particleus interactive particle system. It provides real-time parameter adjustment, sound and interaction mode toggles, and links between UI and simulation logic.
*/
/**
 * 全局设置类，管理所有参数和UI控制
 */
class Settings {
    constructor() {
        // Basic parameters
        this.particleCount = 300;  // Number of particles per species
        this.speciesCount = 5;     // Number of species
        this.timeStep = 1.0;       // Simulation time step
        this.cellSize = 40;        // Matrix cell size
        this.matrixX = 40;         // Matrix X position
        this.matrixY = 40;         // Matrix Y position
        this.isPaused = false;     // Pause state
        this.showMatrix = true;   // Show matrix or not
        this.boundaryMode = 'wrap'; // Boundary mode: 'wrap' or 'bounce'
        this.transparency= 150;
        // 创建颜色管理器实例
        this.colorManager = new ColorManager(this.transparency);
        
        // Initialization mode
        this.initialization = {
            mode: 'disk',         // 'random', 'disk', 'circle', etc.
            diskRadius: 200,      // Disk/ring radius
            innerRadius: 100,     // Inner radius for ring
            spiralTurns: 6,       // Spiral turns
        };
      
        // Physics parameters
        this.physics = {
            friction: 0.25,
            maxSpeed: 5,          // Fixed value
            maxForce: 1,          // Fixed value
            perceptionRadius: 50,
            collisionRadius: 10,
            collisionForce: 3,
            force: 1.0,           // Base force coefficient
            particleRadius:2,     // Default particle radius
            maxSpeciesCount:8
        };
      
        // World settings
        this.world = {
            background: 0 
        };
      
        // UI layout
        this.ui = {
            labelMargin: 10,
            controlMargin: 100
        };
      
        // Visual effects
        this.effects = {
            trailStrength: 3,     // Trail strength
            haloEnabled: true,    // Enable halo effect
            haloAlpha: 0.15,      // Halo transparency
            haloSizeMultiplier: 3.0, // Halo size multiplier
        };
      
        // Rendering mode
        this.rendering = {
            mode: 'circle'        // 'circle', 'square', etc.
        };
      
        // Interaction settings
        this.interaction = {
            mode: 'mouse',        // 'mouse' or 'hand'
            dragRadius: 50,
            dragStrength: 0.2,
            dragSpread: 5
        };
        
        // 标签元素存储
        this.labelElements = {};
        
        // Audio control
        this.audio = {
            enabled: false,        // Enable audio (default off)
            level: 0,             // Current audio level
            smoothedLevel: 0,     // Smoothed audio level
            sizeFactor: 1.0,      // Particle size factor
            forceMultiplier: 1.0  // Audio force multiplier
        };
        
        // 初始化UI
        this.setupUI();
    }
    
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Setup all UI controls and event bindings
    setupUI() {
        const controlPanel = select('.control-panel');
        this.controls = {};
        // Button group
        const buttonGroup = createDiv();
        buttonGroup.parent(controlPanel);
        buttonGroup.class('control-group');
        createP('Controls').parent(buttonGroup).class('control-group-title');
        this.controls.pauseButton = createButton('Pause');
        this.controls.resetButton = createButton('Reset Random Matrix');
        this.controls.boundaryButton = createButton('Boundary Mode: Wrap');
        this.controls.matrixButton = createButton('Show Matrix');
        this.controls.reinitButton = createButton('Reinitialize Particles');
        this.controls.audioToggle = createButton('Sound Interaction: Off');
        this.controls.interactionModeButton = createButton('Grab Mode: Mouse');
        this.controls.audioToggle.parent(buttonGroup);
        this.controls.pauseButton.parent(buttonGroup);
        this.controls.resetButton.parent(buttonGroup);
        this.controls.boundaryButton.parent(buttonGroup);
        this.controls.matrixButton.parent(buttonGroup);
        this.controls.reinitButton.parent(buttonGroup);
        this.controls.audioToggle.parent(buttonGroup);
        this.controls.interactionModeButton.parent(buttonGroup);
        // Grab Mode help button (question mark, circular)
        const grabHelpButton = createButton('?');
        grabHelpButton.parent(buttonGroup);
        grabHelpButton.style('width', '22px');
        grabHelpButton.style('height', '22px');
        grabHelpButton.style('border-radius', '50%'); // Make the button circular
        grabHelpButton.style('background', '#444');
        grabHelpButton.style('color', '#fff');
        grabHelpButton.style('font-weight', 'bold');
        grabHelpButton.style('border', 'none');
        grabHelpButton.style('cursor', 'pointer');
        grabHelpButton.style('margin-left', '2px');
        grabHelpButton.attribute('title', 'Grab Mode Help');
        // Custom popover for Grab Mode help
        let grabHelpPopover = null;
        grabHelpButton.mousePressed(() => {
            if (grabHelpPopover && grabHelpPopover.elt.style.display !== 'none') {
                grabHelpPopover.hide();
                return;
            }
            if (!grabHelpPopover) {
                grabHelpPopover = createDiv();
                grabHelpPopover.parent(document.body);
                grabHelpPopover.style('position', 'absolute');
                grabHelpPopover.style('z-index', '9999');
                grabHelpPopover.style('background', '#222');
                grabHelpPopover.style('color', '#fff');
                grabHelpPopover.style('padding', '14px 18px');
                grabHelpPopover.style('border-radius', '8px');
                grabHelpPopover.style('box-shadow', '0 2px 12px rgba(0,0,0,0.25)');
                grabHelpPopover.style('font-size', '15px');
                grabHelpPopover.style('max-width', '340px');
                grabHelpPopover.style('line-height', '1.6');
                grabHelpPopover.html(
`<b>Grab Mode Usage Guide</b><br><br>
<ul style='padding-left:18px;margin:0;'>
<li><b>Grab Mode: Mouse</b> — Drag particles using the mouse.</li>
<li><b>Grab Mode: Hand</b> — Use your web camera to track the center of your hand. You can push particles within the drag radius using your hand.</li>
</ul>
<div style='margin-top:8px;'>The <b>drag radius</b> can be adjusted in the "Basic Parameters" section below.</div>`);
                grabHelpPopover.hide();
            }
            // Position the popover above the help button
            const rect = grabHelpButton.elt.getBoundingClientRect();
            grabHelpPopover.position(rect.left + window.scrollX - grabHelpPopover.elt.offsetWidth/2 + rect.width/2, rect.top + window.scrollY - grabHelpPopover.elt.offsetHeight - 12);
            grabHelpPopover.show();
            // Hide popover when clicking elsewhere
            const hidePopover = (e) => {
                if (!grabHelpPopover.elt.contains(e.target) && e.target !== grabHelpButton.elt) {
                    grabHelpPopover.hide();
                    document.removeEventListener('mousedown', hidePopover);
                }
            };
            setTimeout(() => {
                document.addEventListener('mousedown', hidePopover);
            }, 0);
        });
        // Button events
        this.controls.pauseButton.mousePressed(() => {
            this.isPaused = !this.isPaused;
            this.controls.pauseButton.html(this.isPaused ? 'Continue' : 'Pause');
        });
        this.controls.resetButton.mousePressed(() => this.reset());
        this.controls.boundaryButton.mousePressed(() => {
            this.toggleBoundaryMode();
            this.controls.boundaryButton.html(this.boundaryMode === 'wrap' ? 'Boundary Mode: Wrap' : 'Boundary Mode: Bounce');
        });
        this.controls.matrixButton.mousePressed(() => {
            this.showMatrix = !this.showMatrix;
            this.controls.matrixButton.html(this.showMatrix ? 'Hide Matrix' : 'Show Matrix');
        });
        this.controls.reinitButton.mousePressed(() => resetSimulation());
        this.controls.audioToggle.mousePressed(() => {
            this.audio.enabled = !this.audio.enabled;
            this.controls.audioToggle.html(this.audio.enabled ? 'Sound Interaction: On' : 'Sound Interaction: Off');
            // Reset audio parameters if disabled
            if (this.audio.enabled) {
                if (typeof mic !== 'undefined' && mic && !mic.enabled) {
                    mic.start(() => {
                        if (typeof fft !== 'undefined' && fft) fft.setInput(mic);
                        audioInitialized = true;
                    });
                }
            } else {
                this.audio.level = 0;
                this.audio.smoothedLevel = 0;
                this.audio.sizeFactor = 1.0;
                this.audio.forceMultiplier = 1.0;
            }
        });
        this.controls.interactionModeButton.mousePressed(() => this.toggleInteractionMode());
        // Sound interaction group
        const soundGroup = createDiv();
        soundGroup.parent(controlPanel);
        soundGroup.class('control-group');
        const soundTitleRow = createDiv();
        soundTitleRow.parent(soundGroup);
        soundTitleRow.style('display', 'flex');
        soundTitleRow.style('align-items', 'center');
        const soundTitle = createP('Sound Interaction');
        soundTitle.parent(soundTitleRow);
        soundTitle.style('margin', '0 8px 0 0');
        // Help button (question mark, circular)
        const helpButton = createButton('?');
        helpButton.parent(soundTitleRow);
        helpButton.style('width', '22px');
        helpButton.style('height', '22px');
        helpButton.style('border-radius', '50%'); // Make the button circular
        helpButton.style('background', '#444');
        helpButton.style('color', '#fff');
        helpButton.style('font-weight', 'bold');
        helpButton.style('border', 'none');
        helpButton.style('cursor', 'pointer');
        helpButton.style('margin-left', '2px');
        helpButton.attribute('title', 'Sound Interaction Help');
        // Custom popover for help
        let helpPopover = null;
        helpButton.mousePressed(() => {
            if (helpPopover && helpPopover.elt.style.display !== 'none') {
                helpPopover.hide();
                return;
            }
            if (!helpPopover) {
                helpPopover = createDiv();
                helpPopover.parent(document.body);
                helpPopover.style('position', 'absolute');
                helpPopover.style('z-index', '9999');
                helpPopover.style('background', '#222');
                helpPopover.style('color', '#fff');
                helpPopover.style('padding', '14px 18px');
                helpPopover.style('border-radius', '8px');
                helpPopover.style('box-shadow', '0 2px 12px rgba(0,0,0,0.25)');
                helpPopover.style('font-size', '15px');
                helpPopover.style('max-width', '320px');
                helpPopover.style('line-height', '1.6');
                helpPopover.html(
`<b>Sound Interaction Usage Guide</b><br><br>
<ul style='padding-left:18px;margin:0;'>
<li><b>Sound Interaction Off</b> + <b>Music Mode Off</b>: No sound interaction, no music.</li>
<li><b>Sound Interaction Off</b> + <b>Music Mode On</b>: No sound interaction, music plays.</li>
<li><b>Sound Interaction On</b> + <b>Music Mode Off</b>: Sound interaction via microphone, no music.</li>
<li><b>Sound Interaction On</b> + <b>Music Mode On</b>: Interact with music, music plays.</li>
</ul>
<div style='margin-top:8px;'><b>Music:</b> Subwoofer Lullaby</div>`);
                helpPopover.hide();
            }
            // Position the popover above the help button
            const rect = helpButton.elt.getBoundingClientRect();
            helpPopover.position(rect.left + window.scrollX - helpPopover.elt.offsetWidth/2 + rect.width/2, rect.top + window.scrollY - helpPopover.elt.offsetHeight - 12);
            helpPopover.show();
            // Hide popover when clicking elsewhere
            const hidePopover = (e) => {
                if (!helpPopover.elt.contains(e.target) && e.target !== helpButton.elt) {
                    helpPopover.hide();
                    document.removeEventListener('mousedown', hidePopover);
                }
            };
            setTimeout(() => {
                document.addEventListener('mousedown', hidePopover);
            }, 0);
        });
        this.controls.audioToggle.parent(soundGroup);
        this.controls.musicModeButton = createButton('Music Mode: Off');
        this.controls.musicModeButton.parent(soundGroup);
        this.controls.musicModeButton.mousePressed(() => {
            if (typeof this.onMusicModeToggle === 'function') this.onMusicModeToggle();
        });
        // Preset & display group
        const presetGroup = createDiv();
        presetGroup.parent(controlPanel);
        presetGroup.class('control-group');
        createP('Presets & Display').parent(presetGroup).class('control-group-title');
        // Color scheme selector
        const colorSchemeContainer = createDiv();
        colorSchemeContainer.parent(presetGroup);
        createP('Color Scheme').parent(colorSchemeContainer);
        this.controls.colorScheme = createSelect();
        this.controls.colorScheme.parent(colorSchemeContainer);
        this.colorManager.getSchemeNames().forEach(scheme => {
            this.controls.colorScheme.option(scheme);
            let option = this.controls.colorScheme.elt.querySelector(`option[value="${scheme}"]`);
            option.title = this.colorManager.getSchemeDescription(scheme);
        });
        this.controls.colorScheme.selected(this.colorManager.currentScheme);
        this.controls.colorScheme.changed(() => this.updateColorScheme());
        // Initialization mode selector
        const initModeContainer = createDiv();
        initModeContainer.parent(presetGroup);
        createP('Initialization Mode').parent(initModeContainer);
        this.controls.initMode = createSelect();
        this.controls.initMode.parent(initModeContainer);
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
            resetSimulation();
        });
        // Render mode selector
        const renderModeContainer = createDiv();
        renderModeContainer.parent(presetGroup);
        createP('Particle Render Mode').parent(renderModeContainer);
        this.controls.renderMode = createSelect();
        this.controls.renderMode.parent(renderModeContainer);
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
        // Matrix preset selector
        const matrixPresetContainer = createDiv();
        matrixPresetContainer.parent(presetGroup);
        createP('Matrix Preset').parent(matrixPresetContainer);
        this.controls.matrixPreset = createSelect();
        this.controls.matrixPreset.parent(matrixPresetContainer);
        ['random', 'symmetry', 'chains', 'snakes', 'clusters', 'zero', 'one', 'minusone'].forEach(preset => {
            this.controls.matrixPreset.option(preset);
        });
        this.controls.matrixPreset.changed(() => this.updateMatrixPreset());
        // Basic parameters group
        const basicGroup = createDiv();
        basicGroup.parent(controlPanel);
        basicGroup.class('control-group');
        createP('Basic Parameters').parent(basicGroup).class('control-group-title');
        Object.assign(this.controls, {
            particleCount: this.createSliderWithLabel(basicGroup, 'Particles per Species', 20, 800, this.particleCount, 20),
            speciesCount: this.createSliderWithLabel(basicGroup, 'Species Count', 1, 8, this.speciesCount, 1),
            particleRadius: this.createSliderWithLabel(basicGroup, 'Particle Radius', 0.1, 15, this.physics.particleRadius, 0.1),
            friction: this.createSliderWithLabel(basicGroup, 'Friction', 0, 1, this.physics.friction, 0.1),
            perceptionRadius: this.createSliderWithLabel(basicGroup, 'Perception Radius', 10, 100, this.physics.perceptionRadius, 1),
            collisionForce: this.createSliderWithLabel(basicGroup, 'Collision Force', 1, 10, this.physics.collisionForce, 0.1),
            dragRadius: this.createSliderWithLabel(basicGroup, 'Drag Radius', 20, 100, this.interaction.dragRadius, 5),
            trailStrength: this.createSliderWithLabel(basicGroup, 'Trail Strength', 0, 5, this.effects.trailStrength, 0.5),
            haloEnabled: this.createCheckboxWithLabel(basicGroup, 'Enable Halo Effect', this.effects.haloEnabled),
            haloAlpha: this.createSliderWithLabel(basicGroup, 'Halo Alpha', 0.01, 0.5, this.effects.haloAlpha, 0.01),
            haloSizeMultiplier: this.createSliderWithLabel(basicGroup, 'Halo Size Multiplier', 1, 6, this.effects.haloSizeMultiplier, 0.1),
        });
    }

    // Create slider with label and value display
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
        slider.input(() => {
            valueDisplay.html(slider.value());
        });
        return slider;
    }

    // Create checkbox with label
    createCheckboxWithLabel(parent, label, checked) {
        const container = createDiv();
        container.parent(parent);
        const labelElement = createP(label);
        labelElement.parent(container);
        const checkbox = createCheckbox('', checked);
        checkbox.parent(container);
        return checkbox;
    }
    
    // Create label elements for UI
    createLabelElements() {
        this.labelElements.colorScheme = createP('Color Scheme');
        this.labelElements.matrixPreset = createP('Matrix Preset');
        const sliderLabels = {
            particleCount: 'Particles per Species',
            friction: 'Friction',
            perceptionRadius: 'Perception Radius',
            collisionForce: 'Collision Force',
            speciesCount:'Species Count',
            particleRadius:'Particle Radius'
        };
        Object.entries(sliderLabels).forEach(([key, label]) => {
            this.labelElements[key] = createP(label);
            this.styleLabelElement(this.labelElements[key]);
        });
        this.labelElements.dragRadius = createP('Drag Radius');
        this.styleLabelElement(this.labelElements.dragRadius);
        this.labelElements.trailStrength = createP('Trail Strength');
        this.styleLabelElement(this.labelElements.trailStrength);
        this.styleLabelElement(this.labelElements.colorScheme);
        this.styleLabelElement(this.labelElements.matrixPreset);
    }
    
    // Style label element
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

    // Reset parameters to default
    reset() {
        this.controls.particleCount.value(this.particleCount);
        Object.keys(this.physics).forEach(key => {
            if (this.controls[key]) {
                this.physics[key] = this.controls[key].value();
            }
        });
        matrix.initializeRandom();
    }

    // Update all parameter values from UI
    update() {
        this.particleCount = this.controls.particleCount.value();
        this.physics.friction = this.controls.friction.value();
        this.physics.perceptionRadius = this.controls.perceptionRadius.value();
        this.physics.collisionForce = this.controls.collisionForce.value();
        this.physics.particleRadius = this.controls.particleRadius.value();
        this.interaction.dragRadius = this.controls.dragRadius.value();
        this.effects.trailStrength = this.controls.trailStrength.value();
        this.effects.haloEnabled = this.controls.haloEnabled.checked();
        this.effects.haloAlpha = this.controls.haloAlpha.value();
        this.effects.haloSizeMultiplier = this.controls.haloSizeMultiplier.value();
        this.rendering.mode = this.controls.renderMode.value();
    }

    // Get color for species by index
    getSpeciesColor(index) {
        return this.colorManager.getColor(index);
    }

    // Toggle interaction mode
    toggleInteractionMode() {
        this.interaction.mode = this.interaction.mode === 'mouse' ? 'hand' : 'mouse';
        this.controls.interactionModeButton.html('Mode: ' + (this.interaction.mode === 'mouse' ? 'Mouse' : 'Hand'));
    }
} 