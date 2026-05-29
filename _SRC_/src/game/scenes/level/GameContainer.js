import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import { atlases, images } from '../../../app/assets'
import { EventHub, events } from '../../../app/events'
import { kill, tickerAdd, tickerRemove } from '../../../app/application'
import { BORDER_HALF_SIZE, BRICK_W, BRICK_H, BRICK_TYPE, BORDER_MIN_OFFSET, BRICK_CHAR_TYPE, BALL_RADIUS } from './constants'
import Brick from './Brick'
import Paddle from './Paddle'
import Ball, {START_SPEED} from './Ball'
import ShardsParticles from '../../effects/ShardsParticles'
import TrailParticles from '../../effects/TrailParticles'
import Gun from './Gun'
import Bonus, { BONUS_TYPE } from './Bonus'
import BonusFlyUp from './BonusFlyUp'
import { addPlayerBall, addPlayerBonusCountPowers, addPlayerPower, playerPower, removePlayerBall } from '../../state'
import SparksParticles from '../../effects/SparksParticles'
import GunBullet from './GunBullet'
import Explosion from './Explosion'

export default class GameContainer extends Container {
    constructor(map_lines) {
        super()

        this.ballTrail = new TrailParticles()

        this.border = new Container()
        this.borderBottom = new Container()
        this.borderBottomHp = 0
        this.borderBottom.visible = false

        this.green = null
        this.blocksAliveCount = 0

        const borderSize = BORDER_HALF_SIZE * 2
        const blocksWidth = Math.round( map_lines[0].length * 0.25 * BRICK_W )
        const lineWidth = blocksWidth + (BORDER_MIN_OFFSET * 2)
        const pcs = Math.ceil( lineWidth / borderSize )
        const borderInnerWidth = pcs * borderSize
        const offset = Math.round( (borderInnerWidth - blocksWidth) * 0.5 ) + borderSize
        const centerX = Math.round( offset + borderInnerWidth * 0.5 )
        const bottomY = offset + borderInnerWidth
        this.bonusMaxY = borderInnerWidth + offset
        this.borderInnerWidth = borderInnerWidth

        this.fillBg(borderInnerWidth, borderSize)

        this.addChild(this.ballTrail.container)
        
        this.addChild(this.border, this.borderBottom)

        this.fillBorder(borderSize, pcs)

        this.ballTrail.resize(this.width, this.height)

        this.bricks = new Container()
        this.addChild(this.bricks)
        this.fillBricks(map_lines, offset)

        this.explosions = new Container()
        this.addChild(this.explosions)
        this.explosionsPoints = []

        this.paddle = new Paddle(3, centerX, bottomY - 72, borderInnerWidth)
        this.addChild(this.paddle)

        this.bullets = new Container()
        this.addChild(this.bullets)

        this.gunLeft = new Gun(
            borderSize + 32, bottomY + 6, 0,
            true, this.addBullet.bind(this), this.bricks
        )
        this.addChild(this.gunLeft)

        this.gunRight = new Gun(
            borderInnerWidth + borderSize - 32, bottomY + 6, 0,
            false, this.addBullet.bind(this), this.bricks
        )
        this.addChild(this.gunRight)

        this.shards = new ShardsParticles(this.width, this.height)
        this.addChild(this.shards.container)

        this.sparks = new SparksParticles(this.width, this.height)
        this.addChild(this.sparks.container)

        this.bonuses = new Container()
        this.addChild(this.bonuses)

        this.balls = new Container()
        this.addChild(this.balls)

        removePlayerBall()
        this.balls.addChild(
            new Ball(
                centerX, this.paddle.y - BALL_RADIUS,
                borderInnerWidth,
                this.bricks, this.paddle,
                this.ballTrail.emit.bind(this.ballTrail),
                this.sparks.addSparks.bind(this.sparks),
                this.ballCollideBorderBottom.bind(this),
                this.borderBottom.visible, null
            )
        )

        EventHub.on(events.collectBonus, this.collectBonus, this)
        EventHub.on(events.dropLoseBonus, this.dropLoseBonus, this)
    }

    fillBg(borderInnerWidth, borderSize) {
        //const bgAlpha = 0.75

        const gradient = new TilingSprite(images.border_bg)
        //gradient.alpha = bgAlpha
        gradient.width = borderInnerWidth + 8
        gradient.height = borderInnerWidth + borderSize + 4
        gradient.position.set(borderSize - 4, borderSize - 4)
        this.addChild(gradient)
    }

