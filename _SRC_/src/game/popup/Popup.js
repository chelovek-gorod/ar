import { Container, Sprite, Text } from "pixi.js"
import { EventHub, events, freeSpinPopupClosed, resumeGameplay } from "../../app/events"
import Button from "../UI/Button"
import TapIcon from "../UI/TapIcon"
import { getAvailableLanguages, getLanguage, getLanguageName, setLanguage } from "../localization"
import { atlases } from "../../app/assets"
import { styles } from "../../app/styles"
import { getAppScreen, kill, tickerAdd, tickerRemove } from "../../app/application"
import { musicGetState, musicGetVolume, musicOff, musicOn, musicSetVolume,
    soundGetState, soundGetVolume, soundOff, soundOn, soundSetVolume } from "../../app/sound"
import { createEnum } from "../../utils/functions"
import Overlay from "./Overlay"
import { BUTTON_TYPE, TEXT_FREE_WHEEL_SUBTITLE, TEXT_FREE_WHEEL_TITLE, TEXT_MUSIC, TEXT_POPUP_TITLE, TEXT_SOUND } from "../localText"

export const POPUP_TYPE =  createEnum([
    'PAUSE', 'SETTINGS', 'RESULTS', 'FREE_SPIN', 'ERROR'
])

const BG_SIDE_SIZE = 780
const BG_SIDE_OFFSET = 20
const BG_SIZE = BG_SIDE_SIZE + BG_SIDE_OFFSET * 2

function findSoundMusic(isMusic = true) {
    const isOn = isMusic ? musicGetState() : soundGetState()
    if (!isOn) return 0

    const volume = isMusic ? musicGetVolume() : soundGetVolume()
    if (volume > 0.7 ) return 3
    if (volume > 0.4 ) return 2
    return 1
}

const dataQueue = []

const POPUP_STATE = createEnum(['CLOSED', 'OPEN_UP', 'OPEN_DOWN', 'ACTIVE', 'CLOSE_UP', 'CLOSE_DOWN'])
const SCALE_TIME = 360
const SCALE_RATE = 1.2

export default class Popup extends Container {
    constructor() {
        super()

        dataQueue.length = 0

        this.type = null

        this.state = POPUP_STATE.CLOSED
        this.normalSCale = 1
        this.scaleMax = SCALE_RATE
        this.scaleSpeed = 0
        this.scaleSpeedMax = 1
        this.scaleAcceleration = 1.1

        this.isResult = false
        this.isResultDone = false

        this.currentLanguage = getLanguage()

        this.visible = false

        this.shell = new Overlay()
        this.addChild(this.shell)
        
        this.box = new Container()
        this.box.scale.set(0)
        this.addChild(this.box)

        this.bg = new Sprite( atlases.ui.textures.popup )
        this.bg.anchor.set(0.5)
        this.box.addChild(this.bg)

        this.content = new Container()
        this.box.addChild(this.content)

        this.title = new Text({text: '', style: styles.popupTitle})
        this.title.anchor.set(0.5)
        this.title.position.set(0, -260)
        this.box.addChild(this.title)
        
        this.closeButton = new Button(null, BUTTON_TYPE.BACK, () => this.close())
        this.closeButton.position.set(0, 265)
        this.closeButton.scale.set(0.75)
        this.box.addChild(this.closeButton)

        this.settingsUI = null

        this.showAdButton = null

        EventHub.on(events.showPopup, this.show, this)
        EventHub.on(events.startScene, this.kill, this)

        this.screenResize( getAppScreen() )
    }

    screenResize(screenData) {
        this.shell.screenResize(screenData)

        const screenSize = screenData.isLandscape ? screenData.height : screenData.width
        this.scaleNormal = Math.min(1, screenSize / BG_SIZE)
        this.scaleMax = this.scaleNormal * SCALE_RATE
        const fullScale = (this.scaleMax - this.scaleNormal) * 2 + this.scaleNormal
        this.scaleSpeedMax = (fullScale * 2) / SCALE_TIME
        this.scaleAcceleration = (fullScale * 2) / (SCALE_TIME * SCALE_TIME)

        if (this.visible) this.box.scale.set(this.scaleNormal)
    }

    show(type) { 
        if (this.visible) return dataQueue.push(data)

        this.type = type
        if (type === POPUP_TYPE.PAUSE || type === POPUP_TYPE.SETTINGS) this.fillSettings()
        if (type === POPUP_TYPE.FREE_SPIN) this.fillFreeSpin()

        this.visible = true
        this.shell.show()

        this.state = POPUP_STATE.OPEN_UP
        this.scaleSpeed = this.scaleSpeedMax
        tickerAdd(this)
    }

