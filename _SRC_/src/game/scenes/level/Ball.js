import { Container, Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images } from "../../../app/assets";
import { getLinesIntersectionPoint, moveSprite } from "../../../utils/functions";
import { BALL_RADIUS, BORDER_HALF_SIZE } from "./constants";

const START_SPEED = 0.36
const ACC_RATE = 1.0036
const SPEED_COLOR_DATA = {
    0.36: 0x00ff00,
    0.42: 0x11ff00,
    0.48: 0x22ff00,
    0.54: 0x33ff00,
    0.60: 0x44ff00,
    0.66: 0x55ff00,
    0.72: 0x66ff00,
    0.78: 0x77ff00,
    0.84: 0x88ff00,
    0.90: 0x99ff00,
    0.96: 0xaaff00,
    1.02: 0xbbff00,
    1.08: 0xccff00,
    1.14: 0xddff00,
    1.20: 0xeeff00,
    1.26: 0xffff00,
    1.32: 0xffee00,
    1.38: 0xffdd00,
    1.44: 0xffcc00,
    1.50: 0xffbb00,
    1.56: 0xffaa00,
    1.62: 0xff9900,
    1.68: 0xff8800,
    1.74: 0xff7700,
    1.80: 0xff6600,
    1.86: 0xff5500,
    1.92: 0xff4400,
    1.98: 0xff3300,
    2.04: 0xff2200,
    2.10: 0xff1100,
    2.16: 0xff0000,
}

export default class Ball extends Container {
    constructor(x, y, borderInnerWidth, bricks, paddle, emitTrail, onBottomCollide, isBottomOn, power = 1) {
        super()

        this.power = power

        this.bricks = bricks
        this.paddle = paddle
        this.onBottomCollide = onBottomCollide

        this.emitTrail = emitTrail
        this.trailSize = 1

        this.body = new Sprite(images.ball_body)
        this.body.anchor.set(0.5)
        this.addChild(this.body)

        this.shine = new Sprite(images.ball_shine)
        this.shine.anchor.set(0.5)
        this.shine.tint = 0x00ff00 // 0xff0000
        this.addChild(this.shine)

        this.lines = new Sprite(images.ball_lines)
        this.lines.anchor.set(0.5)
        this.lines.tint = 0xffff00
        this.addChild(this.lines)

        this.position.set(x, y)

        this.borderInnerWidth = borderInnerWidth
        this.minX = BORDER_HALF_SIZE * 2 + BALL_RADIUS
        this.maxX = this.minX + this.borderInnerWidth - BALL_RADIUS * 2
        this.minY = this.minX
        this.maxY = this.maxX + BORDER_HALF_SIZE * 2
        this.initialMaxY = this.maxY
        this.isBottomBorder = isBottomOn
        if (this.isBottomBorder) this.maxY -= BORDER_HALF_SIZE * 2

        this.collideX = 0
        this.collideY = 0
        this.collideDistance = Infinity
        this.collideOffsetX = 0
        this.collideOffsetY = 0
        this.collideBrickIndex = -1
        this.platformOffset = 0

        this.direction = Math.PI * 0.5// Math.random() * Math.PI * 2
        this.dx = Math.cos(this.direction)
        this.dy = Math.sin(this.direction)

        this.speed = START_SPEED

        tickerAdd(this)
    }

    addSpeed() {
        this.speed *= ACC_RATE
        this.trailSize = Math.round((this.speed - 0.3) * 24)
        
        const speeds = Object.keys(SPEED_COLOR_DATA).map(Number)
        let closestSpeed = speeds[0]
        for (const s of speeds) {
            if (Math.abs(s - this.speed) < Math.abs(closestSpeed - this.speed)) {
                closestSpeed = s
            }
        }
        this.shine.tint = SPEED_COLOR_DATA[closestSpeed]
        
    }

    setBottomBorder(isActive = false) {
        this.maxY = isActive ? this.initialMaxY - BORDER_HALF_SIZE * 2 : this.initialMaxY
        this.isBottomBorder = isActive
    }

    resetCollideData() {
        this.collideX = 0
        this.collideY = 0
        this.collideDistance = Infinity
        this.collideOffsetX = 0
        this.collideOffsetY = 0
        this.collideBrickIndex = -1
        this.platformOffset = 0
    }

    setCollideData(intersectPoint, offsetX, offsetY, brickIndex) {
        const dx = this.x - intersectPoint.x
        const dy = this.y - intersectPoint.y
        const sd = Math.abs(dx * dx + dy * dy)
        if (sd < this.collideDistance) {
            this.collideDistance = sd
            this.collideX = intersectPoint.x
            this.collideY = intersectPoint.y
            this.collideOffsetX = offsetX
            this.collideOffsetY = offsetY
            this.collideBrickIndex = brickIndex
        }
    }

