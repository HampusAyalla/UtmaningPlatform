// Sätt ljudvolymen till en låg nivå 
document.getElementById("ljud").volume = 0.025;
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 526

const gravity = 0.35

let player
let platforms = []
let genericObjects = []
let monsters = []
let coins = []
let scrollOffset = 0
let lastKey
let score = 0
let startTime = null
let endTime = null
let levelCompleted = false
let bonusGiven = false
let currentLevel = 0
let lives = 3
let lastLevelScore = 0
let highScore = localStorage.getItem('platformerHighScore') || 0;

// Nivådata (plattformar, monster och mynt per nivå)
const levels = [
    {
        platforms: [
            { x: 0, y: 502, tiles: 60 },
            { x: 300, y: 360, tiles: 5 },
            { x: 600, y: 300, tiles: 8 },
            { x: 0, y: 110, tiles: 4 },
            { x: 200, y: 225, tiles: 5 },
            { x: 500, y: 150, tiles: 5 },
            { x: 1000, y: 250, tiles: 6 }
        ],
        monsters: [
            { x: 620, y: 250 },
            { x: 1000, y: 450 }
        ],
        coins: [
            { x: 28, y: 70 }
        ]
    },
    {
        platforms: [
            { x: 0, y: 502, tiles: 60 },
            { x: 300, y: 420, tiles: 5 },
            { x: 150, y: 150, tiles: 4 },
            { x: 800, y: 260, tiles: 5 },
            { x: 1000, y: 180, tiles: 3 },
            { x: 1250, y: 100, tiles: 4 },
            { x: 390, y: 280, tiles: 10 },
            { x: 450, y: 190, tiles: 2 },
        ],
        monsters: [
            { x: 170, y: 100 },
            { x: 820, y: 210 },
            { x: 1260, y: 50 }
        ],
        coins: [
            { x: 1280, y: 60 }
        ]
    },
    {
        platforms: [
            { x: 0, y: 502, tiles: 20 },
            { x: 200, y: 400, tiles: 4 },
            { x: 400, y: 90, tiles: 3 },
            { x: 700, y: 400, tiles: 4 },
            { x: 400, y: 300, tiles: 3 },
            { x: 0, y: 250, tiles: 5 },
            { x: 600, y: 250, tiles: 5 }
        ],
        monsters: [
            { x: 210, y: 350 },
            { x: 710, y: 350 },
        ],
        coins: [
            { x: 420, y: 40 }
        ],
    },
    {
        platforms: [
            { x: 0, y: 502, tiles: 20 },
            { x: 170, y: 370, tiles: 4 },
            { x: 350, y: 250, tiles: 4 },
            { x: 900, y: 400, tiles: 2 },
            { x: 1100, y: 300, tiles: 5 },
            { x: 1500, y: 400, tiles: 4 },
            { x: 1400, y: 325, tiles: 12 }
        ],
        monsters: [
            { x: 310, y: 450 },
            { x: 710, y: 230 },
        ],
        coins: [
            { x: 1530, y: 360 }
        ]
    }
]

const keys = {
    right: { pressed: false },
    left: { pressed: false },
    up: { pressed: false },
    down: { pressed: false }
}
// Hjälpmetod för att skapa bilder
function createImage(src) {
    const image = new Image()
    image.src = src
    return image
}
// Ladda bilder för grafik och sprites
const tilesetImage = createImage('./img/oak_woods_tileset.png')
const backgroundImage = createImage('./img/backgroundCity1.png')
const BackgrounCity2Image = createImage('./img/BackgroundCity2.png')
const BackgrounCity3Image = createImage('./img/BackgroundCity3.png')
const BackgrounCity4Image = createImage('./img/BackgroundCity4.png')
const BackgrounCity5Image = createImage('./img/BackgroundCity5.png')
const runImage = createImage('./img/Run.png')
const runLeftImage = createImage('./img/Run_left.png')
const idleImage = createImage('./img/Idle.png')
const idleLeftImage = createImage('./img/Idle_left.png')
const jumpImage = createImage('./img/Jump.png')
const jumpLeftImage = createImage('./img/Jump_left.png')
const monsterImage = createImage('./img/gangster_enemy.png')
const coinImage = createImage('./img/Coin.gif')

// klasser används för att det ska bli enklare att skapa fler av en sort och fixa mellan levlar