    close() {
        if (this.state !== POPUP_STATE.ACTIVE) return

        this.shell.hide()
        this.state = POPUP_STATE.CLOSE_UP
        this.scaleSpeed = 0
        tickerAdd(this)
    }

    clear() {
        this.closeButton.onOut()

        while (this.content.children.length) {
            const obj = this.content.children[0]
            this.content.removeChild( obj )
            kill( obj )
        }

        if (this.settingsUI) this.settingsUI = null

        if (this.showAdButton) this.showAdButton = null

        if (this.type === POPUP_TYPE.PAUSE) resumeGameplay()
        if (this.type === POPUP_TYPE.FREE_SPIN) freeSpinPopupClosed()

        this.visible = false
        this.state = POPUP_STATE.CLOSED
        if ( dataQueue.length ) this.show( dataQueue.shift() )
    }

    fillFreeSpin() {
        this.title.text = TEXT_FREE_WHEEL_TITLE[this.currentLanguage]

        const description = TEXT_FREE_WHEEL_SUBTITLE[this.currentLanguage]
        const descriptionText = new Text({text: description, style: styles.popupDescription})
        descriptionText.anchor.set(0.5, 0)
        descriptionText.position.set(0, 130)
        this.content.addChild(descriptionText)

        const image = new Sprite(atlases.ui.textures.free_spin)
        image.anchor.set(0.5)
        image.position.set(0, -30)
        this.content.addChild(image)

        this.closeButton.setTextKey( BUTTON_TYPE.SPIN )
    }

    fillSettings() {
        this.title.text = TEXT_POPUP_TITLE[this.type][this.currentLanguage]

        this.settingsUI = {}
        // music
        const musicLabelText = TEXT_MUSIC[this.currentLanguage]
        this.settingsUI.musicLabel = new Text({text: musicLabelText, style: styles.popupLabel})
        this.settingsUI.musicLabel.anchor.set(0.5)
        this.settingsUI.musicLabel.position.set(-200, -160)
        this.content.addChild( this.settingsUI.musicLabel )

        const musicTexture = atlases.ui.textures[ 'music_' + findSoundMusic(true) ]
        this.settingsUI.musicBtn = new TapIcon( musicTexture, this.changeMusic.bind(this) )
        this.settingsUI.musicBtn.anchor.set(0.5)
        this.settingsUI.musicBtn.position.set(-200, -70)
        this.content.addChild( this.settingsUI.musicBtn )

        // sound
        const soundLabelText = TEXT_SOUND[this.currentLanguage]
        this.settingsUI.soundLabel = new Text({text: soundLabelText, style: styles.popupLabel})
        this.settingsUI.soundLabel.anchor.set(0.5)
        this.settingsUI.soundLabel.position.set(200, -160)
        this.content.addChild( this.settingsUI.soundLabel )

        const soundTexture = atlases.ui.textures[ 'sound_' + findSoundMusic(false) ]
        this.settingsUI.soundBtn = new TapIcon( soundTexture, this.changeSound.bind(this) )
        this.settingsUI.soundBtn.anchor.set(0.5)
        this.settingsUI.soundBtn.position.set(200, -70)
        this.content.addChild( this.settingsUI.soundBtn )

        // language
        this.settingsUI.langСodes = getAvailableLanguages().map(item => item.code)
        this.settingsUI.langIndex = this.settingsUI.langСodes.indexOf(this.currentLanguage)

        this.settingsUI.langLabel = new Text({text: getLanguageName(), style: styles.popupLabel})
        this.settingsUI.langLabel.anchor.set(0.5)
        this.settingsUI.langLabel.position.set(0, 10)
        this.content.addChild( this.settingsUI.langLabel )

        this.settingsUI.leftBtn = new TapIcon(atlases.ui.textures.left, this.prevLang.bind(this))  
        this.settingsUI.leftBtn.anchor.set(0.5)
        this.settingsUI.leftBtn.position.set(-120, 90)
        this.content.addChild( this.settingsUI.leftBtn )

        const langCodeText = this.currentLanguage.toUpperCase()
        this.settingsUI.langCode = new Text({text: langCodeText, style: styles.popupTitle})
        this.settingsUI.langCode.anchor.set(0.5)
        this.settingsUI.langCode.position.set(0, 90)
        this.content.addChild( this.settingsUI.langCode )

        this.settingsUI.rightBtn = new TapIcon( atlases.ui.textures.right, this.nextLang.bind(this))
        this.settingsUI.rightBtn.anchor.set(0.5)
        this.settingsUI.rightBtn.position.set(120, 90)
        this.content.addChild( this.settingsUI.rightBtn )

        this.closeButton.setTextKey( BUTTON_TYPE.BACK )
    }

