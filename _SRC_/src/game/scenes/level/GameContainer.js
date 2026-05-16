import { Container, Graphics, Sprite, TilingSprite } from 'pixi.js'
import { atlases, images } from '../../../app/assets'
import { EventHub, events } from '../../../app/events'
import { appPointer, tickerAdd, tickerRemove } from '../../../app/application'
import { BORDER_HALF_SIZE, BRICK_W, BRICK_H, BRICK_TYPE, BORDER_MIN_OFFSET, BRICK_CHAR_TYPE, BALL_RADIUS } from './constants'
import Brick from './Brick'
import Paddle from './Paddle'
import Ball from './Ball'
import ShardsParticles from '../../effects/ShardsParticles'
import TrailParticles from '../../effects/TrailParticles'

export default class GameContainer extends Container {
    constructor(map_lines) {
        super()

        this.ballTrail = new TrailParticles()

        this.border = new Container()
        this.borderBottom = new Container()
        this.borderBottomHp = 4
        this.borderBottom.visible = true

        this.green = null

        const borderSize = BORDER_HALF_SIZE * 2
        const blocksWidth = Math.round( map_lines[0].length * 0.25 * BRICK_W)
        const lineWidth = blocksWidth + (BORDER_MIN_OFFSET * 2)
        const pcs = Math.ceil( lineWidth / borderSize )
        const borderInnerWidth = pcs * borderSize
        const offset = Math.round( (borderInnerWidth - blocksWidth) * 0.5 ) + borderSize
        const centerX = Math.round( offset + borderInnerWidth * 0.5 )
        const bottomY = offset + borderInnerWidth

        this.fillBg(borderInnerWidth, borderSize)

        this.addChild(this.ballTrail.container)
        
        this.addChild(this.border, this.borderBottom)

        this.fillBorder(borderSize, pcs)

        this.bricks = new Container()
        this.addChild(this.bricks)
        this.fillBricks(map_lines, offset)

        this.paddle = new Paddle(5, centerX, bottomY - 72, borderInnerWidth)
        this.addChild(this.paddle)
        
        this.ball = new Ball(
            centerX, this.paddle.y - BALL_RADIUS,
            borderInnerWidth,
            this.bricks, this.paddle,
            this.ballTrail.emit.bind(this.ballTrail),
            this.ballCollideBorderBottom.bind(this),
            this.borderBottom.visible
        )
        this.addChild(this.ball)

        this.gunLeft = new Sprite(images.gun)
        this.gunLeft.anchor.set(0.5)
        this.gunLeft.position.set(borderSize + 32, bottomY + 4)
        this.addChild(this.gunLeft)

        this.gunRight = new Sprite(images.gun)
        this.gunRight.anchor.set(0.5)
        this.gunRight.position.set(borderInnerWidth + borderSize - 32, bottomY + 4)
        this.addChild(this.gunRight)

        this.shards = new ShardsParticles(this.width, this.height)
        this.addChild(this.shards.container)
        this.ballTrail.resize(this.width, this.height)

        tickerAdd(this)
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
            top.rotation = Math.PI * 0.5
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

    ballCollideBorderBottom() {
        if (this.borderBottomHp > 0) {
            this.borderBottomHp--
            if (this.borderBottomHp === 0) {
                this.ball.setBottomBorder(false)
                this.borderBottom.visible = false
            }
        } else {
            alert('game over')
            this.ball.kill()
        }
    }

    destroyBrick(brick) {
        this.bricks.removeChild(brick)
        this.shards.addShards(brick.x, brick.y, brick.shardsTint, brick.alpha)
        brick.destroy({children: true})
    }

    tick(deltaMs) {
        const point = this.toLocal(appPointer.global)
        this.paddle.setPointerX( point.x )
    }

    kill() {
        
    }
}