// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 40;
const mapWidth = 15;
const mapHeight = 10;

// Multiple maps (0 = ground, 1 = wall, 2 = exit to next map)
const maps = {
    prison: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    village1: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 2, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    // Add more maps (e.g., village2, valleyExit) later
};

// Player object
let player = {
    x: 1,
    y: 1,
    health: 100,
    attack: 10,
    inventory: []
};

// Game state
let gameState = {
    player: player,
    currentMap: 'prison',
    maps: maps,
    enemies: [
        { x: 5, y: 5, map: 'prison', name: 'Escaped Prisoner', health: 50, attack: 5 }
    ]
};

// Draw the game world
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentMap = maps[gameState.currentMap];

    // Draw map
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (currentMap[y][x] === 0) {
                ctx.fillStyle = '#d2b48c'; // Ground
            } else if (currentMap[y][x] === 1) {
                ctx.fillStyle = '#555555'; // Wall
            } else if (currentMap[y][x] === 2) {
                ctx.fillStyle = '#00ff00'; // Exit
            }
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }

    // Draw enemies
    gameState.enemies.forEach(enemy => {
        if (enemy.map === gameState.currentMap) {
            ctx.fillStyle = '#ff00ff'; // Magenta for enemies
            ctx.fillRect(enemy.x * tileSize, enemy.y * tileSize, tileSize, tileSize);
        }
    });

    // Draw player
    ctx.fillStyle = '#ff0000'; // Red for player
    ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);
}

// Handle player movement and interactions
document.addEventListener('keydown', (event) => {
    let newX = player.x;
    let newY = player.y;
    const currentMap = maps[gameState.currentMap];

    switch (event.key) {
        case 'ArrowUp': newY--; break;
        case 'ArrowDown': newY++; break;
        case 'ArrowLeft': newX--; break;
        case 'ArrowRight': newX++; break;
    }

    // Check tile type
    const tile = currentMap[newY][newX];
    if (tile === 0) {
        // Move if ground
        player.x = newX;
        player.y = newY;
        checkEncounters();
        checkStoryTriggers();
    } else if (tile === 2) {
        // Switch maps if exit
        switchMap();
    }
    draw();
});

// Check for enemy encounters
function checkEncounters() {
    const enemy = gameState.enemies.find(e => 
        e.x === player.x && e.y === player.y && e.map === gameState.currentMap
    );
    if (enemy) {
        updateLog(`You encounter ${enemy.name}! (Health: ${enemy.health})`);
        // Placeholder for combat later
    }
}

// Story triggers
function checkStoryTriggers() {
    if (gameState.currentMap === 'prison' && player.x === 1 && player.y === 1) {
        updateLog('You wake up in the prison ruins. The earthquake has shattered the walls...');
    } else if (gameState.currentMap === 'village1' && player.x === 1 && player.y === 1) {
        updateLog('You enter a deserted village in the valley. Signs of prisoners linger.');
    }
}

// Switch maps
function switchMap() {
    if (gameState.currentMap === 'prison') {
        gameState.currentMap = 'village1';
        player.x = 1;
        player.y = 1;
        updateLog('You leave the prison and enter the valley.');
    } else if (gameState.currentMap === 'village1') {
        // Add more maps later
        updateLog('You’ve reached the end of this demo!');
    }
}

// Save game
function saveGame() {
    localStorage.setItem('wastelandCloneSave', JSON.stringify(gameState));
    updateLog('Game saved!');
}

// Load game
function loadGame() {
    const savedState = localStorage.getItem('wastelandCloneSave');
    if (savedState) {
        gameState = JSON.parse(savedState);
        player = gameState.player;
        draw();
        updateLog('Game loaded!');
    } else {
        updateLog('No saved game found.');
    }
}

// Update log
function updateLog(message) {
    document.getElementById('game-log').textContent = message;
}

// Initial draw
draw();