class Player {
    constructor() {
        this.speed = 4.5
        this.position = { x: 50, y: 404 }
        this.velocity = { x: 0, y: 0 }
        this.width = 55
        this.height = 98
        this.frames = 0
        this.maxFrames = 4
        this.frameElapsed = 0
        this.frameHold = 8
        this.sprites = {
            stand: { right: idleImage, left: idleLeftImage },
            run: { right: runImage, left: runLeftImage },
            jump: { right: jumpImage, left: jumpLeftImage }
        }
        this.currentSprite = this.sprites.stand.right
        this.currentDirection = 'right'
    }

    draw() {
        c.drawImage(
            this.currentSprite,
            38 + this.frames * 128, 30, 55, 98,
            this.position.x, this.position.y,
            this.width, this.height
        )
    }

    update() {
        this.frameElapsed++
        if (this.frameElapsed % this.frameHold === 0) {
            this.frames++
            if (this.frames > this.maxFrames) this.frames = 0
        }
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
        if (this.position.y + this.height + this.velocity.y <= canvas.height)
            this.velocity.y += gravity
    }
}

class Platform {
    constructor({ x, y, tiles }) {
        this.position = { x, y }
        this.tiles = tiles
        this.tileSize = 24
        this.width = tiles * this.tileSize
        this.height = this.tileSize
    }

    draw() {
        for (let i = 0; i < this.tiles; i++) {
            let sx = 24
            if (i === 0) sx = 0
            else if (i === this.tiles - 1) sx = 48

            c.drawImage(
                tilesetImage,
                sx, 0, 24, 24,
                this.position.x + i * this.tileSize,
                this.position.y,
                this.tileSize,
                this.tileSize
            )
        }
    }
}
// Klass för bakgrundsobjekt (I vårat fall parallax)
class GenericObject {
    constructor({ x, y, image, scrollSpeed = 1 }) {
        this.position = { x, y }
        this.image = image
        this.scrollSpeed = scrollSpeed
    }

    draw() {
    const w = this.image.width
    const h = this.image.height
    const repetitions = Math.ceil(canvas.width / w) + 2
    for (let i = 0; i < repetitions; i++) {
        c.drawImage(
            this.image,
            this.position.x + i * w,
            this.position.y,
            w,
            canvas.height 
        )
    }
}

    scroll(dx) {
        this.position.x += dx * this.scrollSpeed
    }
}

class Monster {
    constructor({ x, y }) {
        this.position = { x, y }
        this.velocity = { x: 1, y: 0 }
        this.width = 50
        this.height = 50
    }

    draw() {
        c.drawImage(monsterImage, this.position.x, this.position.y, this.width, this.height)
    }

    update() {
        this.position.x += this.velocity.x

        const currentPlatform = platforms.find(platform =>
            Math.abs(this.position.y + this.height - platform.position.y) < 5 &&
            this.position.x + this.width > platform.position.x &&
            this.position.x < platform.position.x + platform.width
        )

        if (currentPlatform) {
            const nextLeft = this.position.x + this.velocity.x
            const nextRight = nextLeft + this.width

            if (
                nextLeft < currentPlatform.position.x ||
                nextRight > currentPlatform.position.x + currentPlatform.width
            ) {
                this.velocity.x *= -1
            }
        } else {
            this.velocity.x = 0
        }

        this.draw()
    }
}

class Coin {
    constructor({ x, y }) {
        this.position = { x, y }
        this.width = 32
        this.height = 32
        this.collected = false
    }

