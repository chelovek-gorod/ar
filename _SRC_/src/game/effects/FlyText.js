import { Text } from "pixi.js";
import { kill, tickerAdd } from "../../app/application";
import { styles } from "../../app/styles";

export default class FlyText extends Text {
    constructor(text, x, y, isScore = true) {
        super({text: text, style: isScore ? styles.flyText : styles.flyMessage}) 
        this.anchor.set(0.5)

        this.position.set(x,y)

        this.lifeTime = isScore ? 300 : 600
        this.alphaStep = isScore ? 0.0012 : 0.0006
        this.flySpeed = isScore ? 0.24 : 0.12

        tickerAdd(this)
    }

    tick(deltaMs) {
        this.y -= this.flySpeed * deltaMs

        if (this.lifeTime > 0) {
            this.lifeTime -= deltaMs
        } else {
            this.alpha -= this.alphaStep * deltaMs
            if (this.alpha <= 0) kill(this)
        }
    }
}