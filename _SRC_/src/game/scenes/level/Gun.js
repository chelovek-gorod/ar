import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images } from "../../../app/assets";

const SHUTS = 12
const SCALE_SPEED = 0.012
const RELOAD_TIME = 240
const TURN_SPEED = 0.0006
const START_ANGLE = -Math.PI * 0.5

export default class Gun extends Sprite {
    constructor(x, y, shuts, isLeft, shutCallback, bricks) {
        super(images.gun)

        this.anchor.set(0.5)
        this.rotation = START_ANGLE
        this.position.set(x, y)
        this.scale.set(shuts > 0 ? 1 : 0)
        this.shuts = SHUTS * shuts
        this.reloadTimeout = RELOAD_TIME
        this.shutCallback = shutCallback

        const targetAngle = isLeft ? Math.PI * -0.25 : Math.PI * -0.75
        this.minAngle = Math.min(START_ANGLE, targetAngle)
        this.maxAngle = Math.max(START_ANGLE, targetAngle)
        this.swingDir = targetAngle > START_ANGLE ? 1 : -1

        this.bricks = bricks

        if (shuts > 0) tickerAdd(this)
    }

    addShuts() {
        this.shuts += SHUTS
        tickerAdd(this)
    }

    shut() {
        this.reloadTimeout += RELOAD_TIME
        this.shuts--
        this.shutCallback(this.x, this.y, this.rotation, this.bricks)
    }

    tick(deltaMs) {
        if (this.shuts > 0) {
            if (this.scale.x === 1) {
                // перезарядка и стрельба
                this.reloadTimeout -= deltaMs
                if (this.reloadTimeout <= 0) this.shut()

                // качание
                this.rotation += this.swingDir * TURN_SPEED * deltaMs
                if (this.swingDir > 0 && this.rotation >= this.maxAngle) {
                    this.rotation = this.maxAngle
                    this.swingDir = -1
                } else if (this.swingDir < 0 && this.rotation <= this.minAngle) {
                    this.rotation = this.minAngle
                    this.swingDir = 1
                }
            } else {
                // увеличиваемся до полного размера
                this.scale.set(Math.min(1, this.scale.x + SCALE_SPEED * deltaMs))
            }
        } else {
            if (this.rotation === START_ANGLE) {
                // уменьшаемся и удаляемся
                this.scale.set(Math.max(0, this.scale.x - SCALE_SPEED * deltaMs))
                if (this.scale.x === 0) tickerRemove(this)
            } else {
                // плавный возврат к начальному углу
                const diff = START_ANGLE - this.rotation
                const step = TURN_SPEED * deltaMs
                if (Math.abs(diff) <= step) {
                    this.rotation = START_ANGLE
                } else {
                    this.rotation += Math.sign(diff) * step
                }
            }
        }
    }
}