    fillBorder(borderSize, pcs) {
        // set corners
        const farPoint = borderSize * (pcs + 1) + BORDER_HALF_SIZE

        const top_left = new Sprite(images.border_corner)
        top_left.anchor.set(0.5)
        top_left.rotation = Math.PI * 0.5
        top_left.position.set(BORDER_HALF_SIZE, BORDER_HALF_SIZE)
        this.border.addChild(top_left)

        const top_right = new Sprite(images.border_corner)
        top_right.anchor.set(0.5)
        top_right.rotation = Math.PI
        top_right.position.set(farPoint, BORDER_HALF_SIZE)
        this.border.addChild(top_right)

        const bottom_left = new Sprite(images.border_corner)
        bottom_left.anchor.set(0.5)
        bottom_left.position.set(BORDER_HALF_SIZE, farPoint)
        this.border.addChild(bottom_left)

        const bottom_right = new Sprite(images.border_corner)
        bottom_right.anchor.set(0.5)
        bottom_right.rotation = Math.PI * -0.5
        bottom_right.position.set(farPoint, farPoint)
        this.border.addChild(bottom_right)

        // top line
        for(let i_x = 1; i_x <= pcs; i_x++) {
            const x = i_x * borderSize + BORDER_HALF_SIZE
            const top = new Sprite(images.border_side)
            top.anchor.set(0.5)
            top.rotation = Math.PI * 0.5
            top.position.set(x, BORDER_HALF_SIZE)
            this.border.addChild(top)
        }

        // left line
        for(let i_y = 1; i_y <= pcs; i_y++) {
            const y = i_y * borderSize + BORDER_HALF_SIZE
            const left = new Sprite(images.border_side)
            left.anchor.set(0.5)
            left.position.set(BORDER_HALF_SIZE, y)
            this.border.addChild(left)
        }

        // right line
        for(let i_y = 1; i_y <= pcs; i_y++) {
            const y = i_y * borderSize + BORDER_HALF_SIZE
            const right = new Sprite(images.border_side)
            right.anchor.set(0.5)
            right.rotation = Math.PI
            right.position.set(farPoint, y)
            this.border.addChild(right)
        }

        // bottom line
        for(let i_x = 1; i_x <= pcs; i_x++) {
            const x = i_x * borderSize + BORDER_HALF_SIZE
            const top = new Sprite(images.border_side)
            top.anchor.set(0.5)
            top.rotation = Math.PI * 1.5
            top.position.set(x, farPoint)
            this.borderBottom.addChild(top)
        }
    }

    fillBricks( map_lines, offset ) {
        // calc shadow offset
        const startOffset = map_lines[0].length === 9 * 4 ? -4 : -3

        const startX = offset + BRICK_W * 0.5 
        const startY = offset + BRICK_H * 0.5
        const stepX = Math.round( BRICK_W * 0.25 )
        let offsetY = startOffset - 0.5
        for(let lineIndex = 0; lineIndex < map_lines.length; lineIndex++) {
            offsetY += 0.5
            const line = map_lines[lineIndex]
            const y = startY + lineIndex * BRICK_H
            let offsetX = startOffset - 0.25
            for(let i = 0; i < line.length; i++) {
                offsetX += 0.25
                if (line[i] === '[') {
                    const type = BRICK_CHAR_TYPE[ line[i + 2] ]
                    const x = startX + i * stepX
                    const brick = new Brick(
                        type,
                        x, y, offsetX, offsetY,
                        this.destroyBrick.bind(this),
                        this.setGreen.bind(this), this.getGreen.bind(this)
                    )
                    this.bricks.addChild( brick )
                    if (type !== BRICK_TYPE.stone) this.blocksAliveCount++
                }
            }
        }
    }

    setGreen(green) {
        this.green = green
    }
    getGreen() {
        return this.green
    }

    addBullet(x, y, angle) {
        this.bullets.addChild(
            new GunBullet(
                x, y, angle, this.borderInnerWidth, this.bricks, this.sparks.addSparks.bind(this.sparks)
            )
        )
    }

    ballCollideBorderBottom(ball) {
        if (this.borderBottomHp > 0) {
            this.borderBottomHp--
            if (this.borderBottomHp === 0) {
                for(let i = 0; i < this.balls.children.length; i++) {
                    this.balls.children[i].setBottomBorder(false)
                }
                this.borderBottom.visible = false
            }
        } else {
            ball.isAlive = false
            tickerRemove(ball)
            kill(ball)
            
            let isAliveBall = false
            for(let i = 0; i < this.balls.children.length; i++) {
                if (this.balls.children[i].isAlive) isAliveBall = true
            }
            if (!isAliveBall) alert('GAME OVER')
        }
    }

    destroyBrick(brick) {
        // сохраняем данные которые могут пригодиться
        const brickType = brick.type
        const brickX = brick.x
        const brickY = brick.y
        const bonusType = (brickType === BRICK_TYPE.gem) ? brick.bonusType : null

        // уничтожаем блок
        tickerRemove(brick)
        this.bricks.removeChild(brick)
        this.shards.addShards(brick.x, brick.y, brick.shardsTint, brick.alpha)
        brick.destroy({children: true})

        // добавляем эффект
        if (brickType === BRICK_TYPE.sun) this.dropBonus(brickX, brickY, BONUS_TYPE.ADD_COIN)
        else if (brickType === BRICK_TYPE.fire) this.addExplosion(brickX, brickY)
        else if (brickType === BRICK_TYPE.gem) this.dropBonus(brickX, brickY, bonusType)
        
        // считаем остатки
        this.blocksAliveCount--
        if (this.blocksAliveCount === 0) alert('WIN!!!')
    }

    addExplosion(x, y) {
        this.explosions.addChild( new Explosion(x, y) )
        this.explosionsPoints.push({x, y})
        tickerAdd(this)
    }

