/*
Particleus - Interactive Particle Life Sandbox

This project is an interactive particle system sandbox that supports:
- Real-time hand gesture interaction (using ml5.js handPose)
- Audio-driven particle dynamics (microphone or music file input, with adaptive sensitivity)
- Efficient particle-particle and particle-hand interaction using a quadtree spatial partitioning
- Dynamic UI controls for simulation parameters, sound mode, and more

*/

let particles = [];
let species = [];
let interactionMatrix;
let quadtreeManager; // Quadtree manager for spatial queries
let settings; // Global settings object
let resetButton, pauseButton, mutateButton, wrapButton;
let particleSlider, forceSlider, collisionSlider, colorSlider;
let particleValue, forceValue, collisionValue, colorValue;
let fpsCounter;
let matrix;
// Hand gesture
let isDragging = false;
let draggedParticles = [];
let handpose;
let video;
let hands = [];
let handX = 0, handY = 0;
// Hand smoothing
let smoothedHandX = 0;
let smoothedHandY = 0;
let handSmoothingFactor = 0.3; // Smoothing factor for hand position
let lastHandUpdateTime = 0;
let handUpdateInterval = 1000 / 30; // Limit hand update to 30fps
// Audio analysis
let mic, fft, audioInitialized = false;
let musicFile, musicSound;
let useMic = true;
let frequencyBands = 32;
let audioLevel = 0;
let musicLevelMin = 1, musicLevelMax = 0;
let smoothedAudioLevel = 0;
let audioForceMultiplier = 1.0;
let sizeFactor = 1.0;
// Mouse drag
let isMouseDragging = false;
let mouseOffset;

function preload() {
    handpose = ml5.handPose({flipped:true});
    musicSound = loadSound('Subwoofer Lullaby.mp3', () => {
        musicSound.setLoop(true);
    });
}

function gotHands(results) {
    hands = results;
}

function setup() {
    settings = new Settings();
    const mainContent = document.querySelector('.main-content');
    const mainWidth = mainContent ? mainContent.clientWidth : windowWidth;
    const mainHeight = mainContent ? mainContent.clientHeight : windowHeight;
    const canvas = createCanvas(mainWidth, mainHeight);
    canvas.parent('canvas-container');
    const canvasElement = document.querySelector('canvas');
    canvasElement.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    canvasElement.style.borderRadius = '12px';
    mouseOffset = createVector(0, 0);

    // Audio input and FFT
    try {
        mic = new p5.AudioIn();
        mic.amp(1.0);
        mic.start(function() {
            fft = new p5.FFT(0.8, frequencyBands);
            fft.setInput(mic);
            audioInitialized = true;
        }, function(err) {
            console.error('Microphone start failed:', err);
        });
    } catch (e) {
        console.error('Audio input creation failed:', e);
    }
    
    matrix = new Matrix(settings.speciesCount);
    interactionMatrix = new Matrix(settings.controls.speciesCount.value());
    interactionMatrix.print();
    quadtreeManager = new QuadTreeManager(width, height, 4);
    resetSimulation();

    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
    handpose.detectStart(video, gotHands);

    let fileInput = createFileInput(handleFile);
    fileInput.position(10, 10);
    // Music UI event binding
    settings.onMusicModeToggle = () => {
        useMic = !useMic;
        if (useMic) {
            if (musicSound) musicSound.pause();
            if (mic) mic.start(() => fft.setInput(mic));
            settings.controls.musicModeButton.html('Music Mode: Off');
        } else {
            if (mic) mic.stop();
            if (musicSound && !musicSound.isPlaying()) musicSound.play();
            fft.setInput(musicSound);
            settings.controls.musicModeButton.html('Music Mode: On');
        }
    };
}

