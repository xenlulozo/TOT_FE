/**
 * Enum chứa tất cả các event client gửi lên server (SubscribeMessage)
 */
export enum SocketClientEvent {
    JoinRoom = "joinRoom",
    PlayerRename = "player:rename",
    PlayerAvatarUpdate = "player:avatarUpdate",
    TotStartGame = "tot:startGame",
    TotDrawNext = "tot:drawNext",
    TotChooseOption = "tot:chooseOption",
    TotTurnOptionSelected = "tot:turnOptionSelected",
    TotFinishTurn = "tot:finishTurn",
    LeaveRoom = "leaveRoom",
    UpdateMeta = "updateMeta",
    PlayerAction = "playerAction",
    TotControlGame = "tot:controlGame",
}

/**
 * Enum chứa tất cả các event server emit xuống client
 */
export enum SocketServerEvent {
    PlayerLeft = "playerLeft",
    PlayerRenamed = "playerRenamed",
    PlayerAvatarUpdated = "playerAvatarUpdated",
    RoomUpdate = "roomUpdate",
    TotGameStarted = "tot:gameStarted",
    TotPlayerSelected = "tot:playerSelected",
    TotPlayerPoolExhausted = "tot:playerPoolExhausted",
    TotTurnOptionSelected = "tot:turnOptionSelected",
    TotOutOfTurn = "tot:outOfTurn",
    TotSpinning = "tot:spinning",
    TotTurnFinished = "tot:turnFinished",
    TotGameEnded = "tot:gameEnded",
    TotGameRestarted = "tot:gameRestarted",
    PlayerAction = "playerAction",
}

