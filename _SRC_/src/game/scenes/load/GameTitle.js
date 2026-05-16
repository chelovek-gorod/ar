import { Container, Sprite, Text, Texture } from "pixi.js";
import { tickerAdd } from "../../../app/application";
import { styles } from "../../../app/styles";
import { textToTexture } from "../../../utils/textureGenerator";
import { getLanguage } from "../../localization";

// Создаем золотую текстуру
function createGoldTexture(width, height) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, '#BF953F')
    gradient.addColorStop(0.25, '#FCF6BA')
    gradient.addColorStop(0.5, '#B38728')
    gradient.addColorStop(0.75, '#FBF5B7')
    gradient.addColorStop(1, '#AA771C')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    return Texture.from(canvas)
}

export default class GameTitle extends Container {
    constructor() {
        super()

        this.currentLanguage = getLanguage()
        const isLangRu = this.currentLanguage === 'ru'
        const title = isLangRu ? 'ФОРТУНА' : 'FORTUNE'
        const subtitle = isLangRu ? 'Симулятор' : 'The Simulator'

        this.maskText = new Sprite(textToTexture( new Text({ text: title, style: styles.gameTitle }) ))
        this.maskText.anchor.set(0.5)

        this.goldEndX = this.maskText.width * 0.5
        this.goldStartX = -this.goldEndX
        
        this.goldSprite = new Sprite(createGoldTexture(this.maskText.width * 2, this.maskText.height))
        this.goldSprite.anchor.set(0.5)
        this.goldSprite.position.set(this.goldStartX, 0)
        
        this.goldSprite.mask = this.maskText

        this.subtitle = new Text({ text: subtitle, style: styles.gameSubtitle })
        this.subtitle.anchor.set(0.5)
        this.subtitle.position.set(0, 60)

        this.addChild(this.goldSprite)
        this.addChild(this.maskText)
        this.addChild(this.subtitle)

        tickerAdd(this)
    }

    tick(time) {
        this.goldSprite.position.x += time.deltaMS * 0.6
        if (this.goldSprite.position.x > this.goldEndX) {
            this.goldSprite.position.x -= this.maskText.width
        }
    }
}