    draw() {
        if (!this.collected)
            c.drawImage(coinImage, this.position.x, this.position.y, this.width, this.height)
    }
}
// Ladda nivå efter index
function loadLevel(levelIndex) {
    const level = levels[levelIndex]
    player = new Player()
    if(levelIndex === 2){
        player.position.y = 100
    }
    platforms = level.platforms.map(p => new Platform(p))
    monsters = level.monsters.map(m => new Monster(m))
    coins = level.coins.map(c => new Coin(c))
    genericObjects = [
        new GenericObject({ x: 0, y: 0, image: backgroundImage, scrollSpeed: 0.2 }),
        new GenericObject({ x: 0, y: 0, image: BackgrounCity2Image, scrollSpeed: 0.35 }),
        new GenericObject({ x: 0, y: 0, image: BackgrounCity3Image, scrollSpeed: 0.5 }),
        new GenericObject({ x: 0, y: 0, image: BackgrounCity4Image, scrollSpeed: 0.75 }),
        new GenericObject({ x: 0, y: 0, image: BackgrounCity5Image, scrollSpeed: 1 })
    ]
    scrollOffset = 0
    startTime = performance.now()
    levelCompleted = false
    bonusGiven = false
    lastLevelScore = score
}
// Gå till nästa nivå eller starta om om det var sista
function nextLevel() {
    currentLevel++
    if (currentLevel >= levels.length) {
        alert("Grattis! Du klarade alla nivåer!")
        currentLevel = 0
        score = 0
        lives = 3
    }
    loadLevel(currentLevel)
}
// Huvudanimationsloopen
function animate() {
    requestAnimationFrame(animate)
    c.fillStyle = 'white'
    c.fillRect(0, 0, canvas.width, canvas.height)

 // Rita bakgrunder, plattformar, monster, mynt och spelare
    genericObjects.forEach(o => o.draw())
    platforms.forEach(p => p.draw())
    monsters.forEach(m => m.update())
    coins.forEach(cn => cn.draw())
    player.update()

// Hantera kollision mellan spelare och plattformar
    platforms.forEach(p => {
        if (
            player.position.y + player.height <= p.position.y &&
            player.position.y + player.height + player.velocity.y >= p.position.y &&
            player.position.x + player.width >= p.position.x &&
            player.position.x <= p.position.x + p.width
        ) {
            if (!keys.down.pressed || p.position.y >= 480) {
                player.velocity.y = 0
            }
        }
    })

// Hantera insamling av mynt (efter alla monster är döda)

    coins.forEach((coin) => {
        if (!coin.collected && monsters.length === 0 &&
            player.position.x < coin.position.x + coin.width &&
            player.position.x + player.width > coin.position.x &&
            player.position.y < coin.position.y + coin.height &&
            player.position.y + player.height > coin.position.y
        ) {
            coin.collected = true
            levelCompleted = true
            endTime = performance.now()
            score += 50
        }
    })

    if (monsters.length > 0 && coins.some(c => !c.collected)) {
        c.fillStyle = 'rgba(0,0,0,0.7)'
        c.font = '16px Arial'
        c.fillText('Slå alla monster för att kunna ta upp mynter!', 20, 90)
        c.fillText('Keybindings (W,A,S,D)', 20, 110)
    }
// Hantera kollision med monster och att ramla ner för banan (döda monster eller förlora liv)
    monsters.forEach((monster, i) => {
        const playerBottom = player.position.y + player.height
        const monsterTop = monster.position.y
        const playerPrevBottom = playerBottom - player.velocity.y
        const horizontal = player.position.x + player.width > monster.position.x &&
                           player.position.x < monster.position.x + monster.width
        if (
            playerPrevBottom <= monsterTop &&
            playerBottom >= monsterTop &&
            player.velocity.y > 0 &&
            horizontal
        ) {
            monsters.splice(i, 1)
            player.velocity.y = -8
            score += 100
        } else if (
            horizontal &&
            player.position.y < monster.position.y + monster.height &&
            playerBottom > monster.position.y
        ) {
            lives -= 1

            if (lives <= 0) {
        // Spelet startar om
        alert("Game Over! Poäng: " + score)
        score = 0
        currentLevel = 0
        lives = 3
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('platformerHighScore', highScore);
}
        loadLevel(currentLevel)
    } else {
        // Ladda om nuvarande nivå men behåll score
        score = lastLevelScore
        loadLevel(currentLevel)
    }
        }
    })
    // Kollar om man har ramlat ner för mappen
    if(player.position.y > canvas.height){
        lives -= 1

        if (lives <= 0) {
    // Spelet startar om
    alert("Game Over! Poäng: " + score)
    score = 0
    currentLevel = 0
    lives = 3
    if (score > highScore) {
         highScore = score;
        localStorage.setItem('platformerHighScore', highScore);
}
        loadLevel(currentLevel)
    } else {
        // Ladda om nuvarande nivå men behåll score
        score = lastLevelScore
        loadLevel(currentLevel)
    }
        }
