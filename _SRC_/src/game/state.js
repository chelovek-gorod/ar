import { Assets } from "pixi.js"
import { EventHub, events, getNextLevel } from "../app/events"
import { setLeaderboardScore, updateStoredData } from "../game/storage"
import { createEnum } from "../utils/functions"

export let isAdAvailable = true

// 0 - level open; 1,2,3 - stars
export const levels = [ 0, ]
export const levelIndex = 0
let cachedLevelUrl = null
let cachedLevelData = null
export function getLevelData(callback) {
    const levelNumber = levelIndex + 1
    const url = levelNumber <= 50 ? './levels/1_50.json'
        : levelNumber <= 100 ? './levels/51_100.json'
        : levelNumber <= 150 ? './levels/101_150.json'
        : './levels/151_200.json'

    if (url !== cachedLevelUrl) {
        Assets.load(url).then( json => {
            cachedLevelData = json
            cachedLevelUrl = url
            callback(json["level_" + levelNumber])
        })
    } else {
        // файл уже в кеше, используем сразу
        callback(cachedLevelData["level_" + levelNumber])
    }
}

export let playerScore = 0
export let playerCoins = 0
export let playerBalls = 3
export let playerPower = 1
export let playerBonusCountPowers = 0
export let playerBonusCountGuns = 0
export let playerBonusCountSize = 0
export let playerBonusCountWall = 0

export function addPlayerScore(count) {
    playerScore += count
}

export function addPlayerCoins(count) {
    playerCoins += count
}
export function removePlayerCoins(count) {
    playerCoins -= count
}

export function addPlayerBall() {
    playerBalls++
}
export function removePlayerBall() {
    playerBalls--
}

export function addPlayerPower() {
    playerPower = Math.min(5, playerPower + 1)
}
export function resetPlayerPower() {
    playerPower = 1
}

export function addPlayerBonusCountPowers() {
    playerBonusCountPowers++
}
export function removePlayerBonusCountPowers() {
    playerBonusCountPowers--
}

export function addPlayerBonusCountGuns() {
    playerBonusCountGuns++
}
export function removePlayerBonusCountGuns() {
    playerBonusCountGuns--
}

export function addPlayerBonusCountWalls() {
    playerBonusCountWalls++
}
export function removePlayerBonusCountWalls() {
    playerBonusCountWalls--
}


export function getStateData() {
    const gameState =  {
        
    }
    return gameState
}

export function setStoredState(savedState) {
    if (!savedState) return

    /*
    if ('playerAvatarsShop' in savedState) playerAvatarsShop = savedState.playerAvatarsShop
    if ('playerAvatarIndex' in savedState) playerAvatarIndex = savedState.playerAvatarIndex
    if ('playerCoins' in savedState) playerCoins = savedState.playerCoins
    if ('playerSaves' in savedState) playerSaves = savedState.playerSaves
    if ('playerLevel' in savedState) playerLevel = savedState.playerLevel
    if ('playerTopScore' in savedState) playerTopScore = savedState.playerTopScore
    if ('playerTarget' in savedState) playerTarget = savedState.playerTarget
    if ('playerPrevious' in savedState) {
        playerPrevious = savedState.playerPrevious
        playerScore = savedState.playerPrevious
    }
    if ('isSaveCoinsAvailable' in savedState) isSaveCoinsAvailable = savedState.isSaveCoinsAvailable
    if ('isSaveAdAvailable' in savedState) isSaveAdAvailable = savedState.isSaveAdAvailable
    if ('freeSpinTime' in savedState) freeSpinTime = savedState.freeSpinTime
    
    // После обновления пересчитываем прогресс
    playerProgress = 0
    */
}