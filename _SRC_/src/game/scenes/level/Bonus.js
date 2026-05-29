import { Sprite } from "pixi.js";
import { kill, tickerAdd, tickerRemove } from "../../../app/application";
import { atlases } from "../../../app/assets";
import { collectBonus } from "../../../app/events";
import { createEnum } from "../../../utils/functions";

export const BONUS_RADIUS = 60
const BONUS_HALF_RADIUS = BONUS_RADIUS * 0.5
export const BONUS_TYPE = createEnum([
    'ADD_COIN',

    'ADD_BALL',
    'ADD_BALLS',
    'ADD_GUNS',
    'ADD_POWER',
    'ADD_SIZE',
    'ADD_TIME',
    'ADD_WALL',
    'LOSE_CONTROL',
    'LOSE_SIZE',
    'LOSE_TIME',
])
export const BONUS_COLORS = {
    [BONUS_TYPE.ADD_BALLS] : 0x0000ff, // blue
    [BONUS_TYPE.ADD_GUNS] : 0xff0000, // red
    [BONUS_TYPE.ADD_POWER] : 0xffff00, // yellow
    [BONUS_TYPE.ADD_SIZE] : 0x00ff00, // lime
    [BONUS_TYPE.ADD_TIME] : 0x00ffff, // aqua
    [BONUS_TYPE.ADD_WALL] : 0xffffff // white
}
const GRAVITY_MIN = 0.0006
const GRAVITY_MAX = 0.0009
const GRAVITY_MID = GRAVITY_MAX - GRAVITY_MIN
const OSC_PERIOD_MS = 2400
const OSC_ANGULAR_SPEED = (2 * Math.PI) / OSC_PERIOD_MS; // рад/мс

export default class Bonus extends Sprite {
    constructor(type, x, y, maxY, paddle) {
        super( atlases.bonuses.textures['bonus_' + type.toLowerCase()] )
        this.anchor.set(0.5)
        this.position.set(x, y)
        this.speed = -0.36
        this.paddle = paddle
        this.maxY = maxY
        this.gravity = GRAVITY_MIN + Math.random() * GRAVITY_MID
        this.type = type
        this.oscTime = 0
        this.offsetX = type.indexOf('ADD') >= -1 ? BONUS_RADIUS : 0
        if (type.indexOf('COIN') >= -1) this.offsetX *= 0.5
        tickerAdd(this)
    }

    tick(deltaMs) {
        this.y += this.speed * deltaMs
        this.speed += this.gravity * deltaMs

        this.oscTime += deltaMs
        const phase = (this.oscTime % OSC_PERIOD_MS) * OSC_ANGULAR_SPEED
        this.scale.x = Math.abs(Math.cos(phase))

        if (this.y > this.maxY) {
            this.alpha -= 0.006 * deltaMs
            if (this.alpha < 0) kill(this)
            return
        }

        if (this.y + BONUS_HALF_RADIUS > this.paddle.top) {
            if (this.x + this.offsetX > this.paddle.left && this.x - this.offsetX < this.paddle.right) {
                collectBonus({type: this.type, x: this.x, y: this.y})
                tickerRemove(this)
                kill(this)
            }
        }
    }
}