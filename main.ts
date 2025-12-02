function hero1ABButton () {
    // 360° knockback, no damage
    // t1 = windup/damage (0 = no damage)
    // t2 = reach (small circle around you; tweak as you like)
    // t3 = arc (large value → capped at 360° by engine)
    // t4 = knockback (strong push)
    return [
    "Intelligence",
    500,
    20,
    999,
    80,
    "None",
    "A+B"
    ]
}
function hero1IdleButton () {
    return [
    "Support",
    0,
    10,
    10,
    10,
    "None",
    "Idle"
    ]
}
function hero1AButton () {
    // Do just enough damage to kill the enemy with the most HP near us
    damageTrait = nearbyEnemyMaxHP
    arcTrait = 0
    knockbackTrait = 0
    // Start with a default long reach
    reachTrait = 60
    // If there is an enemy in the direction we are aiming / moving, then set the reachTrait so it will go far enough to actually hit the enemy
    if (aimedNearestEnemyDistance > 0) {
        reachTrait = aimedNearestEnemyDistance + 10
        // If the nearest enemy is way too far away don't waste the mana! Set the reach to 0 (this would be the perfect spot to switch to an intelligence move instead)
        if (reachTrait > HERO1_STRENGTH_MAX_RADIUS) {
            reachTrait = 0
        }
    }
    // Long narrow poke: small arc, low damage, no knockback
    // t1 = windup/damage (low damage)
    // reachTrait,  // t2 = reach (long line)
    // t3 = arc (small, almost a straight line)
    // t4 = knockback (0 = no knockback)
    return [
    "Agility",
    damageTrait,
    reachTrait,
    arcTrait,
    knockbackTrait,
    "None",
    "A"
    ]
}
// Track which direction "slots" have at least one enemy
function updateSurroundedEnemiesStats (heroIndex: number, enemiesArr: number[], heroesArr: number[], maxDistance: number, sectorCount: number) {
    let HERO1_SURROUNDED_MIN_SLOTS = 0
    let sectors: boolean[] = []
    surroundedEnemyCountClose = 0
    surroundedDirectionSlotsHit = 0
    isSurrounded = false
    me = heroesArr[heroIndex]
    if (!(me)) {
        return
    }
    for (let j = 0; j <= sectorCount - 1; j++) {
        sectors[j] = false
    }
    for (let k = 0; k <= enemiesArr.length - 1; k++) {
        enemy = enemiesArr[k]
        if (!(enemy) || (enemy.flags & sprites.Flag.Destroyed)) {
            continue;
        }
        const e = distanceTo(me, enemy)
if (e > maxDistance) {
            continue;
        }
        surroundedEnemyCountClose += 1
        // Angle from me → enemy in degrees
        dx = enemy.x - me.x
        dy = enemy.y - me.y
        angleRad2 = Math.atan2(dy, dx)
        angleDeg = angleRad2 * 180 / Math.PI
        // Map angle [-180,180] into [0, 360)
        if (angleDeg < 0) {
            angleDeg += 360
        }
        // Slot enemy into a direction (0..sectorCount-1)
        sectorSize = 360 / sectorCount
        sectorIndex = Math.floor(angleDeg / sectorSize)
        if (sectorIndex < 0) {
            sectorIndex = 0
        }
        if (sectorIndex >= sectorCount) {
            sectorIndex = sectorCount - 1
        }
        if (!(sectors[sectorIndex])) {
            sectors[sectorIndex] = true
            surroundedDirectionSlotsHit += 1
        }
    }
    // Simple rule of thumb for "surrounded"
    if (surroundedEnemyCountClose >= 3 && surroundedDirectionSlotsHit >= HERO1_SURROUNDED_MIN_SLOTS) {
        isSurrounded = true
    } else {
        isSurrounded = false
    }
}
function hero1BButton () {
    // Medium reach, wider arc, some knockback
    // t1 = windup/damage (medium)
    // t2 = reach (medium distance)
    // t3 = arc (wider swing)
    return [
    "Strength",
    15,
    40,
    40,
    20,
    "None",
    "B"
    ]
}
function updateAimedNearestEnemyStats (heroIndex: number, enemiesArr: number[], heroesArr: number[], maxDistance: number) {
    // Find the nearest enemy along my aim direction.
    // 
    // After calling:
    // aimedNearestEnemyDistance  → 0 if none, otherwise distance in pixels
    // aimedNearestEnemyAngleDiff → angle difference in degrees (0 = perfectly lined up)
    // 
    // You can use these to set how far the Strength move reaches, and
    // how wide the arc should be (if you want).
    aimedNearestEnemyDistance = 0
    aimedNearestEnemyAngleDiff = 0
    me = heroesArr[heroIndex]
    if (!(me)) {
        return
    }
    // Make sure aimAngleDeg is current
    updateAimDirection(heroIndex, heroesArr)
    for (let l = 0; l <= enemiesArr.length - 1; l++) {
        enemy = enemiesArr[l]
        if (!(enemy) || (enemy.flags & sprites.Flag.Destroyed)) {
            continue;
        }
        const f = distanceTo(me, enemy)
if (f > maxDistance) {
            continue;
        }
        dx2 = enemy.x - me.x
        dy2 = enemy.y - me.y
        angleRad3 = Math.atan2(dy2, dx2)
        angleDeg2 = angleRad3 * 180 / Math.PI
        diff = angleDeg2 - aimAngleDeg
        while (diff > 180) {
            diff += 0 - 360
        }
        while (diff < -180) {
            diff += 360
        }
        diffAbs = Math.abs(diff)
        if (!(found) || diffAbs < bestDiffAbs || diffAbs == bestDiffAbs && f < bestDistance) {
            found = true
            bestDiffAbs = diffAbs
            bestDistance = f
            aimedNearestEnemyDistance = f
            aimedNearestEnemyAngleDiff = diff
        }
    }
    if (!(found)) {
        aimedNearestEnemyDistance = 0
        aimedNearestEnemyAngleDiff = 0
    }
}
function hero1Logic (button: string, heroIndex: number, enemiesArr: any[], heroesArr: any[]) {
    let HERO1_SECTOR_COUNT = 0
    let HERO1_EMERGENCY_RADIUS = 0
    let HERO1_NEARBY_RADIUS = 0
    // 1) Update helper variables for THIS hero and nearby enemies
    updateMyHeroStats(heroIndex, heroesArr)
    updateNearbyEnemiesStats(heroIndex, enemiesArr, heroesArr, HERO1_NEARBY_RADIUS)
    // 1b) Emergency "surrounded" check
    updateSurroundedEnemiesStats(heroIndex, enemiesArr, heroesArr, HERO1_EMERGENCY_RADIUS, HERO1_SECTOR_COUNT)
    // 1c) Directional nearest enemy (for sizing Strength reach)
    updateAimedNearestEnemyStats(heroIndex, enemiesArr, heroesArr, HERO1_STRENGTH_MAX_RADIUS)
    // 2) Choose which move to use based on the button
    if (button == "A") {
        return hero1AButton()
    } else if (button == "B") {
        return hero1BButton()
    } else if (button == "A+B") {
        return hero1ABButton()
    } else {
        return hero1IdleButton()
    }
}
function updateAimDirection (heroIndex: number, heroesArr: number[]) {
    // Figure out which way I'm aiming, based on my movement (vx, vy).
    // If I'm not moving, keep the last aimAngleDeg so I don't "forget" my aim.
    me = heroesArr[heroIndex]
    if (!(me)) {
        aimAngleDeg = 0
        myVX = 0
        myVY = 0
        return
    }
    myVX = (me as any).vx
myVY = (me as any).vy
// If I'm standing still, keep the previous aim angle
    if (myVX == 0 && myVY == 0) {
        return
    }
    angleRad = Math.atan2(myVY, myVX)
    aimAngleDeg = angleRad * 180 / Math.PI
}
function updateNearbyEnemiesStats (heroIndex: number, enemiesArr: number[], heroesArr: number[], maxDistance: number) {
    // Update stats for enemies NEAR ME (within maxDistance pixels).
    // 
    // After calling this, you can use:
    // - nearbyEnemyCount
    // - nearbyEnemyMinHP
    // - nearbyEnemyMaxHP
    // - nearbyEnemyTotalHP
    // - nearbyEnemyAverageHP
    // - nearbyBruteCount
    nearbyEnemyCount = 0
    nearbyEnemyMinHP = 0
    nearbyEnemyMaxHP = 0
    nearbyEnemyTotalHP = 0
    nearbyEnemyAverageHP = 0
    nearbyBruteCount = 0
    me = heroesArr[heroIndex]
    if (!(me)) {
        return
    }
    for (let i = 0; i <= enemiesArr.length - 1; i++) {
        enemy = enemiesArr[i]
        if (!(enemy) || (enemy.flags & sprites.Flag.Destroyed)) {
            continue;
        }
        const d = distanceTo(me, enemy)
if (d > maxDistance) {
            continue;
        }
        const hp = sprites.readDataNumber(enemy, ENEMY_DATA.HP) | 0
const maxHp2 = sprites.readDataNumber(enemy, ENEMY_DATA.MAX_HP) | 0
// update count + sums
        nearbyEnemyCount += 1
        nearbyEnemyTotalHP += hp
        if (nearbyEnemyCount == 1) {
            nearbyEnemyMinHP = hp
            nearbyEnemyMaxHP = hp
        } else {
            if (hp < nearbyEnemyMinHP) {
                nearbyEnemyMinHP = hp
            }
            if (hp > nearbyEnemyMaxHP) {
                nearbyEnemyMaxHP = hp
            }
        }
        // brute detection
        if (maxHp2 >= 160) {
            nearbyBruteCount += 1
        }
    }
    if (nearbyEnemyCount > 0) {
        nearbyEnemyAverageHP = (nearbyEnemyTotalHP / nearbyEnemyCount) | 0
    } else {
        nearbyEnemyAverageHP = 0
    }
}
function updateMyHeroStats (heroIndex: number, heroesArr: number[]) {
    // Update myHP, myMaxHP, myMana, myMaxMana for the current hero.
    // 
    // Call this once at the start of hero1Logic before using those variables.
    me = heroesArr[heroIndex]
    if (!(me)) {
        myHP = 0
        myMaxHP = 0
        myMana = 0
        myMaxMana = 0
        return
    }
    myHP = sprites.readDataNumber(me, HERO_DATA.HP) | 0
myMaxHP = sprites.readDataNumber(me, HERO_DATA.MAX_HP) | 0
myMana = sprites.readDataNumber(me, HERO_DATA.MANA) | 0
myMaxMana = sprites.readDataNumber(me, HERO_DATA.MAX_MANA) | 0
}
let nearbyBruteCount = 0
let nearbyEnemyMinHP = 0
let angleRad = 0
let bestDistance = 0
let bestDiffAbs = 0
let found = false
let diffAbs = 0
let aimAngleDeg = 0
let diff = 0
let angleDeg2 = 0
let angleRad3 = 0
let dy2 = 0
let dx2 = 0
let aimedNearestEnemyAngleDiff = 0
let sectorIndex = 0
let sectorSize = 0
let angleDeg = 0
let angleRad2 = 0
let dy = 0
let dx = 0
let isSurrounded = false
let surroundedDirectionSlotsHit = 0
let surroundedEnemyCountClose = 0
let HERO1_STRENGTH_MAX_RADIUS = 0
let aimedNearestEnemyDistance = 0
let reachTrait = 0
let knockbackTrait = 0
let arcTrait = 0
let nearbyEnemyMaxHP = 0
let damageTrait = 0
let myVY = 0
// angle difference in degrees
// Velocity + angle helpers for aim code
let myVX = 0
let nearbyEnemyAverageHP = 0
let nearbyEnemyTotalHP = 0
// Stats for nearby enemies (within some radius of me)
let nearbyEnemyCount = 0
let myMaxMana = 0
let myMana = 0
let myMaxHP = 0
// Stats for MY HERO (the one whose logic is running)
let myHP = 0
// current ally in loops
let ally = null
// current enemy in loops
let enemy: any = null
let me: any = null
let DEMO_HERO1_IDLE = img`
    . . . . . . f f f f . . . . . . 
    . . . . f f f 2 2 f f f . . . . 
    . . . f f f 2 2 2 2 f f f . . . 
    . . f f f e e e e e e f f f . . 
    . . f f e 2 2 2 2 2 2 e e f . . 
    . . f e 2 f f f f f f 2 e f . . 
    . . f f f f e e e e f f f f . . 
    . f f e f b f 4 4 f b f e f f . 
    . f e e 4 1 f d d f 1 4 e e f . 
    . . f e e d d d d d d e e f . . 
    . . . f e e 4 4 4 4 e e f . . . 
    . . e 4 f 2 2 2 2 2 2 f 4 e . . 
    . . 4 d f 2 2 2 2 2 2 f d 4 . . 
    . . 4 4 f 4 4 5 5 4 4 f 4 4 . . 
    . . . . . f f f f f f . . . . . 
    . . . . . f f . . f f . . . . . 
    `