    setExplosionHit(x, y) {
        const offsetX = BRICK_W * 1.5
        const offsetY = BRICK_H * 1.5
        for (let i = this.bricks.children.length - 1; i >= 0; i--) {
            try {
                const brick = this.bricks.children[i]
                const dx = Math.abs(brick.x - x)
                const dy = Math.abs(brick.y - y)
                if (dx <= offsetX && dy <= offsetY) {
                    this.sparks.addSparks({x: brick.x, y: brick.y, count: 18, isGravity: true})
                    brick.getHit(2)
                }
            } catch {}
        }
    }

    dropLoseBonus(data) {
        const randomInt = Math.ceil(Math.random() * 3)
        switch(randomInt) {
            case 1 : this.dropBonus(data.x, data.y, BONUS_TYPE.LOSE_CONTROL); break;
            case 2 : this.dropBonus(data.x, data.y, BONUS_TYPE.LOSE_SIZE); break;
            case 3 : this.dropBonus(data.x, data.y, BONUS_TYPE.LOSE_TIME); break;
        }
    }

    dropBonus(x, y, type) {
        let bonusType = type
        if (type === BONUS_TYPE.ADD_POWER
        && this.balls.children.length > 0
        && this.balls.children[0].power === 5) {
            bonusType = BONUS_TYPE.ADD_BALL
        } else if (type === BONUS_TYPE.ADD_SIZE && this.paddle.size === 5) {
            bonusType = BONUS_TYPE.ADD_BALL
        } else if (type === BONUS_TYPE.ADD_TIME
        && this.balls.children.length > 0
        && this.balls.children[0].speed < START_SPEED * 1.5) {
            bonusType = BONUS_TYPE.ADD_BALL
        }
        this.bonuses.addChild( new Bonus(bonusType, x, y, this.bonusMaxY, this.paddle) )
    }

    collectBonus({type, x, y}) {
        switch(type) {
            // ADD
            case BONUS_TYPE.ADD_BALL :
                addPlayerBall()
            break
            case BONUS_TYPE.ADD_BALLS :
                let x = this.paddle.x
                let y = this.paddle.y - BALL_RADIUS
                for(let i = 0; i < this.balls.children.length; i++) {
                    if (this.balls.children[i].y < y) {
                        x = this.balls.children[i].x
                        y = this.balls.children[i].y
                    }
                }

                // left
                this.balls.addChild(
                    new Ball(
                        x, y, this.borderInnerWidth,
                        this.bricks, this.paddle,
                        this.ballTrail.emit.bind(this.ballTrail),
                        this.sparks.addSparks.bind(this.sparks),
                        this.ballCollideBorderBottom.bind(this),
                        this.borderBottom.visible, Math.PI * -0.7
                    )
                )

                // right
                this.balls.addChild(
                    new Ball(
                        x, y, this.borderInnerWidth,
                        this.bricks, this.paddle,
                        this.ballTrail.emit.bind(this.ballTrail),
                        this.sparks.addSparks.bind(this.sparks),
                        this.ballCollideBorderBottom.bind(this),
                        this.borderBottom.visible, Math.PI * -0.3
                    )
                )
            break
            case BONUS_TYPE.ADD_GUNS :
                this.gunLeft.addShuts()
                this.gunRight.addShuts()
            break
            case BONUS_TYPE.ADD_POWER :
                if (playerPower === 5) {
                    addPlayerBonusCountPowers()
                } else {
                    addPlayerPower()
                    for(let i = 0; i < this.balls.children.length; i++) {
                        this.balls.children[i].addPower()
                    }
                }
            break
            case BONUS_TYPE.ADD_SIZE :
                this.paddle.changeSize(1)
            break
            case BONUS_TYPE.ADD_TIME :
                for(let i = 0; i < this.balls.children.length; i++) {
                    this.balls.children[i].resetSpeed()
                }
            break
            case BONUS_TYPE.ADD_WALL :
                this.borderBottomHp++
                this.borderBottom.visible = true
                for(let i = 0; i < this.balls.children.length; i++) {
                    this.balls.children[i].setBottomBorder(true)
                }
            break

            // LOSE
            case BONUS_TYPE.LOSE_CONTROL :
                this.paddle.setLoseControl()
            break
            case BONUS_TYPE.LOSE_SIZE :
                this.paddle.changeSize(-1)
            break
            case BONUS_TYPE.LOSE_TIME :
                for(let i = 0; i < this.balls.children.length; i++) {
                    this.balls.children[i].addSpeed()
                }
            break
        }
        this.bonuses.addChild( new BonusFlyUp(type, x, y) )
    }

    tick() {
        if (this.explosionsPoints.length) {
            const {x, y} = this.explosionsPoints.pop()
            this.setExplosionHit(x, y)
        } else {
            tickerRemove(this)
        }
    }

    kill() {
        this.explosionsPoints = []
        tickerRemove(this)
        EventHub.off(events.collectBonus, this.collectBonus, this)
        EventHub.off(events.dropLoseBonus, this.dropLoseBonus, this)
    }
}