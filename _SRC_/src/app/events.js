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

    'getTopResults',

    'dropLoseBonus',
    'collectBonus',
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

export function getTopResults( ) {
    EventHub.emit( events.getTopResults )
}


export function updateLanguage( currentLanguageCode ) {
    EventHub.emit( events.updateLanguage, currentLanguageCode )
}

export function dropLoseBonus( data ) {
    EventHub.emit( events.dropLoseBonus, data )
}
export function collectBonus( data ) {
    EventHub.emit( events.collectBonus, data )
}