let DEMO_HERO2_IDLE = img`
    . . . . . . f f f f . . . . . . 
    . . . . f f f 4 4 f f f . . . . 
    . . . f f f 4 4 4 4 f f f . . . 
    . . f f f e e e e e e f f f . . 
    . . f f e 4 4 4 4 4 4 e e f . . 
    . . f e 4 f f f f f f 4 e f . . 
    . . f f f f e e e e f f f f . . 
    . f f e f b f 6 6 f b f e f f . 
    . f e e 4 6 f d d f 6 4 e e f . 
    . . f e e d d d d d d e e f . . 
    . . . f e e 4 4 4 4 e e f . . . 
    . . e 4 f 4 4 4 4 4 4 f 4 e . . 
    . . 4 d f 4 4 4 4 4 4 f d 4 . . 
    . . 4 4 f 2 2 2 2 2 2 f 4 4 . . 
    . . . . . f f f f f f . . . . . 
    . . . . . f f . . f f . . . . . 
    `
let DEMO_HERO3_IDLE = img`
    . . . . . . f f f f . . . . . . 
    . . . . f f f 6 6 f f f . . . . 
    . . . f f f 6 6 6 6 f f f . . . 
    . . f f f e e e e e e f f f . . 
    . . f f e 6 6 6 6 6 6 e e f . . 
    . . f e 6 f f f f f f 6 e f . . 
    . . f f f f e e e e f f f f . . 
    . f f e f b f 8 8 f b f e f f . 
    . f e e 4 8 f d d f 8 4 e e f . 
    . . f e e d d d d d d e e f . . 
    . . . f e e 4 4 4 4 e e f . . . 
    . . e 4 f 6 6 6 6 6 6 f 4 e . . 
    . . 4 d f 6 6 6 6 6 6 f d 4 . . 
    . . 4 4 f 4 4 9 9 4 4 f 4 4 . . 
    . . . . . f f f f f f . . . . . 
    . . . . . f f . . f f . . . . . 
    `
