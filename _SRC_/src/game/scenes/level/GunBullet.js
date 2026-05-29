import { Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images } from "../../../app/assets";
import { BORDER_HALF_SIZE, BRICK_H, BRICK_W } from "./constants";

const BULLET_SPEED = 0.6
const BULLET_RADIUS = 10

const COLLIDE_HALF_W = BRICK_W * 0.5 + BULLET_RADIUS
const COLLIDE_HALF_H = BRICK_H * 0.5 + BULLET_RADIUS

export default class GunBullet extends Sprite {
    constructor(x, y, angle, borderInnerWidth, bricks, addSparks) {
        super(images.bullet)

        this.anchor.set(0.5)
        this.position.set(x, y)
        this.rotation = angle
        this.dx = Math.cos(angle)
        this.dy = Math.sin(angle)
        this.minX = BORDER_HALF_SIZE * 2 + BULLET_RADIUS
        this.maxX = this.minX + borderInnerWidth - BULLET_RADIUS * 2
        this.minY = this.minX

        this.bricks = bricks
        this.addSparks = addSparks

        tickerAdd(this)
    }

    checkBrickCollision() {
        for (let i = 0; i < this.bricks.children.length; i++) {
            const brick = this.bricks.children[i]
            const dx = Math.abs(this.x - brick.x)
            const dy = Math.abs(this.y - brick.y)
            if (dx < COLLIDE_HALF_W && dy < COLLIDE_HALF_H) {
                return brick
            }
        }
        return null
    }

    tick(deltaMs) {
        this.x += this.dx * BULLET_SPEED * deltaMs
        this.y += this.dy * BULLET_SPEED * deltaMs

        // Проверка столкновения с кирпичом
        const hitBrick = this.checkBrickCollision()
        if (hitBrick) {
            hitBrick.getHit(1) // 1 урон
            this.addSparks({
                x: this.x,
                y: this.y,
                count: 5 + Math.floor(Math.random() * 3),
                isGravity: true
            })
            if (this.parent) this.parent.removeChild(this)
            tickerRemove(this)
            this.destroy()
            return
        }

        // Выход за границы поля
        if (this.x < this.minX || this.x > this.maxX || this.y < this.minY) {
            this.addSparks({
                x: this.x,
                y: this.y,
                count: 5 + Math.floor(Math.random() * 3),
                isGravity: true
            })
            if (this.parent) this.parent.removeChild(this)
            tickerRemove(this)
            this.destroy()
        }
    }
}