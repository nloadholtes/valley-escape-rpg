// game.js
const canvas = document.getElementById('gameMap');
const ctx = canvas.getContext('2d');
const tileSize = 32;
const mapWidth = 15;
const mapHeight = 10;

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

let player = {
    x: 1,
    y: 1,
    health: 100,
    attack: 10,
    inventory: [],
    equipped: { weapon: null, armor: null }
};

let items = [
    { x: 3, y: 3, map: 'prison', name: 'Rusty Shank', type: 'weapon', damage: 15, image: null, default: '🔪' },
    { x: 7, y: 5, map: 'prison', name: 'Guard Uniform', type: 'armor', defense: 20, image: null, default: '🧥' },
    { x: 2, y: 2, map: 'village1', name: 'Rock', type: 'other', damage: 0.1, image: null, default: '🪨' }
];

let gameState = {
    player: player,
    currentMap: 'prison',
    maps: maps,
    items: items,
    enemies: [
        { x: 5, y: 5, map: 'prison', name: 'Escaped Prisoner', health: 50, attack: 5 }
    ]
};

let inventoryVisible = false;
let selectedItemIndex = 0;
let awaitingEquipConfirmation = false;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentMap = maps[gameState.currentMap];

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            ctx.fillStyle = '#000'; // Background for text
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            const emoji = currentMap[y][x] === 1 ? '⬛' : // Wall
                         currentMap[y][x] === 0 ? '🟫' : // Ground
                         currentMap[y][x] === 2 ? '🟩' : ''; // Exit
            ctx.font = '24px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#0f0'; // Green text to match Wasteland UI
            ctx.fillText(emoji, x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
        }
    }

    gameState.items.forEach(item => {
        if (item.map === gameState.currentMap) {
            ctx.fillStyle = '#000';
            ctx.fillRect(item.x * tileSize, item.y * tileSize, tileSize, tileSize);
            ctx.fillStyle = '#0f0';
            // Use the 'default' emoji if no image is provided
            const display = item.image ? item.image : item.default;
            ctx.fillText(display, item.x * tileSize + tileSize / 2, item.y * tileSize + tileSize / 2);
        }
    });

    gameState.enemies.forEach(enemy => {
        if (enemy.map === gameState.currentMap) {
            ctx.fillStyle = '#000';
            ctx.fillRect(enemy.x * tileSize, enemy.y * tileSize, tileSize, tileSize);
            ctx.fillStyle = '#0f0';
            ctx.fillText('🟪', enemy.x * tileSize + tileSize / 2, enemy.y * tileSize + tileSize / 2);
        }
    });

    ctx.fillStyle = '#000';
    ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);
    ctx.fillStyle = '#0f0';
    ctx.fillText('🟥', player.x * tileSize + tileSize / 2, player.y * tileSize + tileSize / 2);
}

document.addEventListener('keydown', (event) => {
    if (inventoryVisible) {
        handleInventoryInput(event);
    } else {
        handleMapInput(event);
    }
});

function handleMapInput(event) {
    let newX = player.x;
    let newY = player.y;
    const currentMap = maps[gameState.currentMap];

    switch (event.key) {
        case 'ArrowUp': newY--; break;
        case 'ArrowDown': newY++; break;
        case 'ArrowLeft': newX--; break;
        case 'ArrowRight': newX++; break;
        case 'i': toggleInventory(); return;
    }

    const tile = currentMap[newY][newX];
    if (tile === 0) {
        player.x = newX;
        player.y = newY;
        checkItems();
        checkEncounters();
        checkStoryTriggers();
    } else if (tile === 2) {
        switchMap();
    }
    draw();
    updateLog();
}

function handleInventoryInput(event) {
    switch (event.key) {
        case 'ArrowUp':
            selectedItemIndex = Math.max(0, selectedItemIndex - 1);
            updateInventory();
            break;
        case 'ArrowDown':
            selectedItemIndex = Math.min(player.inventory.length - 1, selectedItemIndex + 1);
            updateInventory();
            break;
        case 'Enter':
            if (player.inventory.length > 0 && !awaitingEquipConfirmation) {
                awaitingEquipConfirmation = true;
                updateInventory(`Equip ${player.inventory[selectedItemIndex].name}? (y/n)`);
            }
            break;
        case 'y':
            if (awaitingEquipConfirmation && player.inventory.length > 0) {
                equipItem(player.inventory[selectedItemIndex]);
                awaitingEquipConfirmation = false;
                updateInventory();
            }
            break;
        case 'n':
            if (awaitingEquipConfirmation) {
                awaitingEquipConfirmation = false;
                updateInventory();
            }
            break;
        case 'u':
            const equippedWeapon = player.equipped.weapon ? 'weapon' : player.equipped.armor ? 'armor' : null;
            if (equippedWeapon) {
                unequipItem(equippedWeapon);
            }
            break;
        case 'i':
        case 'Escape':
            toggleInventory();
            awaitingEquipConfirmation = false;
            break;
    }
}

