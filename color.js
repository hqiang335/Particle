/*
ColorManager - Manages color schemes and color selection for particle rendering and UI.
Supports multiple biological and scientific palettes.
*/
/**
 * 颜色管理类，处理所有颜色方案和相关逻辑
 */
class ColorManager {
    constructor(transparency = 150) {
        this.transparency = transparency;
        this.schemes = {
            // Microbe theme
            microbe: [
                [200, 70, 80, this.transparency],  // E. coli blue
                [150, 60, 70, this.transparency],  // Lactobacillus green
                [30, 80, 85, this.transparency],   // Staphylococcus aureus yellow
                [280, 65, 75, this.transparency],  // Bacillus subtilis purple
                [170, 75, 65, this.transparency],  // Cyanobacteria blue-green
                [15, 70, 90, this.transparency],   // Yeast orange
                [340, 60, 85, this.transparency],  // Red bacteria pink
                [45, 85, 80, this.transparency]    // Actinomycetes yellow
            ],
            
            // Virus theme
            virus: [
                [0, 90, 80, this.transparency],    // Virus capsid red
                [200, 85, 70, this.transparency],  // RNA virus blue
                [270, 70, 75, this.transparency],  // Bacteriophage purple
                [30, 85, 85, this.transparency],   // Enveloped virus orange
                [150, 75, 65, this.transparency],  // Coronavirus green
                [320, 80, 75, this.transparency],  // Influenza virus pink
                [180, 70, 70, this.transparency],  // Herpesvirus cyan
                [45, 80, 85, this.transparency]    // Hepatitis virus yellow
            ],
          
            // Fungi theme
            fungi: [
                [25, 75, 75, this.transparency],   // Mushroom brown
                [40, 85, 85, this.transparency],   // Yeast yellow
                [15, 65, 65, this.transparency],   // Auricularia brown
                [340, 50, 80, this.transparency],  // Russula pink
                [200, 60, 70, this.transparency],  // Penicillium blue
                [150, 55, 60, this.transparency],  // Moss green
                [280, 45, 70, this.transparency],  // Gray-purple fungus
                [60, 70, 75, this.transparency]    // Lichen green-yellow
            ],

            // Cell theme
            cell: [
                [0, 75, 85, this.transparency],    // Red blood cell red
                [200, 80, 75, this.transparency],  // Mitochondria blue
                [120, 70, 70, this.transparency],  // Chloroplast green
                [45, 85, 80, this.transparency],   // Endoplasmic reticulum yellow
                [280, 65, 75, this.transparency],  // Golgi apparatus purple
                [170, 75, 65, this.transparency],  // Lysosome cyan
                [30, 80, 85, this.transparency],   // Peroxisome orange
                [320, 60, 80, this.transparency]   // Nucleus pink
            ],

            // Bioluminescence theme
            bioluminescence: [
                [160, 100, 100, this.transparency], // GFP cyan
                [120, 90, 95, this.transparency],   // Firefly green
                [200, 95, 90, this.transparency],   // Deep sea blue
                [60, 85, 95, this.transparency],    // Fungi yellow
                [280, 80, 95, this.transparency],   // Coral purple
                [180, 90, 95, this.transparency],   // Plankton blue
                [30, 85, 100, this.transparency],   // Bioluminescent orange
                [320, 75, 100, this.transparency]   // Bacterial pink
            ],
            
            // Deep sea theme
            deepsea: [
                [200, 90, 60, this.transparency],  // Deep sea blue
                [180, 85, 70, this.transparency],  // Jellyfish cyan
                [280, 75, 65, this.transparency],  // Octopus purple
                [220, 80, 55, this.transparency],  // Abyss blue
                [160, 90, 75, this.transparency],  // Phosphorescent cyan
                [240, 85, 60, this.transparency],  // Dragon blue
                [190, 80, 70, this.transparency],  // Anemone cyan
                [210, 90, 65, this.transparency]   // Deep sea fish blue
            ]
        };

        // Scheme descriptions for UI
        this.schemeDescriptions = {
            microbe: "Characteristic colors of bacteria and microbes",
            virus: "Colors of different virus types",
            fungi: "Natural tones of fungi and molds",
            cell: "Typical staining of cell organelles",
            bioluminescence: "Fluorescent colors of bioluminescence",
            deepsea: "Mysterious tones of deep-sea creatures"
        };

        this.currentScheme = 'microbe';  // Default scheme
        
        // Set color mode to HSB
        this.initColorMode();
    }

    /**
     * Initialize color mode to HSB
     */
    initColorMode() {
        colorMode(HSB, 360, 100, 100, 255);
    }

    /**
     * Get color by index
     * @param {number} index - Color index
     * @returns {p5.Color} - p5.js color object
     */
    getColor(index) {
        const colors = this.schemes[this.currentScheme];
        const hsbColor = colors[index % colors.length];
        return color(hsbColor[0], hsbColor[1], hsbColor[2], hsbColor[3]);
    }

    /**
     * Get all colors in the current scheme
     * @returns {Array} - Color array
     */
    getCurrentSchemeColors() {
        return this.schemes[this.currentScheme];
    }

    /**
     * Get all available scheme names
     * @returns {Array} - Scheme name array
     */
    getSchemeNames() {
        return Object.keys(this.schemes);
    }

    /**
     * Get scheme description
     * @param {string} schemeName - Scheme name
     * @returns {string} - Scheme description
     */
    getSchemeDescription(schemeName) {
        return this.schemeDescriptions[schemeName] || "";
    }

    /**
     * Set current color scheme
     * @param {string} schemeName - Scheme name
     */
    setScheme(schemeName) {
        if (this.schemes[schemeName]) {
            this.currentScheme = schemeName;
        }
    }
}
