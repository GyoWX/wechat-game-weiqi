import energyManager from "EnergyManager";

cc.Class({
    extends: cc.Component,

    properties: {
        //显示倒计时的信息
        countDownLabel: {
            default: null,
            type: cc.Label
        },
    
        intervalTime: {
            default: 1,
            visible: false
        },
    },

    onLoad: function () {
        cc.log("关闭时时间戳", energyManager.hideTime);
        this.inintCountDownShow();
    },
    
    start(){
        this._endLayer = this.node.getParent().getParent().getChildByName('EndLayer');
        this._endLayer.active = false;
        this._endScore = this._endLayer.getChildByName('Score');
        this._score = this.node.getParent().getChildByName('Score');
    },

    update (dt) {
        //每秒更新显示信息
        if (this.intervalTime >= 0 ) {
            this.intervalTime -= dt;
        }else if(this.intervalTime == -500){

        }
        else {
            this.intervalTime = 1;
            this.countDownShow();
        }
    },
    
    //初始化倒计时界面
    inintCountDownShow: function () {
        var backTime = energyManager.hideTime;
        if (backTime != 0) {
            var date = new Date();
            var currentTime = date.getTime();
            var intervalSecond = Math.floor((currentTime - backTime) / 1000);
            energyManager.reduiseTime = energyManager.reduiseTime - intervalSecond;
        }else {
            var cycleTime = energyManager.manyTims; //1
            energyManager.reduiseTime = energyManager.baseCycle * cycleTime * 60;
        }
    },
    
     
    /**
    * 倒计时信息显示
    */
    countDownShow: function () {
        var baseSecond = energyManager.reduiseTime;
        baseSecond = baseSecond - 1;
        energyManager.reduiseTime = baseSecond;
        var hour = Math.floor(baseSecond / 3600);
        var residue = baseSecond - hour * 3600;
        var minute = Math.floor(residue / 60);
        residue = residue - minute * 60;
    
        if (hour < 10) {
            hour = "0" + hour;
        }
        if (minute < 10) {
            minute = "0" + minute;
        }
        if (residue < 10) {
            residue = "0" + residue;
        }
        this.countDownLabel.getComponent(cc.Label).string = hour + ":" + minute + ":" + residue;

        if (hour == "00" && minute == "00" && residue == "00"){
            this._endLayer.active = true;
            this.intervalTime = -500;
            this._endScore.getComponent(cc.Label).string = this._score.getComponent(cc.Label).string;
            this.submitScore(this._endScore.getComponent(cc.Label).string);
        }
    },

    submitScore: function(score){
        wx.getOpenDataContext().postMessage({
            messageType: 0,
            key: 'score',
            score: score,
            message: "User info get success."    
        });
    },
});
