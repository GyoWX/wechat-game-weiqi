var gameManager = require("GameManager");
cc.Class({
    extends: cc.Component,

    properties: {
    },

    /**
     * 初始化时定义常驻节点，作为关卡
     */
    start() {
        cc.log('Calling SceneManager');
        cc.log('mission:', gameManager.mission);
        cc.game.addPersistRootNode(gameManager);
        cc.log('final add');
    },

    ReStartQuickGameMission: function () {
        cc.director.loadScene('QuickScene'), function () { };
    },


    /**
     * 回到游戏主界面时，销毁常驻节点
     */
    onGameIndexButton: function () {
        cc.director.loadScene('IndexScene', function () {
            cc.game.removePersistRootNode(gameManager);
            cc.log('Destroy PersistRootNode');
        });
    },

    onCommonModeIndexButton: function () {
        cc.director.loadScene('CommonModeIndex');
    },

    onCommonMode1Button: function () {
        gameManager.mission = 1;
        cc.log('普通模式, 第', gameManager.mission, '关');
        cc.director.loadScene('GameScene');
    },

    onCommonMode2Button: function () {
        gameManager.mission = 2;
        cc.log('普通模式, 第', gameManager.mission, '关');
        cc.director.loadScene('GameScene');
    },

    onCommonMode3Button: function () {
        gameManager.mission = 3;
        cc.log('普通模式, 第', gameManager.mission, '关');
        cc.director.loadScene('GameScene');
    },

    onCommonMode4Button: function () {
        gameManager.mission = 4;
        cc.log('普通模式, 第', gameManager.mission, '关');
        cc.director.loadScene('GameScene');
    },

    onCommonMode5Button: function () {
        gameManager.mission = 5;
        cc.log('普通模式, 第', gameManager.mission, '关');
        cc.director.loadScene('GameScene');
    },


    // update (dt) {},
});
