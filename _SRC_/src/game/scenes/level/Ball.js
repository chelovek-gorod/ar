import { Container, Sprite } from "pixi.js";
import { tickerAdd, tickerRemove } from "../../../app/application";
import { images } from "../../../app/assets";
import { getLinesIntersectionPoint } from "../../../utils/functions";
import { playerPower } from "../../state";
import { BALL_RADIUS, BORDER_HALF_SIZE } from "./constants";

export const START_SPEED = 0.36
const ACC_RATE = 1.006
const SPEED_TAIL_RATE = 12
const POWER_COLORS = [
    {in: 0x000000, out: 0x000000}, // 0
    {in: 0xffffff, out: 0x00ff00}, // 1
    {in: 0xffff00, out: 0x00ff00}, // 2
    {in: 0xffffff, out: 0xffff00}, // 3
    {in: 0xffffff, out: 0xff0000}, // 4
    {in: 0xffff00, out: 0xff0000}, // 5
]

// Минимальный уклон от горизонтали (в радианах)
const MIN_HORIZONTAL_ANGLE = 6 * Math.PI / 180   // 6°
// Границы мёртвых зон
const RIGHT_DEAD_HIGH = MIN_HORIZONTAL_ANGLE      // от 0° до 6° (вправо)
const RIGHT_DEAD_LOW = 2 * Math.PI - MIN_HORIZONTAL_ANGLE // от 354° до 360° (эквивалент -6°..0°)
const LEFT_DEAD_LOW = Math.PI - MIN_HORIZONTAL_ANGLE     // от 174° до 180°
const LEFT_DEAD_HIGH = Math.PI + MIN_HORIZONTAL_ANGLE    // от 180° до 186°

export default class Ball extends Container {
    constructor(
        x, y, borderInnerWidth, bricks, paddle, emitTrail, addSparks,
        onBottomCollide, isBottomOn, startAngle = null
    ) {
        super()

        this.isFly = startAngle !== null
        this.isAlive = true

        this.bricks = bricks
        this.paddle = paddle
        this.onBottomCollide = onBottomCollide

        this.speed = START_SPEED

        this.emitTrail = emitTrail
        this.trailSize = Math.floor(this.speed * this.speed * SPEED_TAIL_RATE)

        this.addSparks = addSparks

        this.body = new Sprite(images.ball_body)
        this.body.anchor.set(0.5)
        this.addChild(this.body)

        this.shine = new Sprite(images.ball_shine)
        this.shine.anchor.set(0.5)
        this.shine.tint = POWER_COLORS[ playerPower ].out
        this.addChild(this.shine)

        this.lines = new Sprite(images.ball_lines)
        this.lines.anchor.set(0.5)
        this.lines.tint = POWER_COLORS[ playerPower ].in
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

        this.direction = startAngle ? startAngle : Math.PI * -0.5// Math.random() * Math.PI * 2
        this.dx = Math.cos(this.direction)
        this.dy = Math.sin(this.direction)

        tickerAdd(this)
    }

    start() {
        this.isFly = true
    }

    addPower() {
        this.shine.tint = POWER_COLORS[ playerPower ].out
        this.lines.tint = POWER_COLORS[ playerPower ].in
    }

    accelerate() {
        this.speed *= ACC_RATE
        this.trailSize = Math.floor(this.speed * this.speed * SPEED_TAIL_RATE)
    }

    addSpeed() {
        this.speed = this.speed * 1.5
        this.trailSize = Math.floor(this.speed * this.speed * SPEED_TAIL_RATE)
    }
    resetSpeed() {
        this.speed = START_SPEED
        this.trailSize = Math.floor(this.speed * this.speed * SPEED_TAIL_RATE)
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
                this.paddle.left, this.paddle.top,
                this.paddle.right, this.paddle.top
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
                this.paddle.left, this.paddle.bottom
            )
            if (p) this.setCollideData(p, -1, 0, -3)
        } else if (this.dx < 0) {
            const p = getLinesIntersectionPoint(
                this.x, this.y, destinationX, destinationY,
                this.paddle.right, this.paddle.top,
                this.paddle.right, this.paddle.bottom
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

    clampDirection() {
        let angle = this.direction % (2 * Math.PI)
        if (angle < 0) angle += 2 * Math.PI
    
        // Правая сторона
        if (angle === 0 || (angle >= RIGHT_DEAD_LOW && angle < 2 * Math.PI)) angle = RIGHT_DEAD_LOW       // 354° (вверх)
        else if (angle > 0 && angle < RIGHT_DEAD_HIGH) angle = RIGHT_DEAD_HIGH                             // 6°  (вниз)
        // Левая сторона
        else if (angle > LEFT_DEAD_LOW && angle < Math.PI) angle = LEFT_DEAD_LOW                           // 174° (вниз)
        else if (angle >= Math.PI && angle < LEFT_DEAD_HIGH) angle = LEFT_DEAD_HIGH                        // 186° (вверх)
    
        this.direction = angle
        this.dx = Math.cos(this.direction)
        this.dy = Math.sin(this.direction)
    }

    fly(deltaMs) {
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
            this.accelerate()
            
            this.x = this.collideX + this.collideOffsetX
            this.y = this.collideY + this.collideOffsetY

            // добавляем искры
            const sparksCount = Math.floor((this.speed * Math.random() * 6) + playerPower * 2)
            this.addSparks({x: this.collideX, y: this.collideY, count: sparksCount, isGravity: true})

            // бьём блок, если попали
            if (this.collideBrickIndex > -1) {
                this.bricks.children[this.collideBrickIndex].getHit(playerPower)
            }

            // проверка выхода за нижнюю грань
            if (this.collideOffsetX === 0
            && this.collideOffsetY === -1
            && this.collideBrickIndex === -1) {
                if (this.isBottomBorder) {
                    this.dy *= -1
                    this.direction = Math.atan2(this.dy, this.dx)
                    this.clampDirection()
                }
                this.onBottomCollide(this)
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
            this.clampDirection()
        }

        this.emitTrail(this.x, this.y, this.dx, this.dy, this.lines.tint, this.shine.tint, this.trailSize)
    }

    tick(deltaMs) {
        if (this.isFly) this.fly(deltaMs)
        else this.position.set(this.paddle.x, this.paddle.y - BALL_RADIUS)
    }
}