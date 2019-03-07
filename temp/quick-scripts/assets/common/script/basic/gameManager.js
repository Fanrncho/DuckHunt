(function() {"use strict";var __module = CC_EDITOR ? module : {exports:{}};var __filename = 'preview-scripts/assets/common/script/basic/gameManager.js';var __require = CC_EDITOR ? function (request) {return cc.require(request, require);} : function (request) {return cc.require(request, __filename);};function __define (exports, require, module) {"use strict";
cc._RF.push(module, '71befhMjOZLK4kQqOY4yNmZ', 'gameManager', __filename);
// common/script/basic/gameManager.js

"use strict";

var mvs = require("Matchvs");
var GLB = require("Glb");

cc.Class({
    extends: cc.Component,

    blockInput: function blockInput() {
        Game.GameManager.getComponent(cc.BlockInputEvents).enabled = true;
        setTimeout(function () {
            Game.GameManager.node.getComponent(cc.BlockInputEvents).enabled = false;
        }, 1000);
    },
    onLoad: function onLoad() {
        Game.GameManager = this;
        cc.game.addPersistRootNode(this.node);
        cc.director.getCollisionManager().enabled = true;
        clientEvent.init();
        dataFunc.loadConfigs();
        cc.view.enableAutoFullScreen(false);
        this.coin = 100;
        clientEvent.on(clientEvent.eventType.gameOver, this.gameOver, this);
        clientEvent.on(clientEvent.eventType.leaveRoomNotify, this.leaveRoom, this);
        this.network = window.network;
        this.network.chooseNetworkMode();
        this.getRankDataListener();
        this.findPlayerByAccountListener();
        // try {
        //     wx.login({
        //         success: function() {
        //             wx.getUserInfo({
        //                 fail: function(res) {
        //                     // iOS 和 Android 对于拒绝授权的回调 errMsg 没有统一，需要做一下兼容处理
        //                     if (res.errMsg.indexOf('auth deny') > -1 || res.errMsg.indexOf('auth denied') > -1) {
        //                         // 处理用户拒绝授权的情况
        //                         console.log("fail");
        //                     }
        //                 },
        //                 success: function(res) {
        //                     Game.GameManager.nickName = res.userInfo.nickName;
        //                     Game.GameManager.avatarUrl = res.userInfo.avatarUrl;
        //                     console.log('success', Game.GameManager.nickName);
        //                 }
        //             });
        //         }
        //     })
        // } catch (e) {
        // }
    },


    leaveRoom: function leaveRoom(data) {
        //切换房主
        if (Game.GameManager.gameState === GameState.Play) {
            if (data.leaveRoomInfo.owner === GLB.userInfo.id) {
                GLB.isRoomOwner = true;
            }
        }
    },

    gameOver: function gameOver() {
        // 打开结算界面--
        var gamePanel = uiFunc.findUI("uiGamePanel");
        if (gamePanel && Game.GameManager.gameState !== GameState.Over) {
            Game.GameManager.gameState = GameState.Over;
            var data = [].concat(GLB.playerUserIds);
            data.sort(function (a, b) {
                var playerA = Game.PlayerManager.getPlayerByUserId(a);
                var playerB = Game.PlayerManager.getPlayerByUserId(b);
                if (playerA && playerB) {
                    if (playerB.score !== playerA.score) {
                        return playerB.score - playerA.score;
                    } else {
                        if (a === GLB.userInfo.id) {
                            return -1;
                        } else if (b === GLB.userInfo.id) {
                            return 1;
                        }
                    }
                }
                return a - b;
            });

            setTimeout(function () {
                if (cc.Canvas.instance.designResolution.height > cc.Canvas.instance.designResolution.width) {
                    uiFunc.openUI("uiResultVer", function (obj) {
                        var uiResultScript = obj.getComponent("uiResult");
                        if (uiResultScript) {
                            uiResultScript.setData(data);
                        }
                    });
                } else {
                    uiFunc.openUI("uiResult", function (obj) {
                        var uiResultScript = obj.getComponent("uiResult");
                        if (uiResultScript) {
                            uiResultScript.setData(data);
                        }
                    });
                }
            }.bind(this), 1500);
        }
    },

    startGame: function startGame() {
        this.readyCnt = 0;
        this.gameState = GameState.Pause;
        cc.director.loadScene('game', function () {
            uiFunc.openUI("uiGamePanel", function () {
                this.sendReadyMsg();
                Game.PlayerManager.initPlayers();
            }.bind(this));
        }.bind(this));

        if (GLB.syncFrame === true && GLB.isRoomOwner === true) {
            var result = mvs.engine.setFrameSync(GLB.FRAME_RATE);
            if (result !== 0) {
                console.log('设置帧同步率失败,错误码:' + result);
            }
        }
    },

    setFrameSyncResponse: function setFrameSyncResponse(rsp) {
        if (rsp.mStatus !== 200) {
            console.log('设置同步帧率失败，status=' + rsp.status);
        } else {
            console.log('设置同步帧率成功, 帧率为:' + GLB.FRAME_RATE);
        }
    },

    matchVsInit: function matchVsInit() {
        mvs.response.initResponse = this.initResponse.bind(this);
        mvs.response.errorResponse = this.errorResponse.bind(this);
        mvs.response.joinRoomResponse = this.joinRoomResponse.bind(this);
        mvs.response.joinRoomNotify = this.joinRoomNotify.bind(this);
        mvs.response.leaveRoomResponse = this.leaveRoomResponse.bind(this);
        mvs.response.leaveRoomNotify = this.leaveRoomNotify.bind(this);
        mvs.response.joinOverResponse = this.joinOverResponse.bind(this);
        mvs.response.createRoomResponse = this.createRoomResponse.bind(this);
        mvs.response.getRoomListResponse = this.getRoomListResponse.bind(this);
        mvs.response.getRoomDetailResponse = this.getRoomDetailResponse.bind(this);
        mvs.response.getRoomListExResponse = this.getRoomListExResponse.bind(this);
        mvs.response.kickPlayerResponse = this.kickPlayerResponse.bind(this);
        mvs.response.kickPlayerNotify = this.kickPlayerNotify.bind(this);
        mvs.response.registerUserResponse = this.registerUserResponse.bind(this);
        mvs.response.loginResponse = this.loginResponse.bind(this); // 用户登录之后的回调
        mvs.response.logoutResponse = this.logoutResponse.bind(this); // 用户登录之后的回调
        mvs.response.sendEventNotify = this.sendEventNotify.bind(this);
        mvs.response.frameUpdate = this.frameUpdate.bind(this);
        mvs.response.setFrameSyncResponse = this.setFrameSyncResponse.bind(this);
        mvs.response.networkStateNotify = this.networkStateNotify.bind(this);

        // var result = mvs.engine.init(mvs.response, GLB.channel, GLB.platform, GLB.gameId);
        var result = mvs.engine.init(mvs.response, GLB.channel, GLB.platform, GLB.gameId, GLB.appKey, GLB.gameVersion);
        if (result !== 0) {
            console.log('初始化失败,错误码:' + result);
        }
        Game.GameManager.blockInput();
    },

    networkStateNotify: function networkStateNotify(netNotify) {
        clientEvent.dispatch(clientEvent.eventType.leaveRoomMedNotify, netNotify);
    },

    kickPlayerNotify: function kickPlayerNotify(_kickPlayerNotify) {
        var data = {
            kickPlayerNotify: _kickPlayerNotify
        };
        clientEvent.dispatch(clientEvent.eventType.kickPlayerNotify, data);
    },

    kickPlayerResponse: function kickPlayerResponse(kickPlayerRsp) {
        if (kickPlayerRsp.status !== 200) {
            console.log("失败kickPlayerRsp:" + kickPlayerRsp);
            return;
        }
        var data = {
            kickPlayerRsp: kickPlayerRsp
        };
        clientEvent.dispatch(clientEvent.eventType.kickPlayerResponse, data);
    },

    getRoomListExResponse: function getRoomListExResponse(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 rsp:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        };
        clientEvent.dispatch(clientEvent.eventType.getRoomListExResponse, data);
    },

    getRoomDetailResponse: function getRoomDetailResponse(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 rsp:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        };
        clientEvent.dispatch(clientEvent.eventType.getRoomDetailResponse, data);
    },

    getRoomListResponse: function getRoomListResponse(status, roomInfos) {
        if (status !== 200) {
            console.log("失败 status:" + status);
            return;
        }
        var data = {
            status: status,
            roomInfos: roomInfos
        };
        clientEvent.dispatch(clientEvent.eventType.getRoomListResponse, data);
    },

    createRoomResponse: function createRoomResponse(rsp) {
        if (rsp.status !== 200) {
            console.log("失败 createRoomResponse:" + rsp);
            return;
        }
        var data = {
            rsp: rsp
        };
        clientEvent.dispatch(clientEvent.eventType.createRoomResponse, data);
    },

    joinOverResponse: function joinOverResponse(joinOverRsp) {
        if (joinOverRsp.status !== 200) {
            console.log("失败 joinOverRsp:" + joinOverRsp);
            return;
        }
        var data = {
            joinOverRsp: joinOverRsp
        };
        clientEvent.dispatch(clientEvent.eventType.joinOverResponse, data);
    },

    joinRoomResponse: function joinRoomResponse(status, roomUserInfoList, roomInfo) {
        if (status !== 200) {
            console.log("失败 joinRoomResponse:" + status);
            return;
        }
        var data = {
            status: status,
            roomUserInfoList: roomUserInfoList,
            roomInfo: roomInfo
        };
        clientEvent.dispatch(clientEvent.eventType.joinRoomResponse, data);
    },

    joinRoomNotify: function joinRoomNotify(roomUserInfo) {
        var data = {
            roomUserInfo: roomUserInfo
        };
        clientEvent.dispatch(clientEvent.eventType.joinRoomNotify, data);
    },

    leaveRoomResponse: function leaveRoomResponse(leaveRoomRsp) {
        if (leaveRoomRsp.status !== 200) {
            console.log("失败 leaveRoomRsp:" + leaveRoomRsp);
            return;
        }
        var data = {
            leaveRoomRsp: leaveRoomRsp
        };
        clientEvent.dispatch(clientEvent.eventType.leaveRoomResponse, data);
    },

    leaveRoomNotify: function leaveRoomNotify(leaveRoomInfo) {
        var data = {
            leaveRoomInfo: leaveRoomInfo
        };
        clientEvent.dispatch(clientEvent.eventType.leaveRoomNotify, data);
    },

    logoutResponse: function logoutResponse(status) {
        Game.GameManager.network.disconnect();
        console.log("reload lobby");
        cc.game.removePersistRootNode(this.node);
        cc.director.loadScene('lobby');
    },

    errorResponse: function errorResponse(error, msg) {
        if (error === 1001 || error === 0) {
            uiFunc.openUI("uiTip", function (obj) {
                var uiTip = obj.getComponent("uiTip");
                if (uiTip) {
                    uiTip.setData("网络断开连接");
                }
            });
            setTimeout(function () {
                mvs.engine.logout("");
                cc.game.removePersistRootNode(this.node);
                cc.director.loadScene('lobby');
            }.bind(this), 2500);
        }
        console.log("错误信息：" + error);
        console.log("错误信息：" + msg);
    },

    initResponse: function initResponse() {
        console.log('初始化成功，开始注册用户');
        var result = mvs.engine.registerUser();
        if (result !== 0) {
            console.log('注册用户失败，错误码:' + result);
        } else {
            console.log('注册用户成功');
        }
    },

    registerUserResponse: function registerUserResponse(userInfo) {
        var deviceId = 'abcdef';
        var gatewayId = 0;
        GLB.userInfo = userInfo;

        console.log('开始登录,用户Id:' + userInfo.id);

        /*var result = mvs.engine.login(
            userInfo.id, userInfo.token,
            GLB.gameId, GLB.gameVersion,
            GLB.appKey, GLB.secret,
            deviceId, gatewayId
        );*/
        var result = mvs.engine.login(userInfo.id, userInfo.token, deviceId);
        if (result !== 0) {
            console.log('登录失败,错误码:' + result);
        }
    },

    loginResponse: function loginResponse(info) {
        if (info.status !== 200) {
            console.log('登录失败,异步回调错误码:' + info.status);
        } else {
            console.log('登录成功');
            this.lobbyShow();
        }
    },

    lobbyShow: function lobbyShow() {
        this.gameState = GameState.None;
        if (cc.Canvas.instance.designResolution.height > cc.Canvas.instance.designResolution.width) {
            uiFunc.openUI("uiLobbyPanelVer");
        } else {
            uiFunc.openUI("uiLobbyPanel");
        }
    },

    // 玩家行为通知--
    sendEventNotify: function sendEventNotify(info) {
        var cpProto = JSON.parse(info.cpProto);

        if (info.cpProto.indexOf(GLB.GAME_START_EVENT) >= 0) {
            GLB.playerUserIds = [GLB.userInfo.id];
            this.scores = [];
            var self = this;
            var remoteUserIds = JSON.parse(info.cpProto).userIds;
            remoteUserIds.forEach(function (id) {
                if (GLB.userInfo.id !== id) {
                    GLB.playerUserIds.push(id);
                }
                var score = {
                    playerId: id,
                    score: 0
                };
                self.scores.push(score);
            });
            this.startGame();
        }

        var player = null;
        if (info.cpProto.indexOf(GLB.PLAYER_FIRE_EVENT) >= 0) {
            player = Game.PlayerManager.getPlayerByUserId(info.srcUserId);
            if (player) {
                var worldPos = player.node.convertToWorldSpaceAR(cc.v2(0, 177));
                var bulletPoint = player.node.parent.parent.convertToNodeSpaceAR(worldPos);
                if (cpProto.bulletType === BulletType.Normal) {
                    Game.BulletManager.spawnSmallBullet(player.node, bulletPoint);
                } else if (cpProto.bulletType === BulletType.Special) {
                    Game.BulletManager.spawnBigBullet(player.node, bulletPoint);
                }
            }
        }

        if (info.cpProto.indexOf(GLB.GAME_TIME) >= 0) {
            this.gameTime = parseInt(cpProto.time);
            if (cpProto.time < 0) {
                cpProto.time = 0;
            }
            clientEvent.dispatch(clientEvent.eventType.time, cpProto.time);
        }

        if (info.cpProto.indexOf(GLB.SCORE_EVENT) >= 0) {
            player = Game.PlayerManager.getPlayerByUserId(info.srcUserId);
            if (player) {
                player.addScore(cpProto.score);
            }
            if (info.srcUserId === GLB.userInfo.id) {
                this.coin += cpProto.score / 5;
                clientEvent.dispatch(clientEvent.eventType.updateCoin);
            }
        }

        if (info.cpProto.indexOf(GLB.GAME_OVER_EVENT) >= 0) {
            clientEvent.dispatch(clientEvent.eventType.gameOver);
            this.coin = Math.floor(this.coin);
        }

        if (info.cpProto.indexOf(GLB.READY) >= 0) {
            this.readyCnt++;
            if (GLB.isRoomOwner && this.readyCnt >= GLB.playerUserIds.length) {
                this.sendRoundStartMsg();
            }
        }

        if (info.cpProto.indexOf(GLB.ROUND_START) >= 0) {
            setTimeout(function () {
                Game.GameManager.gameState = GameState.Play;
                this.gameTime = Game.GameSeconds;
                this.timeUpdate();
            }.bind(this), 7000);
            clientEvent.dispatch(clientEvent.eventType.roundStart);
        }
    },

    sendReadyMsg: function sendReadyMsg() {
        var msg = { action: GLB.READY };
        this.sendEventEx(msg);
    },

    sendRoundStartMsg: function sendRoundStartMsg() {
        var msg = { action: GLB.ROUND_START };
        this.sendEventEx(msg);
    },

    frameUpdate: function frameUpdate(rsp) {
        for (var i = 0; i < rsp.frameItems.length; i++) {
            var info = rsp.frameItems[i];
            if (info && info.cpProto && info.srcUserId !== GLB.userInfo.id) {
                if (info.cpProto.indexOf(GLB.PLAYER_ROTATION_EVENT) >= 0) {
                    var cpProto = JSON.parse(info.cpProto);
                    if (Game.PlayerManager) {
                        var player = Game.PlayerManager.getPlayerByUserId(info.srcUserID);
                        if (player) {
                            player.setRotation(cpProto.rotation);
                        }
                    }
                }
            }
        }
    },

    timeUpdate: function timeUpdate() {
        var self = this;
        clearInterval(this.timeId);
        this.timeId = setInterval(function () {
            if (GLB.isRoomOwner) {
                var time = self.gameTime - 1;
                var msg = {
                    action: GLB.GAME_TIME,
                    time: time
                };
                Game.GameManager.sendEventEx(msg);
                if (time < 0 || this.gameState === GameState.Over || this.gameState === GameState.None) {
                    clearInterval(this.timeId);
                    var msg = {
                        action: GLB.GAME_OVER_EVENT
                    };
                    Game.GameManager.sendEventEx(msg);
                }
            } else {
                if (self.gameTime < 0 || this.gameState === GameState.Over || this.gameState === GameState.None) {
                    clearInterval(this.timeId);
                }
            }
        }.bind(this), 1000);
    },

    getRankDataListener: function getRankDataListener() {
        this.network.on("connector.rankHandler.getRankData", function (recvMsg) {
            uiFunc.openUI("uiRankPanelVer", function (obj) {
                var uiRankPanel = obj.getComponent("uiRankPanel");
                uiRankPanel.setData(recvMsg.rankArray);
            });
        }.bind(this));
    },

    findPlayerByAccountListener: function findPlayerByAccountListener() {
        this.network.on("connector.entryHandler.findPlayerByAccount", function (recvMsg) {
            clientEvent.dispatch(clientEvent.eventType.playerAccountGet, recvMsg);
        });
    },

    loginServer: function loginServer() {
        if (!this.network.isConnected()) {
            this.network.connect(GLB.IP, GLB.PORT, function () {
                if (!this.network.isOpen()) {
                    return;
                }
                this.network.send("connector.entryHandler.login", {
                    "account": GLB.userInfo.id + "",
                    "channel": "0",
                    "userName": Game.GameManager.nickName ? Game.GameManager.nickName : GLB.userInfo.id + "",
                    "headIcon": Game.GameManager.avatarUrl ? Game.GameManager.avatarUrl : "-"
                });
                setTimeout(function () {
                    this.network.send("connector.rankHandler.updateScore", {
                        "account": GLB.userInfo.id + "",
                        "game": "game3"
                    });
                }.bind(this), 500);
            }.bind(this));
        } else {
            this.network.send("connector.rankHandler.updateScore", {
                "account": GLB.userInfo.id + "",
                "game": "game3"
            });
        }
    },

    userInfoReq: function userInfoReq(userId) {
        if (!Game.GameManager.network.isConnected()) {
            Game.GameManager.network.connect(GLB.IP, GLB.PORT, function () {
                Game.GameManager.network.send("connector.entryHandler.login", {
                    "account": GLB.userInfo.id + "",
                    "channel": "0",
                    "userName": Game.GameManager.nickName ? Game.GameManager.nickName : GLB.userInfo.id + "",
                    "headIcon": Game.GameManager.avatarUrl ? Game.GameManager.avatarUrl : "-"
                });
                setTimeout(function () {
                    Game.GameManager.network.send("connector.entryHandler.findPlayerByAccount", {
                        "account": userId + ""
                    });
                }, 200);
            });
        } else {
            Game.GameManager.network.send("connector.entryHandler.findPlayerByAccount", {
                "account": userId + ""
            });
        }
    },

    sendEventEx: function sendEventEx(msg) {
        var result = mvs.engine.sendEventEx(0, JSON.stringify(msg), 0, GLB.playerUserIds);
        if (result.result !== 0) {
            console.log(msg.action, result.result);
        }
    }
});

cc._RF.pop();
        }
        if (CC_EDITOR) {
            __define(__module.exports, __require, __module);
        }
        else {
            cc.registerModuleFunc(__filename, function () {
                __define(__module.exports, __require, __module);
            });
        }
        })();
        //# sourceMappingURL=gameManager.js.map
        