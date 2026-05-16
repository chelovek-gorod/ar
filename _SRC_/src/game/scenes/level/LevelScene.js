import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { atlases, images, music } from '../../../app/assets'
import { EventHub, events, pauseGameplay } from '../../../app/events'
import { setMusicList } from '../../../app/sound'
import { getLanguage } from '../../localization'
import { getAppScreen, tickerAdd, tickerRemove } from '../../../app/application'
import Popup, { POPUP_TYPE } from '../../popup/Popup'
import { gameplayRunSDK, gameplayStopSDK } from '../../storage'
import BackgroundImage from '../../BG/BackgroundImage'
import GameContainer from './GameContainer'
import { BORDER_HALF_SIZE } from './constants'
import { getLevelData } from '../../state'
import { styles } from '../../../app/styles'

const musics = [ music.bgm_1, music.bgm_2, music.bgm_3, music.bgm_4 ]
let currentMusicIndex = Math.floor( Math.random() * musics.length )
function getMusic() {
    const music = musics[currentMusicIndex]
    currentMusicIndex++
    if (currentMusicIndex === musics.length) currentMusicIndex = 0
    return music
}

export default class LevelScene extends Container {
    constructor() {
        super()

        gameplayRunSDK()

        this.currentLanguage = getLanguage()
        EventHub.on( events.updateLanguage, this.updateLanguage, this )

        this.bg = null
        this.gameContainer = null

        getLevelData( this.setLevelData.bind(this) )

        this.ballSpeedText = new Text({text: 1, style: styles.loading})
        this.addChildAt(this.ballSpeedText)

        /*
        this.tapArea = new Graphics()
        this.tapArea.alpha = 0.0003
        this.tapArea.eventMode = 'static'
        this.tapArea.cursor = 'pointer'
        this.tapArea.on('pointerdown', this.getFlyClick, this)
        this.addChild(this.tapArea)

        this.tapAreaColor = 0x000000
        this.redSpeed = 0.006
        this.redIsUp = true
        this.tapAreaDrawData = {x: 0, y: 0, w: 0, h: 0}
        */

        /*
        this.popup = new Popup()
        this.addChild(this.popup)
        */

        EventHub.on( events.pauseGameplay, this.pauseGameplay, this )

        /*
        if ( getDeviceType().indexOf('desktop') > -1 ) {
            this.isPausePressed = false
            this.handlerKeyboard = (e) => {
                if (e.code === 'Escape' && !this.isPausePressed) {
                    this.isPausePressed = true
                    pauseGameplay()
                }
                if (e.code === 'Space') this.getFlyClick()
            }
            document.addEventListener('keydown', this.handlerKeyboard)

            EventHub.on( events.resumeGameplay, this.resumeGameplay, this )
        }
        */
        
        setMusicList( getMusic() )

        tickerAdd(this)
    }

    setLevelData(levelData) {
        this.gameContainer = new GameContainer(levelData.map_lines)
        this.addChildAt(this.gameContainer, 0)

        this.bg = new BackgroundImage(images["bg_" + levelData.bg_index], null, false)
        this.addChildAt(this.bg, 0)

        this.screenResize( getAppScreen() )
    }

    screenResize(screenData) {
        // set scene container in center of screen
        this.position.set( screenData.centerX, screenData.centerY )
        this.ballSpeedText.position.set(-screenData.centerX + 15, -screenData.centerY + 15)

        if (this.bg) this.bg.screenResize(screenData)

        // transform game container
        if (this.gameContainer) {
            this.gameContainer.scale.set(1) // reset scale to initial scale
            const gc_w = this.gameContainer.width + BORDER_HALF_SIZE * 2
            const gc_h = this.gameContainer.height + BORDER_HALF_SIZE * 2
            const gc_scale_x = screenData.width / gc_w
            const gc_scale_y = screenData.height / gc_h
            const gc_scale = Math.min(1, gc_scale_x, gc_scale_y)
            this.gameContainer.scale.set(gc_scale) // apply new scale
            this.gameContainer.position.set(
                -this.gameContainer.width * 0.5,
                -this.gameContainer.height * 0.5
            )
        }
        

        //this.popup.screenResize(screenData)
    }

    pauseGameplay() {
        //this.popup.show( POPUP_TYPE.PAUSE )
    }
    resumeGameplay() {
        if (this?.isPausePressed) this.isPausePressed = false
    }


    updateLanguage(lang) {
        this.currentLanguage = lang
    }

    tick(deltaMs) {
        this.ballSpeedText.text = this.gameContainer.ball.speed.toFixed(2)
    }

    kill() {
        gameplayStopSDK()
        
        tickerRemove(this)

        if (this.handlerKeyboard) {
            EventHub.off( events.resumeGameplay, this.resumeGameplay, this )
            document.removeEventListener('keydown', this.handlerKeyboard)
            this.handlerKeyboard = null
        }

        EventHub.off( events.updateLanguage, this.updateLanguage, this )
        EventHub.off( events.pauseGameplay, this.pauseGameplay, this )
        //this.tapArea.off('pointerdown', this.getFlyClick, this)
    }
}