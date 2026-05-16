export const assetType = {
    images : 'images',
    atlases: 'atlases',
    sounds : 'sounds',
    music : 'music',
    fonts : 'fonts',
}

export const path = {
    images : './images/',
    atlases: './atlases/',
    sounds : './sounds/',
    music : './music/',
    fonts : './fonts/',
}
export const fonts = {
    P: 'Underdog-Regular.ttf',
}

export const images = {
    logo: 'logo.png',
    title_en: 'title_en.png',
    title_ru: 'title_ru.png',
    bg_main: 'bg_main.webp',

    particle: 'particle.png',

    bg_1: 'bg_1.webp',
    bg_2: 'bg_2.webp',
    bg_3: 'bg_3.webp',

    ball_body: 'ball_body.png',
    ball_shine: 'ball_shine.png',
    ball_lines: 'ball_lines.png',

    border_corner: 'border_corner.png',
    border_side: 'border_side.png',
    border_bg: 'border_bg.png',

    paddle_1: 'paddle_1.png',
    paddle_2: 'paddle_2.png',
    paddle_3: 'paddle_3.png',
    paddle_4: 'paddle_4.png',
    paddle_5: 'paddle_5.png',

    gun: 'gun.png',
}
export const atlases = {
    smoke: 'smoke.json',
    explosion: 'explosion.json',
    bricks: 'bricks.json',
    shards: 'shards.json',
}
export const sounds = {
    se_hover: 'se_hover.mp3',
    se_click: 'se_click.mp3',
    se_fall: 'se_fall.mp3',
    se_level: 'se_level.mp3',
    se_asteroid_explosion: 'se_asteroid.mp3',
    se_obstacle_explosion: 'se_obstacle_explosion.mp3',
    se_player_up: 'se_player_up.mp3',
    se_coins: 'se_coins.mp3',
    se_save: 'se_save.mp3',
    se_new_skin: 'se_new_skin.mp3',
    se_free_spin: 'se_free_spin.mp3',
    se_fireworks: 'se_fireworks.mp3',
}
export const music = {
    bgm_menu: 'bgm_menu.mp3',
    bgm_1: 'bgm_1.mp3',
    bgm_2: 'bgm_2.mp3',
    bgm_3: 'bgm_3.mp3',
    bgm_4: 'bgm_4.mp3',
}

export const assets = {fonts, images, atlases, sounds, music}
for (let assetType in assets) {
    for (let key in assets[assetType]) {
        assets[assetType][key] = path[assetType] + assets[assetType][key]
    }
}

// check duplicated keys
const allKeys = new Map()
const duplicates = new Set()

for (const [assetTypeName, assetCollection] of Object.entries(assets)) {
    for (const key of Object.keys(assetCollection)) {
        if (allKeys.has(key)) duplicates.add(key)
        allKeys.set(key, assetTypeName)
    }
}

if (duplicates.size > 0) {
    const duplicateDetails = Array.from(duplicates).map(key => {
        const types = []
        for (const [typeName, assetCollection] of Object.entries(assets)) {
            if (Object.prototype.hasOwnProperty.call(assetCollection, key)) {
                types.push(typeName)
            }
        }
        return `"${key}" (${types.join(', ')})`
    }).join(', ')
    
    throw new Error(`Duplicate asset keys detected: ${duplicateDetails}`)
}