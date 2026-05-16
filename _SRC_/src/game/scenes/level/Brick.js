import { AnimatedSprite, Container, Sprite } from "pixi.js";
import { atlases } from "../../../app/assets";
import { getDarkColor } from "../../../utils/functions";
import { BALL_RADIUS, BRICK_H, BRICK_TYPE, BRICK_W } from "./constants";

// 0 - no; 1 - left; 2 - right; 3 - both sides
const grassPoints = [0, 1, 3, 0, 2]
let grassIndex = Math.floor( Math.random() * grassPoints.length )
function getGrassPoints() {
    grassIndex++
    if (grassIndex === grassPoints.length) grassIndex = 0
    return grassPoints[grassIndex]
}

// бонусы
/*
стрельба - 20 выстрелов с обеих сторон (повторная стрельба + 20 пуль каждой стороне)
защита - до первого столкновения с мячом (повторная защита - до 2го столкновения и т.д.)
усиление - +1 к мощности мяча (максимум 5), если у мяча сила 5 - вместо усиления выпадет - жизнь
расширение - шире платформа (максимум 5), если уже максимум - вместо расширения выпадет - жизнь
замедление - только при скорости мяча x1.5 от стартовой, иначе + 2 мяча
(если после победы на поле более 1го мяча - они дают доп жизнь (каждый))

--сужение (не сужает меньше 1го)
--ускорение (x1.5 к скорости мяча)
--потеря контроля на 5 касаний платформы края (платформа выбирает лево или право и ездит туда/сюда)
*/

const gemColors = [0x00ff00, 0xffff00, 0x0000ff, 0xff0000]
let gemIndex = Math.floor( Math.random() * gemColors.length )
function getGemColor() {
    gemIndex++
    if (gemIndex === gemColors.length) gemIndex = 0
    return gemColors[gemIndex]
}

export default class Brick extends Container {
    constructor(type, x, y, offset_x = 0, offset_y = 0, destroyBrick, setGreen, getGreen) {
        super()

        this.destroyBrick = destroyBrick
        this.shardsTint = null

        this.type = type
        this.hp = type.includes('hp_') ? +type[3]
            : type === BRICK_TYPE.stone || type === BRICK_TYPE.green || type === BRICK_TYPE.glass
            ? Infinity: 1

        const mainImage
            = type === BRICK_TYPE.stone ? atlases.bricks.textures.brick_stone
            : type === BRICK_TYPE.fire ? atlases.bricks.textures.brick_fire
            : type === BRICK_TYPE.gem ? atlases.bricks.textures.brick_gem
            : type === BRICK_TYPE.green ? atlases.bricks.textures.brick_green
            : type === BRICK_TYPE.scull ? atlases.bricks.textures.brick_scull
            : type === BRICK_TYPE.sun ? atlases.bricks.textures.brick_sun
            : type === BRICK_TYPE.glass ? atlases.bricks.textures.brick_glass
            : atlases.bricks.textures.brick

        if (offset_x || offset_y) {
            this.shadow = new Sprite(mainImage)
            this.shadow.tint = getDarkColor(0xffffff, 0.5)
            this.shadow.anchor.set(0.5)
            this.shadow.position.set(offset_x, offset_y)
            this.addChild(this.shadow)
        }

        this.brick = new Sprite(mainImage)
        this.brick.anchor.set(0.5)
        this.addChild(this.brick)

        const grass = type === BRICK_TYPE.glass ? 0 : getGrassPoints()
        const grassScaleX = Math.random() < 0.5 ? 1 : -1
        if (grass === 1 || grass === 3) {
            this.leftGrass = new Sprite(atlases.bricks.textures.grass_big)
            this.leftGrass.anchor.set(0.5)
            this.leftGrass.scale.x = grassScaleX
            this.addChild(this.leftGrass)
        }
        if (grass === 2 || grass === 3) {
            this.rightGrass = new Sprite(atlases.bricks.textures.grass_small)
            this.rightGrass.anchor.set(0.5)
            this.rightGrass.scale.x = grassScaleX
            this.addChild(this.rightGrass)
        }

        switch(type) {
            case BRICK_TYPE.glass:
                this.shardsTint = 0x0cffec
                this.isBroken = false
                this.alpha = 0
            break;

            case BRICK_TYPE.sun:
                this.shardsTint = 0x00e7b7
                this.sun = new AnimatedSprite(atlases.bricks.animations.sun)
                this.sun.anchor.set(0.5)
                this.sun.animationSpeed = 0.5
                this.sun.gotoAndPlay( Math.floor( Math.random() * 18 ) )
                this.addChild(this.sun)
            break;

            case BRICK_TYPE.green:
                this.setGreen = setGreen
                this.getGreen = getGreen

                this.shardsTint = 0x449628
                this.green = new Sprite(atlases.bricks.textures.green)
                this.green.tint = 0x557755
                this.green.anchor.set(0.5)
                this.addChild(this.green)
            break;
            
            case BRICK_TYPE.gem:
                this.shardsTint = 0x9c1ebb
                this.gem = new AnimatedSprite(atlases.bricks.animations.gem)
                this.gem.tint = getGemColor()
                this.gem.anchor.set(0.5)
                this.gem.animationSpeed = 0.5
                this.gem.gotoAndPlay( Math.floor( Math.random() * 15 ) )
                this.addChild(this.gem)
            break; 
            
            case BRICK_TYPE.scull:
                this.shardsTint = 0x274e5c
                this.scull = new Sprite(atlases.bricks.textures.scull)
                this.scull.anchor.set(0.5)
                this.addChild(this.scull)

                this.scullEyes = new Sprite(atlases.bricks.textures.scull_eyes)
                this.scullEyes.blendMode = 'add'
                this.scullEyes.tint = 0xff0000
                this.scullEyes.anchor.set(0.5)
                this.addChild(this.scullEyes)
            break;

            case BRICK_TYPE.fire:
                this.shardsTint = 0xb10522
                this.fire = new AnimatedSprite(atlases.bricks.animations.fire)
                this.fire.alpha = 0.85
                this.fire.anchor.set(0.5)
                this.fire.animationSpeed = 0.5
                this.fire.gotoAndPlay( Math.floor( Math.random() * 12 ) )
                this.addChild(this.fire)
            break;

            case BRICK_TYPE.hp_2:
                this.hit_1 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_1.anchor.set(0.5)
                this.addChild(this.hit_1)
            break;
            case BRICK_TYPE.hp_3:
                this.hit_1 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_1.anchor.set(0.5)
                this.hit_1.position.set(-15, 0)
                this.addChild(this.hit_1)

                this.hit_2 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_2.anchor.set(0.5)
                this.hit_2.position.set(15, 0)
                this.addChild(this.hit_2)
            break;
            case BRICK_TYPE.hp_4:
                this.hit_1 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_1.anchor.set(0.5)
                this.hit_1.position.set(-22, 0)
                this.addChild(this.hit_1)

                this.hit_2 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_2.anchor.set(0.5)
                this.addChild(this.hit_2)

                this.hit_3 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_3.anchor.set(0.5)
                this.hit_3.position.set(22, 0)
                this.addChild(this.hit_3)
            break;
            case BRICK_TYPE.hp_5:
                this.hit_1 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_1.anchor.set(0.5)
                this.hit_1.position.set(-27, 0)
                this.addChild(this.hit_1)

                this.hit_2 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_2.anchor.set(0.5)
                this.hit_2.position.set(-9, 0)
                this.addChild(this.hit_2)

                this.hit_3 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_3.anchor.set(0.5)
                this.hit_3.position.set(9, 0)
                this.addChild(this.hit_3)

                this.hit_4 = new Sprite(atlases.bricks.textures.hit_off)
                this.hit_4.anchor.set(0.5)
                this.hit_4.position.set(27, 0)
                this.addChild(this.hit_4)
            break;
        }

        this.position.set(x, y)

        this.left = x - (BRICK_W - 8) * 0.5 - BALL_RADIUS
        this.right = x + (BRICK_W - 8) * 0.5 + BALL_RADIUS
        this.top = y - (BRICK_H - 8) * 0.5 - BALL_RADIUS
        this.bottom = y + (BRICK_H - 8) * 0.5 + BALL_RADIUS
    }

