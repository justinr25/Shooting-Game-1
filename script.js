// canvas setup
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const scoreContainer = document.querySelector('#scoreContainer')
const scoreEl = document.querySelector('#scoreEl')
const points = document.querySelector('h1')
const startGameBtn = document.querySelector('#startGameBtn')
const gameOverContainer = document.querySelector('#gameOverContainer')

// variables
const enemyColors = [
    '#E87900',
    '#FFA400',
    '#FF680D',
    '#E83600',
    '#FF1600'
]
const keys = {
    up: {
        pressed: false
    },
    left: {
        pressed: false
    },
    down: {
        pressed: false
    },
    right: {
        pressed: false
    }
}

// event listeners
addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight
    cancelAnimationFrame(animationId)
    init()
})

// objects
class Player {
    constructor(x, y, radius, color, velocity, speed) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.speed = speed
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()

        // prevent player from moving outside border
        if (this.x - this.radius + this.velocity.x < 0 || this.x + this.radius + this.velocity.x > canvas.width) {
            this.velocity.x = 0
        }
        if (this.y - this.radius + this.velocity.y < 0 || this.y + this.radius + this.velocity.y > canvas.height) {
            this.velocity.y = 0
        }

        // update player velocity
        if (keys.up.pressed) this.velocity.y = -1
        else if (keys.down.pressed) this.velocity.y = 1
        else this.velocity.y = 0
        if (keys.left.pressed) this.velocity.x = -1
        else if (keys.right.pressed) this.velocity.x = 1
        else this.velocity.x = 0

        // update player position
        this.x += this.velocity.x * this.speed
        this.y += this.velocity.y * this.speed
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity, speed, damage) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.speed = speed
        this.damage = damage
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()

        // update projectile position
        this.x += this.velocity.x * this.speed
        this.y += this.velocity.y * this.speed
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity, speed) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.speed = speed
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
    }

    update() {
        this.draw()

        // update enemy velocity
        const angle = Math.atan2(player.y - this.y, player.x - this.x)
        this.velocity.x = Math.cos(angle)
        this.velocity.y = Math.sin(angle)

        // update enemy position
        this.x += this.velocity.x * this.speed
        this.y += this.velocity.y * this.speed
    }
}

class Particle {
    constructor(x, y, radius, color, velocity, speed) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.speed = speed
        this.alpha = 1
    }

    draw() {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }

    update() {
        this.draw()

        // update alpha value
        this.alpha -= 0.01

        // update particle velocity
        this.velocity.x *= 0.99
        this.velocity.y *= 0.99

        // update particle position
        this.x += this.velocity.x * this.speed
        this.y += this.velocity.y * this.speed
    }
}

// implementation
let player
let projectiles
let enemies
let particles
let score
let isGameOver
let timer
let bgRectColor
let enemySpawnInterval
let enemySpeedMultiplier
let minEnemySize
let maxEnemySize

function init() {
    player = new Player(canvas.width / 2, canvas.height / 2, 40, `hsl(202, 100%, 50%)`, {x: 0, y: 0}, 2)
    projectiles = []
    enemies = []
    particles = []
    score = 0
    isGameOver = true
    bgRectColor = 0
    enemySpawnInterval = 1000
    enemySpeedMultiplier = 1
    minEnemySize = 15
    maxEnemySize = 120
    scoreContainer.style.display = 'none'
    gameOverContainer.style.display = 'flex'
    scoreEl.innerHTML = score
    points.innerHTML = score
    clearInterval(timer)
}

function spawnEnemies() {
    timer = setInterval(() => {
        const radius = (maxEnemySize - minEnemySize) * Math.random() + minEnemySize
        let x
        let y
        const randNum = Math.random()
        if (randNum < 0.5) {
            // enemy spawns on bottom or top
            x = canvas.width * Math.random()
            y = Math.random() < 0.5 ? y = -radius : y = canvas.height + radius
        } else {
            // enemy spawns on left or right
            x = Math.random() < 0.5 ? x = -radius : x = canvas.width + radius
            y = canvas.height * Math.random()
        }
        const color = enemyColors[Math.floor(Math.random() * enemyColors.length)]
        const angle = Math.atan2(player.y - y, player.x - x)
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        const speed = 100 / radius * enemySpeedMultiplier

        enemies.push(new Enemy(x, y, radius, color, velocity, speed))
    }, enemySpawnInterval)
}

