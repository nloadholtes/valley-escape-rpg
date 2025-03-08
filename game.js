// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const tileSize = 40;
const mapWidth = 15;
const mapHeight = 10;

// Maps (0 = ground, 1 = wall, 2 = exit)
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
    ]
};

// Player object
let player = {
    x: 1,
    y: 1,
    health: 100,
    attack: 10, // Base attack without weapon
    inventory: [],
    equipped: { weapon: null, armor: null }
};

// Items in the game world
let items = [
    { x: 3, y: 3, map: 'prison', name: 'Rusty Shank', type: 'weapon', damage: 15 },
    { x: 7, y: 5, map: 'prison', name: 'Guard Uniform', type: 'armor', defense: 20 },
    { x: 2, y: 2, map: 'village1', name: 'Rock', type: 'other', damage: 0.1 }
];

// Game state
let gameState = {
    player: player,
    currentMap: 'prison',
    maps: maps,
    items: items,
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

    // Draw items
    gameState.items.forEach(item => {
        if (item.map === gameState.currentMap) {
            ctx.fillStyle = '#ffff00'; // Yellow for items
            ctx.fillRect(item.x * tileSize, item.y * tileSize, tileSize, tileSize);
        }
    });

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
        case 'i': showInventory(); return; // Press 'i' to view inventory
    }

    const tile = currentMap[newY][newX];
    if (tile === 0) {
        player.x = newX;
        player.y = newY;
        checkEncounters();
        checkItems();
        checkStoryTriggers();
    } else if (tile === 2) {
        switchMap();
    }
    draw();
});

// Check for items
function checkItems() {
    const itemIndex = gameState.items.findIndex(i => 
        i.x === player.x && i.y === player.y && i.map === gameState.currentMap
    );
    if (itemIndex !== -1) {
        const item = gameState.items[itemIndex];
        player.inventory.push(item);
        gameState.items.splice(itemIndex, 1); // Remove from world
        updateLog(`Picked up ${item.name}`);
    }
}

// Show inventory and equipment options
function showInventory() {
    let message = 'Inventory:\n';
    player.inventory.forEach((item, index) => {
        const equipped = player.equipped.weapon === item || player.equipped.armor === item ? ' (equipped)' : '';
        message += `${index + 1}. ${item.name}${equipped}\n`;
    });
    message += '\nCommands: "equip <number>" or "unequip <type>" (e.g., "equip 1" or "unequip weapon")';
    updateLog(message);
    promptCommand();
}

// Handle inventory commands
function promptCommand() {
    const command = prompt('Enter command:');
    if (command) {
        const [action, arg] = command.split(' ');
        if (action === 'equip') {
            const index = parseInt(arg) - 1;
            if (index >= 0 && index < player.inventory.length) {
                equipItem(player.inventory[index]);
            }
        } else if (action === 'unequip') {
            unequipItem(arg);
        }
        draw();
    }
}

// Equip an item
function equipItem(item) {
    if (item.type === 'armor') {
        player.equipped.armor = item;
        updateLog(`Equipped ${item.name} as armor (Defense: ${item.defense})`);
    } else {
        // Everything can be a weapon, default damage 0.1 if not specified
        player.equipped.weapon = item;
        const damage = item.damage || 0.1;
        updateLog(`Equipped ${item.name} as weapon (Damage: ${damage})`);
    }
}

// Unequip an item
function unequipItem(type) {
    if (type === 'weapon' && player.equipped.weapon) {
        updateLog(`Unequipped ${player.equipped.weapon.name}`);
        player.equipped.weapon = null;
    } else if (type === 'armor' && player.equipped.armor) {
        updateLog(`Unequipped ${player.equipped.armor.name}`);
        player.equipped.armor = null;
    } else {
        updateLog('Nothing to unequip.');
    }
}

// Check for enemy encounters
function checkEncounters() {
    const enemy = gameState.enemies.find(e => 
        e.x === player.x && e.y === player.y && e.map === gameState.currentMap
    );
    if (enemy) {
        updateLog(`You encounter ${enemy.name}! (Health: ${enemy.health})`);
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

