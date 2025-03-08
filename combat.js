// combat.js
class Combat {
    constructor(playerParty, enemies) {
        this.playerParty = playerParty; // Array of player characters (for now, just one)
        this.enemies = enemies; // Array of enemy objects
        this.currentTurn = 0; // Index of current actor (player or enemy)
        this.isActive = false;
        this.actionQueue = []; // To track actions like inventory access
    }

    startCombat() {
        this.isActive = true;
        this.currentTurn = 0;
        this.actionQueue = [];
        console.log('Combat started!');
        return this.getCombatState(); // Return initial state for UI
    }

    endCombat() {
        this.isActive = false;
        this.actionQueue = [];
        console.log('Combat ended!');
    }

    getCombatState() {
        const currentActor = this.currentTurn < this.playerParty.length ? 
            this.playerParty[this.currentTurn] : this.enemies[this.currentTurn - this.playerParty.length];
        return {
            isActive: this.isActive,
            currentActor: currentActor,
            playerParty: this.playerParty,
            enemies: this.enemies,
            turn: this.currentTurn,
            actionQueue: this.actionQueue
        };
    }

    nextTurn() {
        this.currentTurn++;
        if (this.currentTurn >= this.playerParty.length + this.enemies.length) {
            this.currentTurn = 0; // Reset to first actor after all have acted
        }
        this.actionQueue = []; // Clear action queue for new turn
        return this.getCombatState();
    }

    performAction(action, target = null) {
        const actor = this.currentTurn < this.playerParty.length ? 
            this.playerParty[this.currentTurn] : this.enemies[this.currentTurn - this.playerParty.length];
        let result = '';

        switch (action) {
            case 'attack':
                if (!actor.equipped.weapon) {
                    result = `${actor.name} has no weapon!`;
                    break;
                }
                const damage = actor.equipped.weapon.damage || 0.1;
                if (target) {
                    target.health -= damage * (Math.random() * 0.5 + 0.75); // Random damage variation
                    result = `${actor.name} attacks ${target.name} for ${damage.toFixed(1)} damage! ${target.name} has ${target.health.toFixed(1)} health left.`;
                }
                break;
            case 'inventory':
                this.actionQueue.push('inventory');
                result = `${actor.name} is accessing inventory...`;
                break;
            case 'move':
                result = `${actor.name} moves to a better position.`;
                break;
            case 'evade':
                result = `${actor.name} prepares to evade! (50% chance to dodge next attack)`;
                break;
            case 'flee':
                if (Math.random() < 0.5) { // 50% chance to flee
                    result = `${actor.name} flees the encounter!`;
                    this.endCombat();
                } else {
                    result = `${actor.name} fails to flee!`;
                }
                break;
            case 'attackAfterInventory':
                if (this.actionQueue.includes('inventory') && actor.equipped.weapon && target) {
                    const damage = actor.equipped.weapon.damage || 0.1;
                    target.health -= damage * (Math.random() * 0.5 + 0.75);
                    result = `${actor.name} attacks ${target.name} for ${damage.toFixed(1)} damage with new weapon! ${target.name} has ${target.health.toFixed(1)} health left.`;
                    this.actionQueue = [];
                } else {
                    result = `${actor.name} cannot attack without selecting a weapon!`;
                }
                break;
        }

        // Check victory conditions
        if (this.enemies.every(e => e.health <= 0)) {
            result += '\nEnemies defeated! Would you like to loot? (y/n)';
            this.endCombat();
            return { result, victory: 'player', loot: true };
        } else if (this.playerParty.every(p => p.health <= 0)) {
            result += '\nYou have been defeated! Start over or load a saved game.';
            this.endCombat();
            return { result, victory: 'enemy', defeat: true };
        }

        return { result, state: this.nextTurn() };
    }

    loot() {
        if (this.enemies.some(e => e.health <= 0)) {
            const loot = this.enemies.filter(e => e.health <= 0).map(e => ({
                name: `Looted ${e.name}'s ${e.equipped ? e.equipped.name : 'nothing'}`,
                type: e.equipped ? e.equipped.type : 'other',
                damage: e.equipped ? e.equipped.damage : 0,
                defense: e.equipped ? e.equipped.defense : 0,
                image: null,
                default: e.equipped ? e.equipped.default : '🕳️'
            }));
            this.playerParty[0].inventory.push(...loot);
            return `Looted: ${loot.map(l => l.name).join(', ')}`;
        }
        return 'No loot available!';
    }
}

// Export the Combat class for use in game.js
export { Combat };