// Hantera spelarens sprite beroende på rörelse eller hopp
    if (player.velocity.y !== 0) {
        player.maxFrames = 9
        player.currentSprite = player.sprites.jump[player.currentDirection]
    } else if (keys.right.pressed && lastKey === "right") {
        player.maxFrames = 9
        player.currentSprite = player.sprites.run.right
        player.currentDirection = 'right'
    } else if (keys.left.pressed && lastKey === "left") {
        player.maxFrames = 9
        player.currentSprite = player.sprites.run.left
        player.currentDirection = 'left'
    } else {
        player.maxFrames = 4
        player.currentSprite = player.sprites.stand[player.currentDirection]
    }

// Scrolla världen om spelaren når skärmens kant
    if (keys.right.pressed && player.position.x < 400) player.velocity.x = player.speed
    else if (keys.left.pressed && (player.position.x > 100 || (scrollOffset === 0 && player.position.x > 0))) player.velocity.x = -player.speed
    else {
        player.velocity.x = 0
        if (keys.right.pressed) {
            scrollOffset += player.speed
            platforms.forEach(p => p.position.x -= player.speed)
            genericObjects.forEach(obj => obj.scroll(-player.speed * 0.66))
            monsters.forEach(m => m.position.x -= player.speed)
            coins.forEach(c => c.position.x -= player.speed)
        } else if (keys.left.pressed && scrollOffset > 0) {
            scrollOffset -= player.speed
            platforms.forEach(p => p.position.x += player.speed)
            genericObjects.forEach(obj => obj.scroll(player.speed * 0.66))
            monsters.forEach(m => m.position.x += player.speed)
            coins.forEach(c => c.position.x += player.speed)
        }
    }
// Bestäm hur lång tid leveln har tagit samt rita tid, poäng, liv och highscore på skärmen
    if (startTime && !levelCompleted) {
        const t = ((performance.now() - startTime) / 1000).toFixed(2)
        c.fillStyle = 'black'
        c.font = '20px Arial'
        c.fillText(`Tid: ${t}s`, 20, 30)
        c.fillText(`Poäng: ${Math.floor(score)}`, 20, 60)
        c.fillText(`Liv: ${lives}`, canvas.width - 100, 30)
        c.fillText(`Highscore: ${highScore}`, canvas.width - 180, 60);
    } else if (levelCompleted) {
        const timeTaken = ((endTime - startTime) / 1000).toFixed(2)
        if (!bonusGiven) {
            score += Math.floor(1000 / timeTaken)
            bonusGiven = true
            setTimeout(nextLevel, 2000)
        }
        c.fillStyle = 'black'
        c.font = '20px Arial'
        c.fillText(`Level completed in: ${timeTaken}s`, 20, 30)
        c.fillText(`Score: ${Math.floor(score)}`, 20, 60)
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('platformerHighScore', highScore);
        }
    }
}

// Spelarens rörelse
addEventListener('keydown', ({ keyCode }) => {
    switch (keyCode) {
        case 65: keys.left.pressed = true; lastKey = "left"; break
        case 68: keys.right.pressed = true; lastKey = "right"; break
        case 87:
            if (player.velocity.y === 0) player.velocity.y = -10
            keys.up.pressed = true
            break
        case 83: player.height = 64; keys.down.pressed = true; break
    }
})

addEventListener('keyup', ({ keyCode }) => {
    switch (keyCode) {
        case 65: keys.left.pressed = false; break
        case 68: keys.right.pressed = false; break
        case 87: keys.up.pressed = false; break
        case 83:
            player.height = 98
            player.position.y -= 64
            keys.down.pressed = false
            break
    }
})

// Ser till att alla bilder är laddade innan spelet börjar
let imagesLoaded = 0
const totalImages = 11

function onImageLoad() {
    imagesLoaded++
    if (imagesLoaded === totalImages) {
        loadLevel(currentLevel)
        animate()
    }
}

tilesetImage.onload = onImageLoad
backgroundImage.onload = onImageLoad
BackgrounCity2Image.onload = onImageLoad
BackgrounCity3Image.onload = onImageLoad
BackgrounCity4Image.onload = onImageLoad
BackgrounCity5Image.onload = onImageLoad
runImage.onload = onImageLoad
runLeftImage.onload = onImageLoad
idleImage.onload = onImageLoad
idleLeftImage.onload = onImageLoad
jumpImage.onload = onImageLoad
jumpLeftImage.onload = onImageLoad
monsterImage.onload = onImageLoad
coinImage.onload = onImageLoad