    getHit(power) {
        this.hp -= power

        if (this.type === BRICK_TYPE.sun) console.log('add coin')

        else if (this.type === BRICK_TYPE.gem) console.log('add bonus')

        else if (this.type === BRICK_TYPE.fire) console.log('add explosion')

        else if (this.type === BRICK_TYPE.green) {
            const otherGreen = this.getGreen()
            if (otherGreen === null) {
                this.setGreen(this)
                this.green.tint = 0x99ff99
            } else if (otherGreen === this) {
                this.setGreen(null)
                this.green.tint = 0x557755
            } else {
                this.destroyBrick(this)
                this.destroyBrick(otherGreen)
                this.setGreen(null)
            }
            return
        }

        else if (this.type === BRICK_TYPE.glass) {
            if (!this.isBroken) {
                this.isBroken = true
                this.brick.texture = atlases.bricks.textures.brick_glass_broken
                this.alpha = 0.5
            } else {
                this.destroyBrick(this)
            }
            return
        }

        if (this.hp <= 0) this.destroyBrick(this)
        if (this.hp === Infinity) return

        if (this.type === BRICK_TYPE.hp_2) {
            this.hit_1.texture = atlases.bricks.textures.hit_on
        }
        else if (this.type === BRICK_TYPE.hp_3) {
            this.hit_1.texture = atlases.bricks.textures.hit_on
            this.hit_2.texture = atlases.bricks.textures[this.hp < 2 ? "hit_on" : "hit_off"]
        }
        else if (this.type === BRICK_TYPE.hp_4) {
            this.hit_1.texture = atlases.bricks.textures.hit_on
            this.hit_2.texture = atlases.bricks.textures[this.hp < 3 ? "hit_on" : "hit_off"]
            this.hit_3.texture = atlases.bricks.textures[this.hp < 2 ? "hit_on" : "hit_off"]
        } else if (this.type === BRICK_TYPE.hp_5) {
            this.hit_1.texture = atlases.bricks.textures.hit_on
            this.hit_2.texture = atlases.bricks.textures[this.hp < 4 ? "hit_on" : "hit_off"]
            this.hit_3.texture = atlases.bricks.textures[this.hp < 3 ? "hit_on" : "hit_off"]
            this.hit_4.texture = atlases.bricks.textures[this.hp < 2 ? "hit_on" : "hit_off"]
        }
    }
}