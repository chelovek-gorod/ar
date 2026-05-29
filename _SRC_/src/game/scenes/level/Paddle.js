import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images } from "../../../app/assets";
import { BORDER_HALF_SIZE } from "./constants";

const LOSE_CONTROL_TIMEOUT = 6000
const LOSE_CONTROL_SPEED = 0.36

export default class Paddle extends Sprite {
    constructor(size, x, y, borderInnerWidth) {
        super(images['paddle_' + size])
        this.anchor.set(0.5, 0.2)
        this.position.set(x, y)

        this.size = size
        this.borderInnerWidth = borderInnerWidth
        this.minX = BORDER_HALF_SIZE * 2 + this.width * 0.5
        this.maxX = this.minX + this.borderInnerWidth - this.width

        // add if get negative bonus
        this.isAutoMove = false 
        this.autoMoveTimeout = 0 
        this.isAutoMoveLeft = false 
    }

    changeSize(step) {
        this.size = Math.max(1, Math.min(5, this.size + step))
        this.texture = images['paddle_' + this.size]

        this.minX = BORDER_HALF_SIZE * 2 + this.width * 0.5
        this.maxX = this.minX + this.borderInnerWidth - this.width

        this.x = Math.min(this.maxX,  Math.max(this.x, this.minX))
    }

    setPointerX(x) {
        if (this.isAutoMove) return
        
        this.x = Math.min(this.maxX,  Math.max(x, this.minX))
    }

    setLoseControl() {
        this.tint = 0xff0000
        this.isAutoMove = true 
        this.autoMoveTimeout += LOSE_CONTROL_TIMEOUT
        this.isAutoMoveLeft = Math.random() < 0.5
        tickerAdd(this)
    }

    get left() { return this.x - this.width * 0.5 }
    get right() { return this.x + this.width * 0.5 }
    get top() { return this.y - 24 }

    tick(deltaMs) {
        this.autoMoveTimeout -= deltaMs
        if (this.autoMoveTimeout <= 0) {
            this.tint = null
            this.isAutoMove = false
            this.autoMoveTimeout = 0
            tickerRemove(this)
            return
        }

        const path = deltaMs * LOSE_CONTROL_SPEED
        const newX = this.isAutoMoveLeft ? this.x - path : this.x + path
        this.x = Math.min(this.maxX,  Math.max(newX, this.minX))
        if (this.x === this.minX) this.isAutoMoveLeft = false
        else if (this.x === this.maxX) this.isAutoMoveLeft = true
    }
}