    checkCollision(destinationX, destinationY) {
        this.resetCollideData()
    
        if (this.dx > 0) {
            const p = getLinesIntersectionPoint(
                this.x, this.y, destinationX, destinationY,
                this.maxX, this.minY, this.maxX, this.maxY
            )
            if (p) this.setCollideData(p, -1, 0, -1)
        } else {
            const p = getLinesIntersectionPoint(
                this.x, this.y, destinationX, destinationY,
                this.minX, this.minY, this.minX, this.maxY
            )
            if (p) this.setCollideData(p, 1, 0, -1)
        }
    
        if (this.dy > 0) {
            const p = getLinesIntersectionPoint(
                this.x, this.y, destinationX, destinationY,
                this.minX, this.maxY, this.maxX, this.maxY
            )
            if (p) this.setCollideData(p, 0, -1, -1)
        } else {
            const p = getLinesIntersectionPoint(
                this.x, this.y, destinationX, destinationY,
                this.minX, this.minY, this.maxX, this.minY
            )
            if (p) this.setCollideData(p, 0, 1, -1)
        }

        // проверка верха платформы (раньше нижней стены)
        if (this.dy > 0) {
            const p = getLinesIntersectionPoint(
                this.x, this.y, destinationX, destinationY,
                this.paddle.left, this.paddle.top, this.paddle.right, this.paddle.top
            )
            if (p) {
                this.setCollideData(p, 0, -1, -2)
                this.platformOffset = this.x - this.paddle.x
            }
        }

        // левый или правый бок платформы
        if (this.dx > 0) {
            const p = getLinesIntersectionPoint(
                this.x, this.y, destinationX, destinationY,
                this.paddle.left, this.paddle.top,
                this.paddle.left, this.paddle.y + this.paddle.height * 0.8
            )
            if (p) this.setCollideData(p, -1, 0, -3)
        } else if (this.dx < 0) {
            const p = getLinesIntersectionPoint(
                this.x, this.y, destinationX, destinationY,
                this.paddle.right, this.paddle.top,
                this.paddle.right, this.paddle.y + this.paddle.height * 0.8
            )
            if (p) this.setCollideData(p, 1, 0, -4)
        }

        // проверка кирпичей
        let brickIndex = this.bricks.children.length
        while (brickIndex > 0) {
            brickIndex--
            const brick = this.bricks.children[brickIndex]
            
            if (this.dx > 0) {
                const p = getLinesIntersectionPoint(
                    this.x, this.y, destinationX, destinationY,
                    brick.left, brick.top, brick.left, brick.bottom
                )
                if (p) this.setCollideData(p, -1, 0, brickIndex)
            } else {
                const p = getLinesIntersectionPoint(
                    this.x, this.y, destinationX, destinationY,
                    brick.right, brick.top, brick.right, brick.bottom
                )
                if (p) this.setCollideData(p, 1, 0, brickIndex)
            }
            
            if (this.dy > 0) {
                const p = getLinesIntersectionPoint(
                    this.x, this.y, destinationX, destinationY,
                    brick.left, brick.top, brick.right, brick.top
                )
                if (p) this.setCollideData(p, 0, -1, brickIndex)
            } else {
                const p = getLinesIntersectionPoint(
                    this.x, this.y, destinationX, destinationY,
                    brick.left, brick.bottom, brick.right, brick.bottom
                )
                if (p) this.setCollideData(p, 0, 1, brickIndex)
            }
        }
    }

    tick(deltaMs) {
        const path = this.speed * deltaMs
        const destinationX = this.x + this.dx * path
        const destinationY = this.y + this.dy * path

        this.checkCollision(destinationX, destinationY)

        if (this.collideOffsetX === this.collideOffsetY) {
            // Нет столкновения
            this.x = destinationX
            this.y = destinationY
        } else {
            // Обработка столкновения
            this.addSpeed()
            
            this.x = this.collideX + this.collideOffsetX
            this.y = this.collideY + this.collideOffsetY

            // бьём блок, если попали
            if (this.collideBrickIndex > -1) {
                this.bricks.children[this.collideBrickIndex].getHit(this.power)
            }

            // проверка выхода за нижнюю грань
            if (this.collideOffsetX === 0
            && this.collideOffsetY === -1
            && this.collideBrickIndex === -1) {
                if (this.isBottomBorder) {
                    this.dy *= -1
                    this.direction = Math.atan2(this.dy, this.dx)
                }
                this.onBottomCollide()
                return
            }

            if (this.collideBrickIndex === -2) {
                // верх платформы – угол зависит от места попадания
                const offsetRate = (this.platformOffset / (this.paddle.width * 0.5)) * 0.25
                this.dx += offsetRate
                this.dy = -Math.sqrt(Math.abs(1 - this.dx * this.dx))
            } else if (this.collideBrickIndex === -3 || this.collideBrickIndex === -4) {
                // бок платформы – резкий отскок назад
                this.dx *= -1
                this.dy *= -1
            } else {
                // стены (и будущие кирпичи) – обычное отражение
                if (this.collideOffsetX) {
                    this.dx *= -1
                } else {
                    this.dy *= -1
                }
            }
            this.direction = Math.atan2(this.dy, this.dx)
        }

        this.emitTrail(this.x, this.y, this.dx, this.dy, this.shine.tint, this.trailSize)
    }

    kill() {
        tickerRemove(this)
    }
}