    changeMusic() {
        const volume = musicGetVolume()
        let iconIndex = 0
        if (volume > 0.7) {
            musicSetVolume(0)
            musicOff()
        } else if (volume > 0.4) {
            musicSetVolume(1)
            iconIndex = 3
        } else if (volume > 0.1) {
            musicSetVolume(0.5)
            iconIndex = 2
        } else {
            musicSetVolume(0.25)
            musicOn()
            iconIndex = 1
        }
        const musicTexture = atlases.ui.textures[ 'music_' + iconIndex ]
        this.settingsUI.musicBtn.setIcon( musicTexture )
    }

    changeSound() {
        const volume = soundGetVolume()
        let iconIndex = 0
        if (volume > 0.7) {
            soundSetVolume(0)
            soundOff()
        } else if (volume > 0.4) {
            soundSetVolume(1)
            iconIndex = 3
        } else if (volume > 0.1) {
            soundSetVolume(0.5)
            iconIndex = 2
        } else {
            soundSetVolume(0.25)
            soundOn()
            iconIndex = 1
        }
        const soundTexture = atlases.ui.textures[ 'sound_' + iconIndex ]
        this.settingsUI.soundBtn.setIcon( soundTexture )
    }

    prevLang() {
        this.settingsUI.langIndex--
        if (this.settingsUI.langIndex < 0) {
            this.settingsUI.langIndex = this.settingsUI.langСodes.length - 1
        }
        this.currentLanguage = this.settingsUI.langСodes[this.settingsUI.langIndex]
        setLanguage(this.currentLanguage)

        this.updateSettingsLabels()
    }

    nextLang() {
        this.settingsUI.langIndex++
        if (this.settingsUI.langIndex === this.settingsUI.langСodes.length) {
            this.settingsUI.langIndex = 0
        }
        this.currentLanguage = this.settingsUI.langСodes[this.settingsUI.langIndex]
        setLanguage(this.currentLanguage)

        this.updateSettingsLabels()
    }

    updateSettingsLabels() {
        this.title.text = TEXT_POPUP_TITLE[this.type][this.currentLanguage]

        const musicLabelText = TEXT_MUSIC[this.currentLanguage]
        this.settingsUI.musicLabel.text = musicLabelText

        const soundLabelText = TEXT_SOUND[this.currentLanguage]
        this.settingsUI.soundLabel.text = soundLabelText

        this.settingsUI.langLabel.text = getLanguageName()
        this.settingsUI.langCode.text = this.currentLanguage.toUpperCase()
    }

    tick(deltaMs) {
        const scaleStep = this.scaleSpeed * deltaMs
        const acceleration = this.scaleAcceleration * deltaMs
        this.scaleSpeed += (this.state.indexOf('OPEN') > -1) ? -acceleration : acceleration

        if (this.state === POPUP_STATE.OPEN_UP || this.state === POPUP_STATE.CLOSE_UP) {
            this.box.scale.set( Math.min(this.scaleMax, this.box.scale.x + scaleStep) )
            if (this.box.scale.x !== this.scaleMax) return
            this.state = (this.state === POPUP_STATE.OPEN_UP)
                ? POPUP_STATE.OPEN_DOWN
                : POPUP_STATE.CLOSE_DOWN
        }

        if (this.state === POPUP_STATE.OPEN_DOWN) {
            this.box.scale.set( Math.max(this.scaleNormal, this.box.scale.x - scaleStep) )
            if (this.box.scale.x === this.scaleNormal) {
                tickerRemove(this)
                this.state = POPUP_STATE.ACTIVE
            }
        }
        
        if (this.state === POPUP_STATE.CLOSE_DOWN) {
            this.box.scale.set( Math.max(0, this.box.scale.x - scaleStep) )
            if (this.box.scale.x === 0) {
                tickerRemove(this)
                this.clear()
            }
        }
    }

    kill() {
        if (this.sparks) this.sparks.kill()
        EventHub.off(events.startScene, this.kill, this)
        EventHub.off(events.showPopup, this.show, this)
    }
}