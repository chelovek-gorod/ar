import { AnimatedSprite } from "pixi.js";
import { kill } from "../../../app/application";
import { atlases } from "../../../app/assets";

export default class Explosion extends AnimatedSprite {
    constructor(x, y, scale = 1) {
        super(atlases.explosion.animations.go)
        this.anchor.set(0.5)
        this.position.set(x, y)
        this.rotation = Math.PI * (Math.random() * 2)
        this.scale.set(scale)
        this.loop = false
        this.onComplete = () => {
            kill(this)
        }
        this.play()
    }
}