function draw() {
    // Audio analysis and adaptive mapping
    if (audioInitialized && fft && settings.audio.enabled) {
        try {
            let currentLevel;
            if (useMic) {
                currentLevel = mic.getLevel();
            } else if (musicSound && musicSound.isPlaying()) {
                let spectrum = fft.analyze();
                currentLevel = fft.getEnergy("bass") / 255;
            } else {
                currentLevel = 0;
            }
            smoothedAudioLevel = lerp(smoothedAudioLevel, currentLevel, 0.1);
            audioLevel = smoothedAudioLevel;
            if (useMic) {
                sizeFactor = map(audioLevel, 0, 1, 1, 20);
                audioForceMultiplier = map(audioLevel, 0, 1, 1.0, 20.0);
            } else {
                // Piecewise mapping for music mode: smooth transition, avoid abrupt change
                sizeFactor = piecewiseMap(audioLevel, 0.5, 1, 1, 5, 1);
                audioForceMultiplier = piecewiseMap(audioLevel, 0.5, 1, 1.0, 2, 1.0);
            }
            settings.audio.level = audioLevel;
            settings.audio.smoothedLevel = smoothedAudioLevel;
            settings.audio.sizeFactor = sizeFactor;
            settings.audio.forceMultiplier = audioForceMultiplier;
        } catch (e) {
            console.error('Audio analysis error:', e);
        }
    } else if (!settings.audio.enabled) {
        settings.audio.level = 0;
        settings.audio.smoothedLevel = 0;
        settings.audio.sizeFactor = 1.0;
        settings.audio.forceMultiplier = 1.0;
    }
    // Trailing effect (background alpha)
    push();
    noStroke();
    let alpha = map(settings.effects.trailStrength, 0, 5, 255, 0);
    fill(0, alpha);
    rect(0, 0, width, height);
    pop();
    settings.update();
    if (particles.length / settings.speciesCount !== settings.particleCount) {
        createParticles();
    }
    if (settings.showMatrix) {
        matrix.show(settings.matrixX, settings.matrixY, settings.cellSize);
    }
    if (!settings.isPaused) {
        quadtreeManager.update(particles);
        for (let particle of particles) {
            let nearbyParticles = quadtreeManager.query(particle.pos.x, particle.pos.y, settings.physics.perceptionRadius);
            particle.interact(nearbyParticles);
            particle.update();
            particle.show();
        }
    } else {
        for (let particle of particles) {
            particle.show();
        }
    }
    updateDisplays();
    settings.physics.collisionForce = settings.controls.collisionForce.value();
    // Hand gesture interaction (palm center)
    if (settings.interaction.mode === 'hand' && hands.length > 0) {
        let hand = hands[0];
        let sumX = 0, sumY = 0, n = 0;
        for (let key in hand) {
            if (hand[key] && hand[key].x !== undefined && hand[key].y !== undefined) {
                sumX += hand[key].x;
                sumY += hand[key].y;
                n++;
            }
        }
        let palmX = sumX / n;
        let palmY = sumY / n;
        smoothedHandX = lerp(smoothedHandX, palmX, handSmoothingFactor);
        smoothedHandY = lerp(smoothedHandY, palmY, handSmoothingFactor);
        push();
        colorMode(RGB, 255);
        noStroke();
        fill(0, 200, 255, 40);
        circle(smoothedHandX, smoothedHandY, settings.interaction.dragRadius * 2.5);
        fill(0, 200, 255, 100);
        circle(smoothedHandX, smoothedHandY, 18);
        pop();
        let affectedParticles = quadtreeManager.query(
            smoothedHandX,
            smoothedHandY,
            settings.interaction.dragRadius
        );
        affectedParticles.forEach(p => {
            let pd = dist(smoothedHandX, smoothedHandY, p.pos.x, p.pos.y);
            if (pd < settings.interaction.dragRadius) {
                let dir = createVector(p.pos.x - smoothedHandX, p.pos.y - smoothedHandY);
                dir.normalize();
                let strength = map(pd, 10, settings.interaction.dragRadius, 10, 0);
                dir.mult(strength);
                p.applyForce(dir);
            }
        });
    }
    // Mouse drag visual
    if (settings.interaction.mode === 'mouse') {
        if (settings.effects.trailStrength < 5) {
            push();
            colorMode(RGB, 255);
            noFill();
            if (isMouseDragging) {
                stroke(255, 255, 255);
            } else {
                stroke(255, 255, 255, 0);
            }
            strokeWeight(2);
            circle(mouseX, mouseY, settings.interaction.dragRadius * 2);
            pop();
        }
    }
    if (settings.interaction.mode === 'mouse' && isMouseDragging) {
        mouseDragged();
    }
    // Music mode button status
    if (musicSound && musicSound.isLoaded() && settings.controls.musicModeButton) {
        settings.controls.musicModeButton.html(useMic ? 'Music Mode: Off' : 'Music Mode: On');
    }
}

function resetSimulation() {
    createParticles();
    quadtreeManager.rebuild();
    quadtreeManager.update(particles);
}

