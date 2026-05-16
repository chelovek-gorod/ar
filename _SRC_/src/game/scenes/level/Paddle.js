import { Sprite } from "pixi.js";
import { images } from "../../../app/assets";
import { BORDER_HALF_SIZE } from "./constants";


export default class Paddle extends Sprite {
    constructor(size, x, y, borderInnerWidth) {
        super(images['paddle_' + size])
        this.anchor.set(0.5, 0.2)
        this.position.set(x, y)

        this.size = size
        this.borderInnerWidth = borderInnerWidth
        this.minX = BORDER_HALF_SIZE * 2 + this.width * 0.5
        this.maxX = this.minX + this.borderInnerWidth - this.width

        this.autoMoves = 0 // add if get negative bonus
    }

    setPointerX(x) {
        if (this.autoMoves > 0) return
        
        this.x = Math.min(this.maxX,  Math.max(x, this.minX))
    }

    get left() { return this.x - this.width * 0.5 }
    get right() { return this.x + this.width * 0.5 }
    get top() { return this.y - 24 }
}