let DEMO_HERO4_IDLE = img`
    . . . . . . f f f f . . . . . . 
    . . . . f f f 8 8 f f f . . . . 
    . . . f f f 8 8 8 8 f f f . . . 
    . . f f f e e e e e e f f f . . 
    . . f f e 8 8 8 8 8 8 e e f . . 
    . . f e 8 f f f f f f 8 e f . . 
    . . f f f f e e e e f f f f . . 
    . f f e f b f 1 1 f b f e f f . 
    . f e e 4 1 f d d f 1 4 e e f . 
    . . f e e d d d d d d e e f . . 
    . . . f e e 4 4 4 4 e e f . . . 
    . . e 4 f 8 8 8 8 8 8 f 4 e . . 
    . . 4 d f 8 8 8 8 8 8 f d 4 . . 
    . . 4 4 f 4 4 9 9 4 4 f 4 4 . . 
    . . . . . f f f f f f . . . . . 
    . . . . . f f . . f f . . . . . 
    `
function isBruteEnemy(e: any): boolean {
    if (!e) return false
    const maxHp = sprites.readDataNumber(e, ENEMY_DATA.MAX_HP) | 0
    return maxHp >= 160
}
HeroEngine.hero1LogicHook = hero1Logic
HeroEngine.hero2LogicHook = hero1Logic
HeroEngine.hero3LogicHook = hero1Logic
HeroEngine.hero4LogicHook = hero1Logic
HeroEngine.start()
