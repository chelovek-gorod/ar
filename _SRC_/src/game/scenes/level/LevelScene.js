import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { atlases, images, music } from '../../../app/assets'
import { EventHub, events } from '../../../app/events'
import { setMusicList } from '../../../app/sound'
import { getLanguage } from '../../localization'
import { getAppScreen, getDeviceType, tickerAdd, tickerRemove } from '../../../app/application'
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

const TOUCH_RATE = 1.2

export default class LevelScene extends Container {
    constructor() {
        super()

        gameplayRunSDK()

        this.currentLanguage = getLanguage()
        EventHub.on( events.updateLanguage, this.updateLanguage, this )

        this.bg = null
        this.gameContainer = null

        this.isSceneReady = false

        // control
        this.isTouchDevice = getDeviceType() !== 'desktop'
        this.touchStartX = 0
        this.paddleStartX = 0
        this.isTouching = false
        this.lastTapTime = 0
        this.lastTapPosition = {x:0, y:0}

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
        this.bg.eventMode = 'static'
        if (this.isTouchDevice) {
            this.bg.on('pointermove', this.onPointerMoveTouch, this)
            this.bg.on('pointerdown', this.onPointerDownTouch, this)
            this.bg.on('pointerup', this.onPointerUpTouch, this)
            this.bg.on('pointerupoutside', this.onPointerUpTouch, this)
        } else {
            this.bg.on('pointermove', this.onPointerMoveMouse, this)
            this.bg.on('pointerdown', this.onPointerDownMouse, this)
        }
        this.addChildAt(this.bg, 0)

        this.screenResize( getAppScreen() )
    }

    launchScene() {
        this.isSceneReady = true
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

    // mouse
    onPointerMoveMouse({global}) {
        if (!this.isSceneReady || !this.gameContainer) return

        const point = this.gameContainer.toLocal(global)
        this.gameContainer.paddle.setPointerX(point.x)
    }
    onPointerDownMouse() {
        if (!this.isSceneReady || !this.gameContainer) return
    
        const ball = this.gameContainer.balls.children[0]
        if (ball && !ball.isFly) ball.start()
    }

    // touch
    onPointerMoveTouch({global}) {
        if (!this.isSceneReady || !this.gameContainer || !this.isTouching) return
    
        const point = this.gameContainer.toLocal(global)
        const paddle = this.gameContainer.paddle
        paddle.setPointerX(this.paddleStartX + (point.x - this.touchStartX) * TOUCH_RATE)
    }
    
    onPointerDownTouch({global}) {
        if (!this.isSceneReady || !this.gameContainer) return
    
        const point = this.gameContainer.toLocal(global)
        const now = performance.now()
        const dist = Math.hypot(point.x - this.lastTapPosition.x, point.y - this.lastTapPosition.y)

        // Проверка на двойной тап (в радиусе 24px и 300 мс)
        if (this.isTouching === false && now - this.lastTapTime < 300 && dist <= 24) {
            // Двойной тап – мгновенно перемещаем платформу, не запускаем мяч
            this.gameContainer.paddle.setPointerX(point.x)
            this.lastTapTime = 0
            this.touchStartX = point.x
            this.paddleStartX = point.x
            this.isTouching = true
            return
        }

        // Одиночный тап / начало drag'а
        this.touchStartX = point.x
        this.paddleStartX = this.gameContainer.paddle.x
        this.lastTapTime = now
        this.lastTapPosition = { x: point.x, y: point.y }
        this.isTouching = true
    }
    
    onPointerUpTouch() {
        if (!this.isTouchDevice) return
    
        // Отпускание пальца
        this.isTouching = false
    
        // Запуск мяча, если он ещё не летит
        const ball = this.gameContainer?.balls?.children[0]
        if (ball && !ball.isFly) ball.start()
    }

    tick(deltaMs) {
        //this.ballSpeedText.text = this.gameContainer.ball.speed.toFixed(2)
    }

    kill() {
        gameplayStopSDK()
        
        tickerRemove(this)

        if (this.bg) {
            if (this.isTouchDevice) {
                this.bg.off('pointermove', this.onPointerMoveTouch, this)
                this.bg.off('pointerdown', this.onPointerDownTouch, this)
                this.bg.off('pointerup', this.onPointerUpTouch, this)
                this.bg.off('pointerupoutside', this.onPointerUpTouch, this)
            } else {
                this.bg.off('pointermove', this.onPointerMoveMouse, this)
                this.bg.off('pointerdown', this.onPointerDownMouse, this)
            }
        }

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