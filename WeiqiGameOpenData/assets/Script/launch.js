cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        prefab: cc.Prefab
    },

    start () {
        let _self = this;

        wx.onMessage( data => {
            console.log(data.message);
            if (data.messageType == 0){ //提交分数
                this.submitScore(data.key, data.score);
            }else if (data.messageType == 1){ //获取好友排行榜
                this.fetchFriendData(data.key);
            }else if (data.messageType == 10){ //清楚创建的块
                this.clearBlock();
            }
        });
    },


    /**
     * 获取好友排行榜
     * @param {KVDataList键值} key 
     */
    fetchFriendData: function(key){
        this.clearBlock();
        wx.getUserInfo({
            openIdList: ['selfOpenId'],
            success: (resData) => {
                console.log('wx.getUserInfo', 'success', resData.data);
                let userData = resData.data[0];
                //获取所有好友数据
                wx.getFriendCloudStorage({
                    keyList: [key],
                    success: res => {
                        console.log("wx.getFriendCloudStorage success", res);
                        let data = res.data;
                        data.sort((a, b) => {
                            if (a.KVDataList.length == 0 && b.KVDataList.length == 0) {
                                return 0;
                            }
                            if (a.KVDataList.length == 0) {
                                return 1;
                            }
                            if (b.KVDataList.length == 0) {
                                return -1;
                            }
                            return b.KVDataList[0].value - a.KVDataList[0].value;
                        });

                        for (let i = 0; i < data.length; i++) {
                            let friendInfo = data[i];
                            console.log('friendInfo:' + friendInfo);
                            if (!friendInfo) {
                                console.log('createPrefab');
                                continue;
                            }
                            if (userData.avatarUrl == friendInfo.avatarUrl){
                                this.createUserBlock(i, friendInfo, true);
                            }
                            else{
                                this.createUserBlock(i, friendInfo, false);
                            }
                            
                        }
                    },
                    fail: res => {
                        console.log('wx.getFriendCloudStorage', 'fail', res);
                    },
                    complete: res =>{
                        console.log('wx.getFriendCloudStorage', 'complete', res);
                    }
                });
            },
            fail: (res) => {
                console.log('wx.getUserInfo', 'fail', res);
            },
            complete: res =>{
                console.log('wx.getUserInfo', 'complete', res);
            }
        });
    },


    /**
     * 游戏结束，提交分数
     * @param {KVDataList键值} key 
     * @param {玩家得分} score 
     */
    submitScore: function(key, score){
        wx.getUserCloudStorage({
            keyList:[key],
            success: function (res) {
                console.log('getUserCloudStorage', 'success', res);
                if (res.KVDataList.length != 0){
                    console.log('old score: ', parseInt(res.KVDataList[0].value), 'new score: ', score);
                    if (parseInt(res.KVDataList[0].value) > score){
                        return;
                    }
                }

                wx.setUserCloudStorage({
                    KVDataList:[{key: key, value: score + ''}],
                    success: function (res) {
                        console.log('setUserCloudStorage', 'success', res);
                    },
                    fail: function (res) {
                        console.log('setUserCloudStorage', 'fail');
                    },
                    complete: function (res) {
                        console.log('setUserCloudStorage', 'ok');
                    }
                });
            },
            fail: function (res) {
                console.log('getUserCloudStorage', 'fail');
            },
            complete: function (res) {
                console.log('getUserCloudStorage', 'complete');
            }
        });
    },


    createUserBlock (grade, user, isSelf) {
        if(!user){
            return;
        }
        let node = this.createPrefab();

        if (isSelf){
            node.Color = new cc.Color(255, 0, 0);
            console.log('This is Self.');
        }
        // getUserInfo will return the nickName, getFriendCloudStorage will return the nickname.
        let nickName = user.nickName ? user.nickName : user.nickname;
        let score = user.KVDataList[0].value;
        let avatarUrl = user.avatarUrl;

        let userGrade = node.getChildByName('userGrade').getComponent(cc.Label);
        let userName = node.getChildByName('userName').getComponent(cc.Label);
        let userScore = node.getChildByName('userScore').getComponent(cc.Label);
        let userIcon = node.getChildByName('mask').children[0].getComponent(cc.Sprite);

        userGrade.string = grade + 1;
        userName.string = nickName;
        userScore.string = score;
        console.log(nickName + '\'s info has been getten.');
        cc.loader.load({
            url: avatarUrl, type: 'png'
        }, (err, texture) => {
            if (err) console.error(err);
            userIcon.spriteFrame = new cc.SpriteFrame(texture);
        });                   
    },

    createPrefab () {
        let node = cc.instantiate(this.prefab);
        node.parent = this.content;
        return node;
    },

    clearBlock (){
        console.log('clearBlock begin~~~~~~~~');
        for(let i = 0; i < this.content.children.length; i++) {
            console.log('content children number', i, 'name', this.content.children[i].name);
            if(this.content.children[i].name == 'block') {
                this.content.children[i].destroy();
            }
        }
    }

});
