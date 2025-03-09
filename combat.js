// combat.js
class Combat {
    constructor(playerParty, enemies) {
        this.playerParty = playerParty;
        this.enemies = enemies;
        this.currentTurn = 0;
        this.isActive = false;
        this.actionQueue = [];
        this.roundActions = [];
    }

    startCombat() {
        this.isActive = true;
        this.currentTurn = 0;
        this.actionQueue = [];
        this.roundActions = [];
        console.log('Combat started!');
        return this.getCombatState();
    }

    endCombat() {
        this.isActive = false;
        this.actionQueue = [];
        this.roundActions = [];
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
            actionQueue: this.actionQueue,
            roundActions: this.roundActions
        };
    }

    advanceTurn() {
        this.currentTurn++;
        if (this.currentTurn >= this.playerParty.length + this.enemies.length) {
            this.currentTurn = 0;
            return this.executeRound();
        }

        const state = this.getCombatState();
        if (this.currentTurn >= this.playerParty.length) {
            const enemyAction = this.selectEnemyAction(state.currentActor, this.playerParty.length);
            return { result: enemyAction.result };
        }

        return { result: `Select action for ${state.currentActor.name}` };
    }

    selectAction(actor, action) {
        const actionObj = { actor, action, target: null };
        if (action === 'attack' || action === 'attackAfterInventory') {
            actionObj.target = this.enemies[0];
        }
        this.roundActions.push(actionObj);
        return { result: `${actor.name} chooses to ${action}` };
    }

    selectEnemyAction(enemy, partySize) {
        const fleeChance = partySize > this.enemies.length ? 0.7 : 0.3;
        const action = Math.random() < fleeChance ? 'flee' : 'attack';
        const actionObj = { actor: enemy, action, target: null };
        let result = '';

        if (action === 'attack') {
            const target = this.playerParty[Math.floor(Math.random() * this.playerParty.length)];
            actionObj.target = target;
            result = `${enemy.name} chooses to attack ${target.name}`;
        } else {
            result = `${enemy.name} chooses to flee`;
        }

        this.roundActions.push(actionObj);
        return { result };
    }

    executeRound() {
        let results = [];

        this.roundActions.sort((a, b) => b.actor.agility - a.actor.agility);

        // Execute all actions first
        for (const actionObj of this.roundActions) {
            const { actor, action, target } = actionObj;
            let result = '';

            switch (action) {
                case 'attack':
                    const damage = actor.equipped.weapon ? 
                        actor.equipped.weapon.damage : 
                        actor.strength / 2;
                    if (target) {
                        target.health -= damage * (Math.random() * 0.5 + 0.75);
                        result = `${actor.name} attacks ${target.name} for ${damage.toFixed(1)} damage! ${target.name} has ${target.health.toFixed(1)} health left.`;
                    }
                    break;
                case 'inventory':
                    this.actionQueue.push('inventory');
                    result = `${actor.name} is accessing inventory...`;
                    break;
                case 'evade':
                    const evadeChance = (actor.luck + actor.agility) / 40;
                    if (Math.random() < evadeChance) {
                        result = `${actor.name} successfully evades!`;
                        this.endCombat();
                    } else {
                        result = `${actor.name} fails to evade!`;
                    }
                    break;
                case 'flee':
                    const fleeChance = (actor.luck + actor.agility) / 40;
                    if (Math.random() < fleeChance) {
                        result = `${actor.name} flees the encounter!`;
                        this.endCombat();
                    } else {
                        result = `${actor.name} fails to flee!`;
                    }
                    break;
                case 'attackAfterInventory':
                    if (this.actionQueue.includes('inventory') && actor.equipped.weapon && target) {
                        const damage = actor.equipped.weapon.damage;
                        target.health -= damage * (Math.random() * 0.5 + 0.75);
                        result = `${actor.name} attacks ${target.name} for ${damage.toFixed(1)} damage with new weapon! ${target.name} has ${target.health.toFixed(1)} health left.`;
                        this.actionQueue = [];
                    } else {
                        result = `${actor.name} cannot attack without selecting a weapon!`;
                    }
                    break;
            }

            results.push(result);
        }

        // Check victory or escape conditions after all actions
        if (this.enemies.every(e => e.health <= 0)) {
            results.push('Enemies defeated! Would you like to loot? (y/n)');
            this.endCombat();
            return { result: results.join('\n'), victory: 'player', loot: true };
        } else if (this.playerParty.every(p => p.health <= 0)) {
            results.push('You have been defeated! Start over or load a saved game.');
            this.endCombat();
            return { result: results.join('\n'), victory: 'enemy', defeat: true };
        } else if (!this.isActive) {
            return { result: results.join('\n'), escape: true };
        }

        this.roundActions = [];
        return { result: results.join('\n'), state: this.getCombatState() };
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

export { Combat };