function checkItems() {
    const itemIndex = gameState.items.findIndex(i => 
        i.x === player.x && i.y === player.y && i.map === gameState.currentMap
    );
    if (itemIndex !== -1) {
        const pickedItem = gameState.items[itemIndex];
        player.inventory.push(pickedItem);
        gameState.items.splice(itemIndex, 1);
        updateLog(`Picked up ${pickedItem.name} (${pickedItem.default})`);
    }
}

function checkEncounters() {
    const enemy = gameState.enemies.find(e => 
        e.x === player.x && e.y === player.y && e.map === gameState.currentMap
    );
    if (enemy) {
        updateLog(`You encounter ${enemy.name}! (Health: ${enemy.health})`);
    }
}

function checkStoryTriggers() {
    if (gameState.currentMap === 'prison' && player.x === 1 && player.y === 1) {
        updateLog('You wake up in the prison ruins. The earthquake has shattered the walls...');
    } else if (gameState.currentMap === 'village1' && player.x === 1 && player.y === 1) {
        updateLog('You enter a deserted village in the valley. Signs of prisoners linger.');
    }
}

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

function saveGame() {
    localStorage.setItem('wastelandCloneSave', JSON.stringify(gameState));
    updateLog('Game saved!');
}

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

function updateLog(message = '') {
    const log = document.getElementById('game-log');
    if (message) {
        const lines = log.textContent.split('\n');
        lines.unshift(message);
        lines.unshift('');
        if (lines.length > 10) lines.length = 10;
        log.textContent = lines.join('\n');
    } else {
        log.textContent = `Player at (${player.x}, ${player.y})\n${log.textContent.split('\n').slice(0, 9).join('\n')}`;
    }
}

function toggleInventory() {
    const log = document.getElementById('game-log');
    const inv = document.getElementById('inventory');
    inventoryVisible = !inventoryVisible;
    selectedItemIndex = 0;
    awaitingEquipConfirmation = false;
    if (inventoryVisible) {
        log.style.display = 'none';
        inv.style.display = 'block';
        updateInventory();
    } else {
        log.style.display = 'block';
        inv.style.display = 'none';
        updateLog();
    }
}

function updateInventory(message = '') {
    const inv = document.getElementById('inventory');
    let content = 'ITEM\n';
    player.inventory.forEach((item, index) => {
        const equipped = player.equipped.weapon === item ? ' (weapon)' : 
                        player.equipped.armor === item ? ' (armor)' : '';
        const prefix = index === selectedItemIndex ? '>' : ' ';
        content += `${prefix} ${index + 1}> ${item.default} ${item.name}${equipped}\n`; // Show emoji in inventory
    });
    content += '\nNAME     AC  AMM  MAX  CON  WEAPON\n';
    content += `1> You    0   0    100  10   ${player.equipped.weapon ? player.equipped.weapon.name : 'None'}\n`;
    if (awaitingEquipConfirmation) {
        content += `\nEquip ${player.inventory[selectedItemIndex].name}? (y/n)`;
    }
    inv.textContent = content;
}

function equipItem(item) {
    if (item.type === 'armor') {
        player.equipped.armor = item;
        updateInventory(`Equipped ${item.name} as armor (Defense: ${item.defense})`);
    } else {
        player.equipped.weapon = item;
        const damage = item.damage || 0.1;
        updateInventory(`Equipped ${item.name} as weapon (Damage: ${damage})`);
    }
}

function unequipItem(type) {
    if (type === 'weapon' && player.equipped.weapon) {
        updateInventory(`Unequipped ${player.equipped.weapon.name}`);
        player.equipped.weapon = null;
    } else if (type === 'armor' && player.equipped.armor) {
        updateInventory(`Unequipped ${player.equipped.armor.name}`);
        player.equipped.armor = null;
    } else {
        updateInventory('Nothing to unequip.');
    }
}

draw();
