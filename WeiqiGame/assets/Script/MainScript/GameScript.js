var MoveDirection = cc.Enum({
    NONE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
});

let gameManager = require("GameManager");

//定义棋盘规格
var offset = 50;

//水平偏移距离
var horizontalOffset = 0;

//竖直偏移距离
var verticalOffset = 0;

let failArr = [];

cc.Class({
    extends: cc.Component,

    properties: {
        /* 外部资源 */
        //棋子的预制资源
        chessPrefab: {
            default: null,
            type: cc.Prefab
        },

        //白棋的图片(消防员)资源
        whiteSpriteFrame: {
            default: null,
            type: cc.SpriteFrame
        },

        //(消防员)图片资源
        //左下
        BottomLeft: {
            default: null,
            type: cc.SpriteFrame
        },

        //左右下
        BottomLeftRight: {
            default: null,
            type: cc.SpriteFrame
        },

        //右下
        BottomRight: {
            default: null,
            type: cc.SpriteFrame
        },

        //左右
        LeftRight: {
            default: null,
            type: cc.SpriteFrame
        },

        //上下
        TopBottom: {
            default: null,
            type: cc.SpriteFrame
        },

        //上下左
        TopBottomLeft: {
            default: null,
            type: cc.SpriteFrame
        },

        //上下右
        TopBottomRight: {
            default: null,
            type: cc.SpriteFrame
        },

        //左上
        TopLeft: {
            default: null,
            type: cc.SpriteFrame
        },

        //上左右
        TopLeftRight: {
            default: null,
            type: cc.SpriteFrame
        },

        //右上
        TopRight: {
            default: null,
            type: cc.SpriteFrame
        },

        //上
        Top: {
            default: null,
            type: cc.SpriteFrame
        },

        //下
        Bottom: {
            default: null,
            type: cc.SpriteFrame
        },

        //左
        Left: {
            default: null,
            type: cc.SpriteFrame
        },

        //右
        Right: {
            default: null,
            type: cc.SpriteFrame
        },

        //火焰资源
        //大火图片资源
        bigFire: {
            default: null,
            type: cc.SpriteFrame
        },

        //中火图片资源
        middleFire: {
            default: null,
            type: cc.SpriteFrame
        },

        //小火图片资源
        smallFire: {
            default: null,
            type: cc.SpriteFrame
        },

        //地图节点父节点
        parentNode: {
            default: null,
            type: cc.Node,
        },

        /* 数据结构 */
        //棋子节点的集合，用一维数组表示二维位置
        chessList: {
            default: [],
            type: [cc.node]
        },

        //锚点
        //记录当前上一步落子黑棋(火焰)的索引
        blackAnthor: -1,

        //下一步黑棋可走的位置集合
        nextBlackIndex: [],

        //黑棋(火焰)的集合，用一维数组表示二维位置
        blackChessList: {
            default: [],
            type: [cc.node]
        },

        //消防员节点的集合
        whiteChessList: {
            default: [],
            type: [cc.node]
        },

        //每一回合落下的棋子
        //用于记录坐标移动地图
        touchChess: {
            default: null,
            type: cc.Node,
            visible: false
        },

        //当前落子方，默认为白棋(消防员)
        gameState: 'white',

        //当前关卡
        mission: 2,

        //需改变火焰为大火的贴图位置
        changeFireArray: [],

        //地图临近边界移动距离（格数）
        mapMoveStep: 3,

        //棋盘大小(n * n)
        //size: 150,

        boardWidth: 150,

        boardHeight: 30

    },

    /**
     * 游戏入口，初始化
     */
    onLoad: function () {
        cc.log('Calling method [OnLoad]');
        cc.log('map.x:' + this.node.getPosition().x);
        cc.log('map.y:' + this.node.getPosition().y);
        this._initMapPos();

        var self = this;

        // 初始化棋盘上棋子节点，并为每个节点添加事件
        for (var y = 0; y < this.boardHeight; y++) {
            for (var x = 0; x < this.boardWidth; x++) {
                // chessPrefab:预制棋子资源
                // 为每个新增节点加载chessPrefab资源
                var newNode = cc.instantiate(this.chessPrefab);
                // 加入子节点
                this.node.addChild(newNode);
                // 根据棋盘和棋子大小计算使每个棋子节点位于指定位置
                newNode.setPosition(cc.v2(x * offset + offset, y * offset + offset));

                newNode.on(cc.Node.EventType.TOUCH_END, function (event) {
                    self.touchChess = this;
                    if (self.gameState === 'white' && this.getComponent(cc.Sprite).spriteFrame === null) {
                        //下子后添加棋子图片使棋子显示
                        self.setFiremanSpriteFrame(this);
                        //放入白棋
                        self.whiteChessList.push(this);
                        cc.log('whiteChessList:', self.whiteChessList);
                        //判断是否结束
                        self._judgeOverNew();
                        cc.log(self.gameState);
                        if (self.gameState == 'black') {
                            //火焰蔓延
                            self.scheduleOnce(function () {
                                self.computer();
                            }, 0);
                        }
                    }
                }, newNode);
                this.chessList.push(newNode);
            }
        }
        cc.log('配置初始化');
        //读取配置 初始化火焰和消防员位置
        self.initGame();
        cc.log('Return method [OnLoad]');
    },

    start() {
        //初始化地图资源
        this._tiledMap = this.node.getComponent('cc.TiledMap');
        this._succeedLayer = this.node.getParent().getParent().getChildByName('SucceedLayer');
        this._succeedLayer.active = false;
        this._failedLayer = this.node.getParent().getParent().getChildByName('FailedLayer');
        this._failedLayer.active = false;
    },

    /**
     * 根据游戏关卡设置地图信息
     */
    _initMapPos: function () {
        cc.log('mission', gameManager.mission);
        this.mission = gameManager.mission;
        if (this.mission == 1) {
            horizontalOffset = 0;
            verticalOffset = 0;
        }
        else if (this.mission == 2) {
            horizontalOffset = 350;
            verticalOffset = 0;

            let newNode = cc.v2(this.node.x - horizontalOffset, this.node.y);
            this.node.setPosition(newNode);
        }
        else if (this.mission == 3) {
            horizontalOffset = 0;
            verticalOffset = 0;
        }
        else if (this.mission == 4) {
            horizontalOffset = 0;
            verticalOffset = 0;
        }

        failArr = [];
    },

    //黑子(火焰)下棋逻辑
    computer: function () {
        console.log('Calling method [computer]');
        var next;

        //复制 下一步黑棋落子集合
        var currentBlackIndex = [];
        for (var tag = 0; tag < this.nextBlackIndex.length; tag++) {
            currentBlackIndex.push(this.nextBlackIndex[tag]);
        }
        var len = currentBlackIndex.length;

        cc.log('黑子可落子个数:', len, 'currentBlackIndex:', currentBlackIndex);
        for (var j = 0; j < len; j++) {
            if (this.chessList[currentBlackIndex[j]].getComponent(cc.Sprite).spriteFrame === null) {
                //设置黑子(火焰)锚点
                this.blackAnthor = currentBlackIndex[j];
                //cc.log('设置锚点：' + this.blackAnthor);
                next = currentBlackIndex[j];

                //落子贴图
                this.chessList[next].getComponent(cc.Sprite).spriteFrame = this.bigFire;

                this.touchChess = this.chessList[next];
                this.blackChessList.push(next);

                //在下一步落子集合中删除此位置
                var index = this.nextBlackIndex.indexOf(next);
                if (index > -1) {
                    this.nextBlackIndex.splice(index, 1);
                }
                //计算下一步落子位置集合
                this._breathCacular(this.blackAnthor);
            }
            else {
                //删除已占用的可落子位置集合中的索引
                var index = this.nextBlackIndex.indexOf(currentBlackIndex[j]);
                //cc.log('索引:' + index);
                if (index > -1) {
                    this.nextBlackIndex.splice(index, 1);
                }
            }
        }

        this._resetFiremanFrame();
        this._judgeBoundaryNew();
        this._judgeOverNew();
        this._firemanExtract();
        console.log('Return method [computer]');
    },

    /**
     * 火焰蔓延后重新设置消防员贴图
     */
    _resetFiremanFrame: function () {
        cc.log('Calling method _resetFiremanFrame')
        let len = this.whiteChessList.length;
        for (let i = 0; i < len; i++) {
            this.whiteChessList[i].getComponent(cc.Sprite).spriteFrame = null;
            this.setFiremanSpriteFrame(this.whiteChessList[i]);
        }
    },

    /**
     * 若消防员被火焰包围，则使其消失
     */
    _firemanExtract: function () {
        console.log('Calling METHOD _firemanExtract');
        let len = this.whiteChessList.length;
        for (let i = 0; i < len; i++) {
            let index = this.chessList.indexOf(this.whiteChessList[i]);
            if (index > -1) {
                if ((this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                    && (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                    && (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                    && (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire)) {
                    let ret = this.whiteChessList.indexOf(this.whiteChessList[i]);
                    if (ret > -1) {
                        this.whiteChessList.splice(ret, 1);
                    }
                    //删除贴图
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = null;
                    //消防员消失的位置放入下一次火焰蔓延的队列中
                    this.nextBlackIndex.push(index);
                    return;
                }
            }
        }
        console.log('Return METHOD _firemanExtract');
    },

    // update (dt) {},

    /**
     * 判断游戏是否结束
     */
    _judgeOverNew: function () {
        //判断消防员是否落在了对应的【失败点】
        for (let i = 0; i < failArr.length; i++) {
            console.log('当前点贴图:', this.chessList[failArr[i]].getComponent(cc.Sprite).spriteFrame);
            if (this.chessList[failArr[i]].getComponent(cc.Sprite).spriteFrame != null
                && this.chessList[failArr[i]].getComponent(cc.Sprite).spriteFrame != this.bigFire
                && this.chessList[failArr[i]].getComponent(cc.Sprite).spriteFrame != this.middleFire
                && this.chessList[failArr[i]].getComponent(cc.Sprite).spriteFrame != this.smallFire) {
                console.log('消防员落在了对应的【失败点】:', failArr[i]);
                this._gameOverWithFailed();
                return;
            }
        }

        //仅仅判断失败
        //对于已被白子占领的 黑子下一步落子的位置
        //从列表中删除
        let len = this.nextBlackIndex.length;
        for (let i = len - 1; i >= 0; i--) {
            if (this.chessList[this.nextBlackIndex[i]].getComponent(cc.Sprite).spriteFrame != null) {
                let index = this.nextBlackIndex.indexOf(this.nextBlackIndex[i]);
                if (index > -1) {
                    //cc.log('delete');
                    this.nextBlackIndex.splice(index, 1);
                }
            }
        }

        let breath = this.nextBlackIndex.length;
        let newBreath = this._circleValid();
        cc.log('judge: ', breath, 'newBreath:', newBreath);

        //火焰蔓延
        this.blackChessList.forEach(a => this._fireSpread(a));
        this._setNewBlackChess(this.changeFireArray);

        if ((breath + newBreath) >= 3) {
            this._gameOverWithFailed();
            return;
        }

        if (breath == 0) {
            cc.log('No breath');
            let newAnthor = this._circleCacular();
            let count = this._circleValid();
            if (count > 2 && this.nextBlackIndex.length > 2) {
                this._gameOverWithFailed();
                return;
            }
            cc.log('newAnthor:' + newAnthor);
            if (newAnthor != -1) {
                this.blackAnthor = newAnthor;
                if (this.gameState === 'black') {
                    this.gameState = 'white';
                } else {
                    this.gameState = 'black';
                }
                return;
            }
            this._gameOverWithSucceed();
            return;
        }

        //没有输赢交换下子顺序
        if (this.gameState === 'black') {
            this.gameState = 'white';
        } else {
            this.gameState = 'black';
        }
        cc.log('当前落子方' + this.gameState);
    },

    /**
     * 游戏结束(失败)
     */
    _gameOverWithFailed: function () {
        cc.log('游戏结束');
        this.gameState = 'over';
        //失败弹窗
        this._failedLayer.active = true;
    },

    /**
     * 游戏结束(成功)
     */
    _gameOverWithSucceed: function () {
        cc.log('游戏结束');
        this.gameState = 'over';
        //游戏胜利弹窗
        this._succeedLayer.active = true;
    },

    /**
     * 计算下一次落子的集合
     */
    _breathCacular: function (blackAnthor) {
        cc.log('_breathCacular');
        let current = blackAnthor;
        var breath = 0;
        cc.log('锚点:', current);
        // 统计锚点火焰气的个数
        // 左边界
        if (!(current % this.boardWidth === 0) && (this.chessList[current - 1].getComponent(cc.Sprite).spriteFrame == null)) {
            breath++;
            //this.blackBreathList.push(this.blackAnthor - 1);
            this.nextBlackIndex.push(current - 1);
        }
        // 右边界
        if (!((current + 1) % this.boardWidth === 0) && (this.chessList[current + 1].getComponent(cc.Sprite).spriteFrame == null)) {
            breath++;
            //this.blackBreathList.push(this.blackAnthor + 1);
            this.nextBlackIndex.push(current + 1);
        }
        // 上边界
        if (!(current + this.boardWidth > this.boardHeight * this.boardWidth - 1) && (this.chessList[current + this.boardWidth].getComponent(cc.Sprite).spriteFrame == null)) {
            breath++;
            //this.blackBreathList.push(this.blackAnthor + 19);
            this.nextBlackIndex.push(current + this.boardWidth);
        }
        //下边界
        if (!(current - this.boardWidth < 0) && (this.chessList[current - this.boardWidth].getComponent(cc.Sprite).spriteFrame == null)) {
            breath++;
            //this.blackBreathList.push(this.blackAnthor - 19);
            this.nextBlackIndex.push(current - this.boardWidth);
        }

        this.nextBlackIndex = this._unique(this.nextBlackIndex);
        cc.log('breath：', breath);
        return breath;
    },


    /**
     * 读取配置初始化火焰以及消防员
     */
    _loadingConfigGame: function () {
        cc.log("Calling METHOD _loadingConfigGame")
        let bigFireArr = [];
        //let midAndSmallArr = [];
        let middleFireArr = [];
        let smallFireArr = [];
        let firemanArr = [];

        //测试
        // if (this.mission == 1){
        //     bigFireArr = [28,47];
        //     midAndSmallArr = [64,65,188,207,256,210,229,328,329,335,336];
        //     firemanArr = [9,27,29,46,85,189,208,227,246,265,255,313,171,190,209,228,247,347,348,354,355];

        //     this._generatorFrame(bigFireArr, 1);
        //     this._generatorFrame(midAndSmallArr, 2);
        //     this._generatorFrame(firemanArr, 3);

        //     //记录落点黑棋的索引
        //     this.blackAnthor = 47; 
        // }

        /*
        //100*100坐标

        if (this.mission == 1) {
            bigFireArr = [309, 310];
            midAndSmallArr = [102, 202, 302, 402, 502, 1302, 1502, 1702, 1303, 1503, 1603, 1703, 1301, 1401, 1501, 1701, 901, 903, 1003, 906, 912, 915, 917, 815, 108, 208, 408, 407, 609, 608, 214, 314, 414, 115, 116, 315, 316, 317, 217, 417, 516, 515, 1209, 1509, 1510, 1709, 1715, 1716, 1614, 1514, 1414, 1315, 1316, 1417, 1517, 1617];
            middleFireArr = [];
            smallFireArr = [];
            firemanArr = [106, 206, 307, 308, 209, 210, 409, 509, 802, 1002, 904, 905, 913, 914, 816, 1016, 1309, 1409, 1610, 1608];

            this._generatorFrame(bigFireArr, 1);
            this._generatorFrame(midAndSmallArr, 2);
            this._generatorFrame(firemanArr, 3);

            //记录落点黑棋的索引
            this.blackAnthor = 310;
        }

        if (this.mission == 2) {
            bigFireArr = [117];
            midAndSmallArr = [101, 103, 104, 202, 115, 215, 315, 214, 515, 615, 514, 513, 512, 403, 503, 605, 705, 707, 708, 710, 907, 906, 1106, 1105, 1101, 1201, 1202, 1301, 1310, 1311, 1315, 1316, 1317, 1318, 1418, 1218, 1216, 1117, 1018, 816];
            middleFireArr = [];
            smallFireArr = [];
            firemanArr = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1401, 1402, 1403, 1404, 1405, 1406, 1407, 1408, 1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 118, 218, 318, 418, 518, 618, 718, 818, 917];

            this._generatorFrame(bigFireArr, 1);
            this._generatorFrame(midAndSmallArr, 2);
            this._generatorFrame(firemanArr, 3);

            //记录落点黑棋的索引
            this.blackAnthor = 117;
        }
        */

        //150 * 150坐标

        //2018
        if (this.mission == 1) {
            bigFireArr = [459, 460];
            middleFireArr = [1353, 1356, 1362, 1365, 1503, 1809, 2259, 2260, 1215, 909, 607, 608, 308];
            smallFireArr = [152, 302, 452, 602, 752, 1351, 1367, 1953, 1952, 1951, 1965, 1966, 2101, 2114, 2117, 2251, 2252, 2253, 2264, 2267, 2403, 2414, 2417, 2553, 2552, 2551, 2559, 2565, 2566, 908, 765, 766, 614, 617, 464, 465, 466, 467, 165, 166, 314, 317, 158];
            firemanArr = [156, 306, 309, 310, 457, 458, 609, 759, 1202, 1216, 1502, 1516, 1354, 1355, 1363, 1364, 1959, 2109, 2408, 2410];

            //设置初始大火的索引
            this.blackAnthor = 460;
        }

        //蛇
        if (this.mission == 2) {
            bigFireArr = [167];
            middleFireArr = [151, 153, 154, 165, 1651, 1801, 1951, 1960, 1961, 1965, 1966, 1967, 2118];
            smallFireArr = [302, 1802, 603, 753, 905, 1055, 1057, 1058, 1060, 1216, 1356, 1357, 1518, 1656, 1655, 1667, 1968, 762, 763, 764, 765, 915, 1816, 1818, 465, 315, 314];
            firemanArr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 150, 300, 450, 600, 750, 900, 1050, 1200, 1350, 1500, 1650, 1800, 1950, 2100, 2101, 2102, 2103, 2104, 2105, 2106, 2107, 2108, 2109, 2110, 2111, 2112, 2113, 2114, 2115, 2116, 2117, 1367, 168, 318, 468, 618, 768, 918, 1068, 1218];
            failArr = [604, 1504, 1560, 914, 1206];

            //设置初始大火的索引
            this.blackAnthor = 167;
        }

        //爱心
        if (this.mission == 3) {
            firemanArr = [1350, 1500, 1650, 1800, 1950, 2705, 2706, 158, 308, 1958, 9, 609, 2409, 160, 2712, 2713, 1368, 1518, 1668, 1818, 1968];
            bigFireArr = [159, 309];
            middleFireArr = [1651, 1801, 2555, 2556, 458, 1959, 2562, 2563, 1367, 1517];
            smallFireArr = [457];

            //设置初始大火的索引
            this.blackAnthor = 309;
        }

        //长征1
        if (this.mission == 4) {
            firemanArr = [300, 450, 900, 1, 1651, 4051, 4201, 2, 152, 1802, 1803, 454, 604, 754, 904, 1954, 4204, 2105, 3605, 4055, 4205, 2256, 3006, 3906, 4056, 2407, 3607, 3757, 3907, 2558, 3458, 3608, 2109, 2259, 2409, 2559, 2709, 3309, 3459, 4359, 2110, 2560, 2710, 2860, 3010, 3160, 3310, 4060, 1961, 912, 1062, 1962, 2712, 3012, 613, 1963, 3463, 464, 1964, 2564, 2714, 3164, 3314, 315, 765, 2115, 3315, 16, 166, 2266, 2566, 2866, 17, 1817, 3017, 468, 1518, 1818, 3168, 3768, 469, 1819, 620, 1520, 1820, 4070, 4370, 471, 1821, 4371, 472, 1522, 1822, 4372, 623, 1823, 474, 1524, 3924, 475, 3925, 626, 1526, 3926, 177, 627, 927, 1077, 3927, 478, 628, 778, 1078, 1828, 3928, 179, 1229, 3929, 2130, 3780, 1531, 2881, 3031, 3631, 2432, 3182, 3332, 3482, 1683, 2583, 3033, 1834, 2734, 1985, 2885, 3035, 1536, 2136, 2287, 2437, 2587, 2737, 2438, 2888, 2889, 1990, 2890, 2891, 1842, 2442, 2592, 2742, 1544, 1246, 948, 650, 1101, 1251, 1401, 1551, 1701, 1851, 2001, 2151, 2301, 2451, 2601, 802, 203, 353, 953, 2604, 2605, 206, 2456, 207, 357, 807, 2307, 358, 508, 1408, 2158, 509, 659, 809, 2009, 810, 960, 1860, 61, 961, 1111, 1711, 1861, 2011, 2161, 2311, 362, 1112, 1262, 1412, 1562, 1712, 1862, 2312, 2463, 1414, 1714, 2464, 3364, 3514, 965, 2465, 3815, 1116, 1266, 1716, 1866, 2466, 3966, 1117, 2317, 3667, 4117, 1568, 1868, 2168, 4268, 4418, 1419, 2619, 4419, 670, 1270, 2620, 2920, 3970, 2621, 3971, 72, 372, 2622, 2922, 3822, 73, 2623, 3973, 74, 2624, 2924, 3974, 2625, 3825, 526, 2926, 3976, 527, 3977, 528, 2928, 3828, 529, 3379, 3529, 3829, 4279, 530, 2630, 3380, 3680, 3830, 3980, 531, 3231, 4281, 682, 2332, 833, 1433, 1583, 2933, 984, 1134, 1284, 2034, 1435, 1885, 2785, 1736, 2636, 1437, 1587, 2487, 2338, 2938, 2039, 2189, 2040, 1891, 1892, 2492, 2043, 2044, 2644, 2946, 3248, 3550, 3852];
            bigFireArr = [0, 150, 151, 301];
            middleFireArr = [1650, 1801, 4202, 603, 753, 1953, 2255, 3755, 4355, 2406, 3606, 4206, 2557, 3457, 4057, 2708, 3308, 3758, 3908, 2859, 3159, 3609, 4059, 2260, 2410, 3460, 2111, 2711, 3011, 3311, 2112, 2262, 3462, 913, 1063, 2113, 3163, 614, 764, 2114, 2414, 3014, 465, 2265, 2715, 3165, 316, 3016, 3316, 167, 1667, 3167, 318, 318, 1669, 470, 1370, 1671, 4221, 1372, 473, 1673, 1374, 4075, 476, 4076, 27, 477, 4077, 328, 928, 4078, 29, 1079, 4079, 3930, 2731, 3781, 2582, 2882, 3632, 1533, 2733, 3183, 3333, 1684, 2884, 3034, 1835, 1686, 1986, 2137, 2288, 2588, 2738, 2439, 2739, 2740, 1991, 2441, 2591, 2741, 651,204,2754,2455,56,2306,57,657,2157,208,808,2008,359,959,1859,510,660,1110,1710,361,811,1261,1561,962,2012,2162,1113,1413,1713,2313,964,2314,1265,2315,3365,3515,1416,2016,2316,3816,3666,1267,1717,2167,3967,1118,1418,4118,1269,2769,4269,4120,2771,3072,3972,223,2773,3074,2775,3975,3076,377,378,3978,379,3979,4429,380,3530,4130,381,3381,4431,532,683,1733,834,1584,1884,1135,1285,1735,2935,1436,1586,2786,2637,2488,2788,2339,2190,2041,2042,2193,2493];
            smallFireArr = [4358, 4207, 3904, 3454, 2404, 1200, 1350, 1950, 2401, 2102, 4053, 4353, 2104, 4354, 2706, 3306, 4357, 3008, 3760, 2863, 2415, 916, 2417, 2717, 3617, 19, 1369, 3919, 4219, 20, 21, 1371, 2121, 22, 23, 1373, 24, 4374, 1375, 4375, 26, 1677, 28, 929, 1979, 30, 1380, 331, 2281, 4081, 782, 1832, 933, 3783, 4234, 3186, 1988, 2439, 1690, 2290, 2440, 2590, 2291, 1693, 1395, 1097, 799, 501, 351, 2589,1102,2902,2753,1104,1254,1554,1854,2304,55,355,506,956,2006,1108,1708,59,1410,662,2164,1565,2017,3518,819,1719,2019,221,521,3071,4421,4422,2323,3073,4423,4424,3075,4425,76,4426,77,3077,4428,2779,4430,2481,3531,3082,4432,383,2183,4133,2634,3684,685,3535,236,1288,2490,2192,2792,2795,3097,3399,3701];

            //设置初始大火的索引
            this.blackAnthor = 301;
        }

        //长征2
        if (this.mission == 5) {
            firemanArr = [750, 151, 301, 901, 2552, 2553, 154, 2404, 155, 305, 755, 2255, 306, 456, 1356, 2106, 457, 607, 757, 1957, 758, 908, 1808, 9, 909, 1059, 1659, 1809, 1959, 2109, 2259, 310, 1060, 1210, 1360, 1510, 1660, 1810, 2260, 2411, 1362, 1662, 2412, 3312, 3462, 913, 2413, 3763, 1064, 1214, 1664, 1814, 2414, 3914, 1065, 2265, 3615, 4065, 1516, 1816, 2116, 4216, 4366, 1367, 2567, 4367, 618, 1218, 2568, 2868, 3918, 2569, 3919, 20, 320, 2570, 2870, 3770, 21, 2571, 3921, 22, 2572, 2872, 3922, 2573, 3773, 474, 2874, 3924, 475, 3925, 476, 2876, 3776, 477, 3327, 3477, 3777, 4227, 478, 2578, 3328, 3628, 3778, 3928, 479, 3179, 4229, 630, 2280, 781, 1381, 1531, 2881, 932, 1082, 1232, 1982, 1383, 1833, 2733, 1684, 2584, 1385, 1535, 2435, 2286, 2886, 1987, 2137, 1988, 1839, 1840, 2440, 1991, 1992, 2592, 2894, 3196, 3498, 3800];
            bigFireArr = [];
            middleFireArr = [152, 2702, 2403, 4, 2254, 3904, 5, 605, 2105, 156, 756, 1956, 307, 907, 1807, 458, 608, 1058, 1658, 309, 759, 1209, 1509, 910, 1960, 2110, 1061, 1361, 1661, 2261, 912, 2262, 1213, 2263, 3313, 3463, 1364, 1964, 2264, 3764, 3614, 1215, 1665, 2115, 3915, 1066, 1366, 4066, 1217, 2717, 4217, 4068, 2719, 3020, 3920, 171, 2721, 3022, 2723, 3023, 3923, 3024, 325, 326, 3926, 327, 3927, 4377, 328, 3478, 4078, 329, 3329, 4379, 480, 631, 1681, 782, 1532, 1832, 1083, 1233, 1683, 2883, 1384, 1534, 2734, 2585, 2436, 2736, 2287, 2138, 1989, 1990, 2141, 2441];
            smallFireArr = [1050, 2850, 2701, 1052, 1202, 1502, 1802, 2252, 3, 303, 454, 1954, 1056, 1656, 7, 1358, 610, 2112, 1513, 1965, 3466, 767, 1667, 1967, 169, 469, 3019, 4369, 4370, 2271, 3021, 4371, 4372, 4373, 24, 4374, 25, 3025, 4376, 2727, 4378, 2429, 3479, 3030, 4380, 331, 2131, 4081, 2582, 3632, 633, 3483, 184, 1236, 2438, 2140, 2740, 2743, 3045, 3347, 3649];

            //设置初始大火的索引
            this.blackAnthor = "";
        }

        //设置贴图
        this._generatorFrame(bigFireArr, 1);
        this._generatorFrame(middleFireArr, 2);
        this._generatorFrame(smallFireArr, 3);
        this._generatorFrame(firemanArr, 4);

        //记录消防员位置
        for (let i = 0; i < firemanArr.length; i++) {
            this.whiteChessList.push(this.chessList[firemanArr[i]]);
        }

        cc.log("Return METHOD _loadingConfigGame")
    },

    /**
     * 贴图生成器(type:1大火 2中火 3小火 4消防员)
     * @param {角色数组} array 
     * @param {类型 1大火 2中火 3小火 4消防员} type 
     */
    _generatorFrame: function (array, type) {
        cc.log("Calling METHOD _generatorFrame", array, type)
        if (array.length <= 0) {
            return;
        } else {
            if (type == 1) {
                for (let i = 0; i < array.length; i++) {
                    this.chessList[array[i]].getComponent(cc.Sprite).spriteFrame = this.bigFire;
                }
            } else if (type == 2) {
                for (let i = 0; i < array.length; i++) {
                    this.chessList[array[i]].getComponent(cc.Sprite).spriteFrame = this.middleFire;
                }
            } else if (type == 3) {
                for (let i = 0; i < array.length; i++) {
                    this.chessList[array[i]].getComponent(cc.Sprite).spriteFrame = this.smallFire;
                }
            } else if (type == 4) {
                for (let i = 0; i < array.length; i++) {
                    this.setFiremanSpriteFrame(this.chessList[array[i]]);
                }
            }
        }
        cc.log("Return METHOD _generatorFrame")
    },

    /**
     * 初始化游戏
     * 后期读取配置
     * 配置项:当前黑、白棋的坐标，黑棋的气集合，黑棋下一步可落子位置集合，不可落子位置集合(可选)
     */
    initGame: function () {
        this._loadingConfigGame();

        //计算下一次黑棋可落子的位置
        this._breathCacular(this.blackAnthor);

        //指定下一次为白棋(消防员)落子
        this.gameState = 'white';
    },

    /**
     * 判断当前落子是否已到达边界
     */
    _judgeBoundaryNew: function () {
        console.log('Calling method [_judgeBoundaryNew]');
        //当前棋子坐标
        let current = this.touchChess.getPosition();
        console.log('current:', current);
        //游戏区域宽度
        let parentWidth = this.parentNode.width;
        console.log('parentWidth:', parentWidth);
        //游戏区域高度
        let parentHeight = this.parentNode.height;
        console.log('parentHeight:', parentHeight);
        //地图格子宽度
        let tileSize = this._tiledMap.getTileSize();
        console.log('horizontalOffset:', horizontalOffset);
        console.log('verticalOffset:', verticalOffset);

        let mapMoveDir = MoveDirection.NONE;
        //地图左移
        if (parentWidth - (current.x - horizontalOffset) < this.mapMoveStep * tileSize.width) {
            console.log('left');
            mapMoveDir = MoveDirection.LEFT;
            this._tryMoveMapNew(mapMoveDir);
        }

        //地图右移
        if (current.x - horizontalOffset < this.mapMoveStep * tileSize.width) {
            console.log('right');
            mapMoveDir = MoveDirection.RIGHT;
            this._tryMoveMapNew(mapMoveDir);
        }

        //地图上移
        if (current.y - verticalOffset < this.mapMoveStep * tileSize.width) {
            console.log('up--', 'current.y:', current.y, 'verticalOffset:', verticalOffset);
            mapMoveDir = MoveDirection.UP;
            this._tryMoveMapNew(mapMoveDir);
        }

        //地图下移
        if (parentHeight - (current.y - verticalOffset) < this.mapMoveStep * tileSize.width) {
            console.log('down');
            mapMoveDir = MoveDirection.DOWN;
            this._tryMoveMapNew(mapMoveDir);
        }
        console.log('Return method [_judgeBoundaryNew]');
    },

    /**
     * 尝试移动地图
     * @param {MoveDirection} moveDir 
     */
    _tryMoveMapNew: function (moveDir) {
        console.log('Calling method [_tryMoveMapNew]');
        //地图坐标
        let mapPos = this.node.getPosition();
        //地图大小
        let mapSize = this.node.getContentSize();
        //瓦片地图规格
        let tileSize = this._tiledMap.getTileSize();
        //游戏区域宽度
        let parentWidth = this.parentNode.width;
        //游戏区域高度
        let parentHeight = this.parentNode.height;
        //当前棋子坐标
        let player = this.touchChess.getPosition();
        //计算偏移距离
        let disX = player.x - horizontalOffset;
        let disY = player.y - verticalOffset;
        console.log('player:', player, 'mapsize:', mapSize, 'disX:', disX, 'disY:', disY);

        let minDisX = tileSize.width * this.mapMoveStep;
        let minDisY = tileSize.height * this.mapMoveStep;
        let newPos;

        switch (moveDir) {
            case MoveDirection.UP:
                if (minDisY > disY) {
                    newPos = cc.v2(mapPos.x, mapPos.y + minDisY);
                }
                break;
            case MoveDirection.DOWN:
                if (parentHeight - disY < minDisY) {
                    newPos = cc.v2(mapPos.x, mapPos.y - minDisY);
                }
                break;
            case MoveDirection.LEFT:
                if (parentWidth - disX < minDisX) {
                    newPos = cc.v2(mapPos.x - minDisX, mapPos.y);
                }
                break;
            case MoveDirection.RIGHT:
                if (minDisX > disX) {
                    newPos = cc.v2(mapPos.x + minDisX, mapPos.y);
                }
                break;
            default:
                return;
        }

        console.log('newPos: ', newPos);

        if (newPos) {
            // calculate the position range of map
            //偏移临界值
            let minX = 0;
            let maxX = -mapSize.width + parentWidth;
            let minY = 0;
            let maxY = -mapSize.height + parentHeight;

            if (newPos.x > minX) newPos.x = minX;
            if (newPos.x < maxX) newPos.x = maxX;
            if (newPos.y > minY) newPos.y = minY;
            if (newPos.y < maxY) newPos.y = maxY;

            if (!newPos.equals(mapPos)) {
                console.log('Move the map to new position: ', newPos);
                this.node.setPosition(newPos);
                verticalOffset = verticalOffset + mapPos.y - newPos.y;
                horizontalOffset = horizontalOffset + mapPos.x - newPos.x;
            }
        }
        console.log('Return method [_tryMoveMapNew]');
    },


    /**
     * 辅助方法
     * 清除数组中的重复元素
     */
    _unique: function (arr) {
        let result = [], hash = {};
        for (let i = 0, elem; (elem = arr[i]) != null; i++) {
            if (!hash[elem]) {
                result.push(elem);
                hash[elem] = true;
            }
        }
        return result;
    },


    /**
     * 火焰蔓延
     */
    _fireSpread: function (current) {
        console.log('calling _fireSpread, param:' + current);

        //上
        if ((current + this.boardWidth < this.boardHeight * this.boardWidth - 1)
            && (this.chessList[current + this.boardWidth].getComponent(cc.Sprite).spriteFrame === this.middleFire
                || this.chessList[current + this.boardWidth].getComponent(cc.Sprite).spriteFrame === this.smallFire)) {
            let index = this.changeFireArray.indexOf(current + this.boardWidth);
            if (index <= -1) {
                cc.log('上边有中火或小火');
                this.changeFireArray.push(current + this.boardWidth);
                this._fireSpread(current + this.boardWidth);
            }
        }
        //下
        if ((current - this.boardWidth > 0)
            && (this.chessList[current - this.boardWidth].getComponent(cc.Sprite).spriteFrame === this.middleFire
                || this.chessList[current - this.boardWidth].getComponent(cc.Sprite).spriteFrame === this.smallFire)) {
            let index = this.changeFireArray.indexOf(current - this.boardWidth);
            if (index <= -1) {
                cc.log('下边有中火或小火');
                this.changeFireArray.push(current - this.boardWidth);
                this._fireSpread(current - this.boardWidth);
            }
        }
        //左
        if (!(current % this.boardWidth === 0)
            && this.chessList[current - 1].getComponent(cc.Sprite).spriteFrame === this.middleFire
            || this.chessList[current - 1].getComponent(cc.Sprite).spriteFrame === this.smallFire) {
            let index = this.changeFireArray.indexOf(current - 1);
            if (index <= -1) {
                cc.log('左边有中火或小火');
                this.changeFireArray.push(current - 1);
                this._fireSpread(current - 1);
            }
        }
        //右
        if (!((current + 1) % this.boardWidth === 0)
            && (this.chessList[current + 1].getComponent(cc.Sprite).spriteFrame === this.middleFire
                || this.chessList[current + 1].getComponent(cc.Sprite).spriteFrame === this.smallFire)) {
            let index = this.changeFireArray.indexOf(current + 1);
            if (index <= -1) {
                cc.log('右边有中火或小火');
                this.changeFireArray.push(current + 1);
                this._fireSpread(current + 1);
            }
        }

        console.log('Return _fireSpread');
        return;
    },


    _setNewBlackChess: function (changeFireArray) {
        cc.log('_setNewBlackChess');
        for (let i = 0; i < changeFireArray.length; i++) {
            this.chessList[changeFireArray[i]].getComponent(cc.Sprite).spriteFrame = this.bigFire;
            this.blackChessList.push(changeFireArray[i]);
        }
    },


    _setWhiteChess: function (firemanArray) {
        cc.log('_setWhiteChess');
        for (let i = 0; i < firemanArray.length; i++) {
            this.whiteChessList.push(firemanArray[i]);
        }
    },

    /**
     * 找最新的锚点
     */
    _circleCacular: function () {
        for (let i = 0; i < this.changeFireArray.length; i++) {
            let breath = this._breathCacular(this.changeFireArray[i]);
            if (breath != 0) {
                return this.changeFireArray[i];
            }
        }
        return -1;
    },

    /**
     * 计算蔓延的火焰的气
     */
    _circleValid: function () {
        let count = 0;
        for (let i = 0; i < this.changeFireArray.length; i++) {
            let breath = this._breathCacular(this.changeFireArray[i]);
            count = breath + count;
        }
        return count < this.nextBlackIndex.length ? count : this.nextBlackIndex.length;
    },

    /**
     * 根据火焰位置设置消防员贴图
     * @param {当前落子位置} current 
     */
    setFiremanSpriteFrame: function (current) {
        var index = this.chessList.indexOf(current);
        cc.log('消防员的索引: ' + index);

        let isValid = false;
        //判断边界条件
        //左边界
        cc.log('判断左边界');
        if (index % this.boardWidth === 0) {
            //上边界
            if (index + this.boardWidth > this.boardHeight * this.boardWidth - 1) {
                if (
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomRight;
                }
                else if (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Right;
                }

                else if (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            //下边界
            else if (index - this.boardWidth < 0) {
                if (
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopRight;
                }
                else if (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Right;
                }

                else if (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Top;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            else {
                if (
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopBottomRight;
                }
                else if (
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopRight;
                }
                else if (
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomRight;
                }
                else if (
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopBottom;
                }
                else if (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Right;
                }
                else if (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
                else if (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Top;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            isValid = true;
        }

        cc.log('判断右边界');
        //右边界
        if ((index + 1) % this.boardWidth === 0) {
            //上边界
            if (index + this.boardWidth > this.boardWidth * this.boardHeight - 1) {
                if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomLeft;
                }
                else if (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Left;
                }

                else if (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            //下边界
            else if (index - this.boardWidth < 0) {
                if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopLeft;
                }
                else if (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Left;
                }

                else if (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Top;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            else {
                if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopBottomLeft;
                }
                else if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopLeft;
                }
                else if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomLeft;
                }
                else if (
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopBottom;
                }
                else if (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Left;
                }
                else if (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
                else if (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Top;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            isValid = true;
        }

        cc.log('判断上边界');
        //上边界
        if (index + this.boardWidth > this.boardWidth * this.boardHeight - 1) {
            //左边界
            if (index % this.boardWidth === 0) {
                if ((this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                ) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomRight;
                }
                else if (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Right;
                }
                else if (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            //右边界
            else if ((index + 1) % this.boardWidth === 0) {
                if ((this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                ) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomLeft;
                }
                else if (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Left;
                }
                else if (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            else {
                if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomLeftRight;
                }
                else if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.LeftRight;
                }
                else if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomLeft;
                }
                else if (
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomRight;
                }
                else if (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Left;
                }
                else if (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
                else if (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Right;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            isValid = true;
        }

        cc.log('判断下边界');
        //下边界
        if (index - this.boardWidth < 0) {
            //左边界
            if (index % this.boardWidth === 0) {
                if (
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                ) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopRight;
                }
                else if (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Right;
                }
                else if (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Top;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }

            }
            //右边界
            else if ((index + 1) % this.boardWidth === 0) {
                if ((this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire)
                ) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopLeft;
                }
                else if (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Left;
                }
                else if (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Top;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }
            }
            else {
                if ((this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopLeftRight;
                }
                else if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.LeftRight;
                }
                else if (
                    (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopLeft;
                }
                else if (
                    (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )
                    &&
                    (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                        || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                    )) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopRight;
                }
                else if (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Left;
                }
                else if (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Top;
                }
                else if (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Right;
                }
                else {
                    this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
                }

            }
            isValid = true;
        }
        //普通情况 4+ 4+ 6

        if (!isValid) {
            //3方向 4
            if (
                (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopLeftRight;
            }
            else if (
                (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomLeftRight;
            }
            else if (
                (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopBottomLeft;
            }
            else if (
                (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopBottomRight;
            }
            //2方向 6
            else if (
                (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.LeftRight;
            }
            else if (
                (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopLeft;
            }
            else if (
                (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopRight;
            }
            else if (
                (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopRight;
            }
            else if (
                (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.BottomRight;
            }
            else if (
                (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )
                &&
                (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                    || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire
                )) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.TopBottom;
            }
            //1方向 4
            else if (this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                || this.chessList[index - 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                //cc.log('一个方向');
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Left;
            }
            else if (this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                || this.chessList[index + this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Top;
            }
            else if (this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.bigFire
                || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.middleFire
                || this.chessList[index + 1].getComponent(cc.Sprite).spriteFrame == this.smallFire) {

                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Right;
            }
            else if (this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.bigFire
                || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.middleFire
                || this.chessList[index - this.boardWidth].getComponent(cc.Sprite).spriteFrame == this.smallFire) {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
            }
            else {
                this.chessList[index].getComponent(cc.Sprite).spriteFrame = this.Bottom;
            }
        }
    },
});