function updateDisplays() {
    if (settings.controls.particleCount.value() !== settings.particleCount) {
        settings.particleCount = settings.controls.particleCount.value();
        resetSimulation();
    }
    if (settings.controls.speciesCount.value() !== settings.speciesCount) {
        let oldSpeciesCount = settings.speciesCount;
        settings.speciesCount = settings.controls.speciesCount.value();
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

function initializeParticlePosition(type, index, totalParticles) {
    const w = width;
    const h = height;
    const centerX = w / 2;
    const centerY = h / 2;
    const buffer = settings.physics.particleRadius * 2;
    const diskRadius = settings.initialization.diskRadius;
    const innerRadius = settings.initialization.innerRadius;
    const spiralTurns = settings.initialization.spiralTurns;
    const typePercent = type / settings.speciesCount;
    const particlePercent = index / settings.particleCount;
    const globalPercent = (type * settings.particleCount + index) / (settings.speciesCount * settings.particleCount);
    let x, y;
    switch (settings.initialization.mode) {
        case 'random':
            x = buffer + random(w - buffer * 2);
            y = buffer + random(h - buffer * 2);
            break;
        case 'disk':
            const radius = sqrt(random()) * diskRadius;
            const angle = random(TWO_PI);
            x = centerX + radius * cos(angle);
            y = centerY + radius * sin(angle);
            break;
        case 'ring':
            const circleAngle = globalPercent * TWO_PI;
            x = centerX + diskRadius * cos(circleAngle);
            y = centerY + diskRadius * sin(circleAngle);
            break;
        case 'bottom':
            x = buffer + globalPercent * (w - buffer * 2);
            y = h - buffer;
            break;
        case 'edges':
            if (random() < 0.5) {
                y = buffer + random(h - buffer * 2);
                x = random() < 0.5 ? buffer : w - buffer;
            } else {
                x = buffer + random(w - buffer * 2);
                y = random() < 0.5 ? buffer : h - buffer;
            }
            break;
        case 'stripes':
            x = buffer + particlePercent * (w - buffer * 2);
            y = buffer + typePercent * (h - buffer * 2);
            break;
        case 'spiral':
            const spiralPosition = globalPercent;
            const spiralAngle = spiralPosition * TWO_PI * spiralTurns;
            const spiralRadius = (spiralPosition * diskRadius) / spiralTurns * 10;
            x = centerX + spiralRadius * cos(spiralAngle);
            y = centerY + spiralRadius * sin(spiralAngle);
            break;
        default:
            x = buffer + random(w - buffer * 2);
            y = buffer + random(h - buffer * 2);
    }
    return createVector(x, y);
}

function createParticles() {
    particles = [];
    for (let type = 0; type < settings.speciesCount; type++) {
        for (let i = 0; i < settings.particleCount; i++) {
            const position = initializeParticlePosition(type, i, settings.particleCount);
            particles.push(new Particle(
                position.x,
                position.y,
                type
            ));
        }
    }
}

function mousePressed() {
    if (settings.interaction.mode !== 'mouse') return;
    if (mouseX < width && mouseY < height) {
        isMouseDragging = true;
        draggedParticles = particles.filter(p => {
            let d = dist(mouseX, mouseY, p.pos.x, p.pos.y);
            return d < settings.interaction.dragRadius;
        });
        if (settings.effects.haloEnabled) {
            draggedParticles.forEach(p => {
                p.tempHaloMultiplier = settings.effects.haloSizeMultiplier * 1.5;
                p.dragOffset = createVector(p.pos.x - mouseX, p.pos.y - mouseY);
            });
        }
    }
}

function mouseReleased() {
    if (settings.interaction.mode !== 'mouse') return;
    if (settings.interaction.mode === 'mouse') {
        isMouseDragging = false;
        draggedParticles.forEach(p => {
            p.dragOffset = null;
            p.tempHaloMultiplier = null;
        });
        draggedParticles = [];
    }
}

function mouseDragged() {
    if (settings.interaction.mode !== 'mouse') return;
    if (settings.interaction.mode === 'mouse' && isMouseDragging) {
        draggedParticles.forEach(p => {
            if (p.dragOffset) {
                p.pos.x = mouseX + p.dragOffset.x;
                p.pos.y = mouseY + p.dragOffset.y;
            }
            if (settings.effects.haloEnabled) {
                p.tempHaloMultiplier = settings.effects.haloSizeMultiplier * 1.5;
            }
        });
    }
}

function windowResized() {
    const mainContent = document.querySelector('.main-content');
    const mainWidth = mainContent ? mainContent.clientWidth : windowWidth;
    const mainHeight = mainContent ? mainContent.clientHeight : windowHeight;
    resizeCanvas(mainWidth, mainHeight);
    quadtreeManager = new QuadTreeManager(mainWidth, mainHeight, 4);
}

function handleFile(file) {
    if (file.type === 'audio') {
        if (musicSound) musicSound.stop();
        musicSound = loadSound(file.data, () => {
            useMic = false;
            if (mic) mic.stop();
            musicSound.play();
            fft.setInput(musicSound);
        });
    }
}

function toggleAudioSource() {
    useMic = !useMic;
    if (useMic) {
        if (musicSound) musicSound.stop();
        mic.start(() => {
            fft.setInput(mic);
        });
    } else {
        if (mic) mic.stop();
        if (musicSound && !musicSound.isPlaying()) musicSound.play();
        fft.setInput(musicSound);
    }
}

// Piecewise linear mapping for smooth audio interaction in music mode
function piecewiseMap(val, x0, x1, y0, y1, y_min) {
    if (val <= x0) return y_min;
    if (val >= x1) return y1;
    return map(val, x0, x1, y0, y1);
}