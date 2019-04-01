cc.Class({
    extends: cc.Component,

    properties: {
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        //cc.log('mission', globalNode.mission);
    },

    // update (dt) {},

    onCommonModeIndex: function(){
        cc.director.loadScene('CommonModeIndex');
    },

    restartCommonModeGame: function(){
        cc.director.loadScene('GameScene');
    }
});