// animation loop
let animationId
function animate() {
    animationId = requestAnimationFrame(animate)

    ctx.fillStyle = `rgba(${bgRectColor}, ${bgRectColor}, ${bgRectColor}, 0.1)`
    ctx.fillRect(0, 0, innerWidth, innerHeight)
    if (bgRectColor > 0) {
        bgRectColor -= 3
    } else {
        bgRectColor = 0
    }

    projectiles.forEach((projectile, pIndex) => {
        projectile.update()
    
        // remove projectile when out of screen
        if (projectile.x - projectile.radius < 0 || projectile.x + projectile.radius > canvas.width|| projectile.y - projectile.radius < 0 || projectile.y + projectile.radius > canvas.height) {
            projectiles.splice(pIndex, 1)
        }
    })
    enemies.forEach((enemy, eIndex) => {
        enemy.update()

        // handle projectile and enemy collision
        projectiles.forEach((projectile, index) => {
            if (Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) <= projectile.radius + enemy.radius) {
                // spawn particles on hit
                for (let j = 0; j < enemy.radius; j++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 3, enemy.color, {x: (Math.random() - 0.5) * (Math.random() * 10), y: (Math.random() - 0.5) * (Math.random() * 10)}, 1))
                }

                // remove projectile
                setTimeout(() => {
                    projectiles.splice(index, 1)
                }, 0)

                // decrement enemy radius
                if (enemy.radius - projectile.damage >= minEnemySize) {
                    gsap.to(enemy, {
                        duration: .15,
                        ease: "power4.out",
                        radius: enemy.radius - projectile.damage
                    })
                } else {
                    enemy.radius -= projectile.damage
                }

                // enemy death
                if (enemy.radius < minEnemySize) {
                    // flash background white
                    bgRectColor = 180

                    // play death sound effect
                    const deathSoundEFfect = new Audio('./media/explosion-sound-effect.wav')
                    deathSoundEFfect.volume = .15
                    deathSoundEFfect.play()
                    
                    // increment score
                    score += 250
                    scoreEl.innerHTML = score

                    // increase enemy spawn rate
                    enemySpawnInterval -= 2.5

                    // increase enemy speed 
                    enemySpeedMultiplier += 0.005

                    // increase max enemy size
                    maxEnemySize += 1
                    
                    // remove enemy
                    setTimeout(() => {
                        enemies.splice(eIndex, 1)
                    }, 0)
                } else {
                    // play hit sound effect
                    const hitSoundEffect = new Audio('./media/arcade-bling-sound-effect.wav')
                    hitSoundEffect.volume = .1
                    hitSoundEffect.play()

                    // increment score
                    score += 100
                    scoreEl.innerHTML = score

                    // increase enemy spawn rate
                    enemySpawnInterval -= 1

                    // increase enemy speed 
                    enemySpeedMultiplier += 0.001

                    // increase max enemy size
                    maxEnemySize += 0.25
                }
            }
        })

        // game over detection
        if (Math.hypot(player.x - enemy.x, player.y - enemy.y) <= player.radius + enemy.radius) {
            cancelAnimationFrame(animationId)
            scoreContainer.style.display = 'none'
            gameOverContainer.style.display = 'flex'
            points.innerHTML = score
            isGameOver = true

            const arcadeExplosion = new Audio('./media/arcade-game-explosion.wav')
            arcadeExplosion.volume = 0.2
            arcadeExplosion.play()
        }
    })
    particles.forEach((particle, index) => {
        // remove particle when faded
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update()
        }
    })
    player.update()

    // console.log(enemySpawnInterval, enemySpeedMultiplier, maxEnemySize)
    // console.log(keys)
}

init()

// spawn projectile on click
addEventListener('click', (event) => {
    if (!isGameOver) {
        // play shoot sound effect
        const shootSoundEffect = new Audio('./media/small-hit-sound-effect.wav')
        shootSoundEffect.volume = .1
        shootSoundEffect.play()
        
        // spawn projectile
        const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x)
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        projectiles.push(new Projectile(player.x, player.y, 10, `white`, velocity, 4, 15))
    }
})

// player movement logic
addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
        case 'ArrowUp':
            keys.up.pressed = true
            break
        case 'a':
        case 'ArrowLeft':
            keys.left.pressed = true
            break
        case 's':
        case 'ArrowDown':
            keys.down.pressed = true
            break
        case 'd':
        case 'ArrowRight':
            keys.right.pressed = true
    }
})

addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w':
        case 'ArrowUp':
            keys.up.pressed = false
            break
        case 'a':
        case 'ArrowLeft':
            keys.left.pressed = false
            break
        case 's':
        case 'ArrowDown':
            keys.down.pressed = false
            break
        case 'd':
        case 'ArrowRight':
            keys.right.pressed = false
    }
})

// start game
startGameBtn.addEventListener('click', () => {
    init()
    animate()
    spawnEnemies()
    setTimeout(() => {
        isGameOver = false
    }, 100)
    gameOverContainer.style.display = 'none'
    scoreContainer.style.display = 'block'
})