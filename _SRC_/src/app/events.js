import { EventEmitter } from "pixi.js"
import { createEnum } from "../utils/functions"

export const EventHub = new EventEmitter()

export const events = createEnum([
    'screenResize',
    'changeFocus',

    'gamePause',
    'gameResume',

    'startScene',

    'updateLanguage',

    'shakeScreen',
    'addSmoke',
    'addExplosion',
    'addSparks',
    'addStones',

    'addScore',
    'resetCombo',
    'slowDown',
    'removePlyerSave',
    'getNextLevel',

    'pauseGameplay',
    'resumeGameplay',

    'launchFirework',

    'updateTopResults',
    'getTopResults',
    'freeSpinPopupClosed',
])

export function screenResize( data ) {
    EventHub.emit( events.screenResize, data )
}
export function changeFocus( isOnFocus ) {
    EventHub.emit( events.changeFocus, isOnFocus )
}
export function gamePause() {
    EventHub.emit( events.gamePause )
}
export function gameResume() {
    EventHub.emit( events.gameResume )
}

export function startScene( sceneName ) {
    EventHub.emit( events.startScene, sceneName )
}

export function updateLanguage( currentLanguageCode ) {
    EventHub.emit( events.updateLanguage, currentLanguageCode )
}

export function shakeScreen( data ) {
    EventHub.emit( events.shakeScreen, data )
}

export function addSmoke( data ) {
    EventHub.emit( events.addSmoke, data )
}
export function addExplosion( data ) {
    EventHub.emit( events.addExplosion, data )
}
export function addSparks(data) {
    EventHub.emit( events.addSparks, data )
}
export function addStones( data ) {
    EventHub.emit( events.addStones, data )
}

export function addScore( data ) {
    EventHub.emit( events.addScore, data )
}
export function resetCombo() {
    EventHub.emit( events.resetCombo )
}
export function slowDown() {
    EventHub.emit( events.slowDown )
}
export function removePlyerSave() {
    EventHub.emit( events.removePlyerSave )
}
export function getNextLevel() {
    EventHub.emit( events.getNextLevel )
}

export function pauseGameplay() {
    EventHub.emit( events.pauseGameplay )
}
export function resumeGameplay() {
    EventHub.emit( events.resumeGameplay )
}

export function updateTopResults() {
    EventHub.emit( events.updateTopResults )
}
export function getTopResults(data) {
    EventHub.emit( events.getTopResults, data )
}

export function launchFirework(point) {
    EventHub.emit( events.launchFirework, point )
}

export function freeSpinPopupClosed() {
    EventHub.emit( events.freeSpinPopupClosed )
}