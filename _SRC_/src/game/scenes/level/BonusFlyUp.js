import { Sprite } from "pixi.js";
import { kill, tickerAdd } from "../../../app/application";
import { atlases } from "../../../app/assets";

const FLY_SPEED = 0.36
const ALPHA_SPEED = 0.0006

export default class BonusFlyUp extends Sprite {
    constructor(type, x, y) {
        super( atlases.bonuses.textures['bonus_' + type.toLowerCase()] )
        this.anchor.set(0.5)
        this.position.set(x, y)
        tickerAdd(this)
    }

    tick(deltaMs) {
        this.y -= FLY_SPEED * deltaMs
        this.alpha -= ALPHA_SPEED * deltaMs

        if (this.alpha < 0) kill(this)
    }
}