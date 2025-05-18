/**
 * 颜色管理类，处理所有颜色方案和相关逻辑
 */
class ColorManager {
    constructor(transparency = 150) {
        this.transparency = transparency;
        this.schemes = {
            // 微生物主题配色
            microbe: [
                [200, 70, 80, this.transparency],  // 大肠杆菌蓝
                [150, 60, 70, this.transparency],  // 乳酸菌绿
                [30, 80, 85, this.transparency],   // 金黄色葡萄球菌
                [280, 65, 75, this.transparency],  // 枯草芽孢杆菌紫
                [170, 75, 65, this.transparency],  // 蓝绿藻色
                [15, 70, 90, this.transparency],   // 酵母菌橙
                [340, 60, 85, this.transparency],  // 红细菌粉
                [45, 85, 80, this.transparency]    // 放线菌黄
            ],
            
            // 病毒主题配色
            virus: [
                [0, 90, 80, this.transparency],    // 病毒衣壳红
                [200, 85, 70, this.transparency],  // RNA病毒蓝
                [270, 70, 75, this.transparency],  // 噬菌体紫
                [30, 85, 85, this.transparency],   // 包膜病毒橙
                [150, 75, 65, this.transparency],  // 冠状病毒绿
                [320, 80, 75, this.transparency],  // 流感病毒粉
                [180, 70, 70, this.transparency],  // 疱疹病毒青
                [45, 80, 85, this.transparency]    // 肝炎病毒黄
            ],
          
            // 真菌主题配色
            fungi: [
                [25, 75, 75, this.transparency],   // 蘑菇棕
                [40, 85, 85, this.transparency],   // 酵母黄
                [15, 65, 65, this.transparency],   // 木耳褐
                [340, 50, 80, this.transparency],  // 红菇粉
                [200, 60, 70, this.transparency],  // 青霉蓝
                [150, 55, 60, this.transparency],  // 苔藓绿
                [280, 45, 70, this.transparency],  // 灰紫菌
                [60, 70, 75, this.transparency]    // 地衣绿黄
            ],

            // 细胞主题配色
            cell: [
                [0, 75, 85, this.transparency],    // 红细胞红
                [200, 80, 75, this.transparency],  // 线粒体蓝
                [120, 70, 70, this.transparency],  // 叶绿体绿
                [45, 85, 80, this.transparency],   // 内质网黄
                [280, 65, 75, this.transparency],  // 高尔基体紫
                [170, 75, 65, this.transparency],  // 溶酶体青
                [30, 80, 85, this.transparency],   // 过氧化物酶体橙
                [320, 60, 80, this.transparency]   // 细胞核粉
            ],

            // 生物荧光主题
            bioluminescence: [
                [160, 100, 100, this.transparency], // 荧光蛋白青
                [120, 90, 95, this.transparency],   // 萤火虫绿
                [200, 95, 90, this.transparency],   // 深海发光蓝
                [60, 85, 95, this.transparency],    // 真菌荧光黄
                [280, 80, 95, this.transparency],   // 珊瑚荧光紫
                [180, 90, 95, this.transparency],   // 浮游生物蓝
                [30, 85, 100, this.transparency],   // 生物发光橙
                [320, 75, 100, this.transparency]   // 细菌荧光粉
            ],
            
            // 深海生物主题
            deepsea: [
                [200, 90, 60, this.transparency],  // 深海蓝
                [180, 85, 70, this.transparency],  // 水母青
                [280, 75, 65, this.transparency],  // 章鱼紫
                [220, 80, 55, this.transparency],  // 深渊蓝
                [160, 90, 75, this.transparency],  // 磷光青
                [240, 85, 60, this.transparency],  // 渊龙蓝
                [190, 80, 70, this.transparency],  // 海葵青
                [210, 90, 65, this.transparency]   // 深海鱼蓝
            ]
        };

        // 方案描述，用于UI提示
        this.schemeDescriptions = {
            microbe: "细菌和微生物的特征色彩",
            virus: "不同类型病毒的特征色彩",
            fungi: "真菌和霉菌的自然色调",
            cell: "细胞器的典型染色效果",
            bioluminescence: "生物发光现象的荧光色",
            deepsea: "深海生物的神秘色调"
        };

        this.currentScheme = 'microbe';  // 默认方案
        
        // 设置颜色模式为HSB
        this.initColorMode();
    }

    /**
     * 初始化颜色模式为HSB
     */
    initColorMode() {
        colorMode(HSB, 360, 100, 100, 255);
    }

    /**
     * 获取指定索引的颜色
     * @param {number} index - 颜色索引
     * @returns {p5.Color} - 返回p5.js颜色对象
     */
    getColor(index) {
        const colors = this.schemes[this.currentScheme];
        const hsbColor = colors[index % colors.length];
        return color(hsbColor[0], hsbColor[1], hsbColor[2], hsbColor[3]);
    }

    /**
     * 获取当前方案的所有颜色
     * @returns {Array} - 颜色数组
     */
    getCurrentSchemeColors() {
        return this.schemes[this.currentScheme];
    }

    /**
     * 获取所有可用的方案名称
     * @returns {Array} - 方案名称数组
     */
    getSchemeNames() {
        return Object.keys(this.schemes);
    }

    /**
     * 获取方案描述
     * @param {string} schemeName - 方案名称
     * @returns {string} - 方案描述
     */
    getSchemeDescription(schemeName) {
        return this.schemeDescriptions[schemeName] || "";
    }

    /**
     * 设置当前颜色方案
     * @param {string} schemeName - 方案名称
     */
    setScheme(schemeName) {
        if (this.schemes[schemeName]) {
            this.currentScheme = schemeName;
        }
    }
}
