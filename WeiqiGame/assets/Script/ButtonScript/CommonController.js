var gameManager = require("GameManager");
cc.Class({
    extends: cc.Component,

    properties: {
        rankView: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:
    start() {
        this._isShow = false;
        this._show = cc.moveTo(0.5, 0, 35);
        this._hide = cc.moveTo(0.5, 0, 1000);
        this.rankView.runAction(this._hide);
        if (CC_WECHATGAME) {
            wx.getOpenDataContext().postMessage({
                messageType: 1,
                key: 'score',
                message: "User info get success."
            });
        }
    },

    onLoad: function () {
    },

    onGameIndexButton: function () {
        cc.director.loadScene('IndexScene');
    },

    onCommonModeIndexButton: function () {
        cc.director.loadScene('CommonModeIndex');
    },

    onQuickModeButton: function () {
        gameManager.mission = this._randomNum(1, 4);
        cc.director.loadScene('QuickScene');
    },

    onRankButton: function () {
        this._isShow = !this._isShow;
        if (this._isShow) {
            this.rankView.runAction(this._show);
        }
        else {
            this.rankView.runAction(this._hide);
        }
    },

    //快速模式生成随机数
    _randomNum: function (minNum, maxNum) {
        switch (arguments.length) {
            case 1:
                return parseInt(Math.random() * minNum + 1, 10);
                break;
            case 2:
                return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
                break;
            default:
                return 1;
                break;
        }
    }
});
