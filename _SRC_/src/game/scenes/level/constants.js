import { createEnum } from "../../../utils/functions"

export const BORDER_MIN_OFFSET = 8
export const BORDER_HALF_SIZE = Math.round(48 * 0.5)
export const BRICK_W = 96 + 8 // 104
export const BRICK_H = 48 + 8 // 56
export const PADDLE_H = 92
export const PADDLE_W_LIST = [0, 140, 230, 380, 514, 580]
export const PADDLE_MIN_OFFSET = 128
export const BALL_RADIUS = 24

export const BRICK_TYPE = createEnum([
    'stone', // impossible to kill -> [ 0]
    'hp_1', 'hp_2', 'hp_3', 'hp_4', 'hp_5',
    'fire', // create explosion -> [ f]
    'sun', // drop coin -> [ c]
    'scull', // drop bad bonus -> [ !]
    'green', // need active to kill -> [ g]
    'gem', // drop good bonus -> [ ?]
    'glass', // invisible -> [  ]
])

export const BRICK_CHAR_TYPE = {
    '0' : BRICK_TYPE.stone,
    '1' : BRICK_TYPE.hp_1,
    '2' : BRICK_TYPE.hp_2,
    '3' : BRICK_TYPE.hp_3,
    '4' : BRICK_TYPE.hp_4,
    '5' : BRICK_TYPE.hp_5,
    'f' : BRICK_TYPE.fire,
    'c' : BRICK_TYPE.sun,
    '!' : BRICK_TYPE.scull,
    'g' : BRICK_TYPE.green,
    '?' : BRICK_TYPE.gem,
    ' ' : BRICK_TYPE.glass,
}