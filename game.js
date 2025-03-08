// game.js
import { Combat } from './combat.js';

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
    name: 'You',
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
    ],
    combat: null
};

let inventoryVisible = false;
let selectedItemIndex = 0;
let awaitingEquipConfirmation = false;
let combatVisible = false;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!combatVisible) {
        const currentMap = maps[gameState.currentMap];

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                ctx.fillStyle = '#000';
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                const emoji = currentMap[y][x] === 1 ? '⬛' :
                             currentMap[y][x] === 0 ? '🟫' :
                             currentMap[y][x] === 2 ? '🟩' : '';
                ctx.font = '24px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#0f0';
                ctx.fillText(emoji, x * tileSize + tileSize / 2, y * tileSize + tileSize / 2);
            }
        }

        gameState.items.forEach(item => {
            if (item.map === gameState.currentMap) {
                ctx.fillStyle = '#000';
                ctx.fillRect(item.x * tileSize, item.y * tileSize, tileSize, tileSize);
                ctx.fillStyle = '#0f0';
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
}

document.addEventListener('keydown', (event) => {
    if (gameState.combat && gameState.combat.isActive) {
        if (event.key === 'r' && gameState.player.health <= 0) restartGame();
        else if (event.key === 'l' && gameState.player.health <= 0) loadGame();
        else handleCombatInput(event);
    } else if (inventoryVisible) {
        handleInventoryInput(event);
    } else {
        handleMapInput(event);
        if (event.key === 'r') restartGame();
        else if (event.key === 'l') loadGame();
    }
});

function handleMapInput(event) {
    let newX = player.x;
    let newY = player.y;
    const currentMap = maps[gameState.currentMap];

    switch (event.key) {
        case 'ArrowUp': newY -= 1; break;
        case 'ArrowDown': newY += 1; break;
        case 'ArrowLeft': newX -= 1; break;
        case 'ArrowRight': newX += 1; break;
        case 'i': toggleInventory(); return;
    }

    if (newY >= 0 && newY < mapHeight && newX >= 0 && newX < mapWidth) {
        const tile = currentMap[newY][newX];
        if (tile === 0) {
            player.x = newX;
            player.y = newY;
            checkItems();
            checkEncounters();
        } else if (tile === 2) {
            switchMap();
        }
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

function handleCombatInput(event) {
    if (!gameState.combat) return;

    const combatState = gameState.combat.getCombatState();
    const currentActor = combatState.currentActor;
    let actionResult;

    switch (event.key) {
        case '1': // Attack
            actionResult = gameState.combat.performAction('attack', gameState.combat.enemies[0]);
            break;
        case '2': // Access Inventory
            actionResult = gameState.combat.performAction('inventory');
            toggleInventory();
            return;
        case '4': // Evade
            actionResult = gameState.combat.performAction('evade');
            break;
        case '5': // Flee
            actionResult = gameState.combat.performAction('flee');
            break;
        case 'y':
            if (gameState.combat.actionQueue.includes('inventory')) {
                actionResult = gameState.combat.performAction('attackAfterInventory', gameState.combat.enemies[0]);
            }
            break;
        case 'n':
            if (gameState.combat.actionQueue.includes('inventory')) {
                gameState.combat.actionQueue = [];
                actionResult = { result: 'Inventory action canceled.', state: gameState.combat.getCombatState() };
            }
            break;
        case 'Escape':
            gameState.combat.endCombat();
            combatVisible = false;
            updateLog('Combat manually ended for testing.');
            toggleCombatUI(false);
            draw();
            return;
    }

    if (actionResult) {
        updateLog(actionResult.result);
        if (actionResult.victory) {
            if (actionResult.victory === 'player' && actionResult.loot) {
                const lootMessage = gameState.combat.loot();
                updateLog(lootMessage);
                promptLootConfirmation();
            } else if (actionResult.defeat) {
                updateLog('Game Over! Press r to restart or l to load a saved game.');
            }
            combatVisible = false;
            toggleCombatUI(false);
            draw();
        } else if (actionResult.state) {
            gameState.combat = new Combat([player], gameState.enemies);
            gameState.combat.startCombat();
            updateCombatUI();
        }
    }
}

function promptLootConfirmation() {
    updateLog('Press y to loot, n to skip.');
    document.addEventListener('keydown', function lootListener(event) {
        if (event.key === 'y') {
            const lootMessage = gameState.combat.loot();
            updateLog(lootMessage);
            document.removeEventListener('keydown', lootListener);
        } else if (event.key === 'n') {
            updateLog('Loot skipped.');
            document.removeEventListener('keydown', lootListener);
        }
        combatVisible = false;
        toggleCombatUI(false);
        draw();
    }, { once: true });
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
    if (enemy && !gameState.combat) {
        gameState.combat = new Combat([player], [enemy]);
        const combatState = gameState.combat.startCombat();
        combatVisible = true;
        toggleCombatUI(true);
        updateLog('Combat initiated!');
        updateCombatUI();
        draw();
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

function restartGame() {
    player = { x: 1, y: 1, health: 100, attack: 10, name: 'You', inventory: [], equipped: { weapon: null, armor: null } };
    gameState = {
        player: player,
        currentMap: 'prison',
        maps: maps,
        items: items,
        enemies: [{ x: 5, y: 5, map: 'prison', name: 'Escaped Prisoner', health: 50, attack: 5 }],
        combat: null
    };
    combatVisible = false;
    toggleCombatUI(false);
    draw();
    updateLog('Game restarted!');
}

function updateLog(message = '') {
    const log = document.getElementById('game-log');
    if (message) {
        const lines = log.textContent.split('\n');
        lines.unshift(message);
        if (lines.length > 10) lines.length = 10;
        log.textContent = lines.join('\n');
    } else if (!combatVisible) {
        log.textContent = `Player at (${player.x}, ${player.y})`;
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
        if (combatVisible) {
            updateCombatUI();
        } else {
            updateLog();
        }
    }
}

function updateInventory(message = '') {
    const inv = document.getElementById('inventory');
    let content = 'ITEM\n';
    player.inventory.forEach((item, index) => {
        const equipped = player.equipped.weapon === item ? ' (weapon)' : 
                        player.equipped.armor === item ? ' (armor)' : '';
        const prefix = index === selectedItemIndex ? '>' : ' ';
        content += `${prefix} ${index + 1}> ${item.default} ${item.name}${equipped}\n`;
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

function toggleCombatUI(show) {
    const log = document.getElementById('game-log');
    const inv = document.getElementById('inventory');
    const options = document.getElementById('combat-options');
    if (show) {
        log.style.display = 'block';
        inv.style.display = 'block';
        options.style.display = 'block';
        options.textContent = '1:ATTACK  2:INVENTORY  4:EVADE  5:FLEE';
    } else {
        log.style.display = 'block'; // Show log for non-combat messages
        inv.style.display = 'none';
        options.style.display = 'none';
        options.textContent = '';
    }
}

function updateCombatUI() {
    const inv = document.getElementById('inventory');
    let content = 'ENEMY\n';
    gameState.enemies.forEach((enemy, index) => {
        content += `${index + 1}> ${enemy.name}  HP ${enemy.health.toFixed(1)}\n`;
    });
    content += '\nNAME     HP  WEAPON          ARMOR\n';
    content += `1> You    ${player.health.toFixed(1)}  ${player.equipped.weapon ? player.equipped.weapon.name : 'None'}  ${player.equipped.armor ? player.equipped.armor.name : 'None'}\n`;
    inv.textContent = content;
}

draw();
updateLog(); // Initialize log on startup
