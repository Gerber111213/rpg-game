export class CombatEngine {
  constructor(scene, inventory) {
    this.scene = scene;
    this.inventory = inventory;
  }

  handleCorpseCollapse(monster) {
    const loreLootTable = [
      { name: "Health Potion", icon: "🧪", desc: "Brewed monster extract. Restores 50 HP.", type: "potion", heal: 50 },
      { name: "Boxer Shorts of Fortitude", icon: "🩳", desc: "+10 Armor. Smells slightly like floor cheese.", type: "armor", slot: "torso", defense: 10 },
      { name: "Silver Fox Jacket", icon: "🧥", desc: "+15 Charisma. Princess Donut approves.", type: "armor", slot: "torso", defense: 15 },
      { name: "Shattered-Tendon Dagger", icon: "🗡️", desc: "A wicked goblin blade with serrated edges.", type: "weapon", slot: "mainhand", damage: 18 },
      { name: "Magical Cat Treat", icon: "🐟", desc: "A gourmet salmon morsel for Princess Donut.", type: "treat" }
    ];

    const randomItem = loreLootTable[Math.floor(Math.random() * loreLootTable.length)];
    monster.corpseLoot = { ...randomItem };
  }

  lootCorpse(monster) {
    if (monster.corpseLoot) {
      const added = this.inventory.addItem(monster.corpseLoot);
      if (added) {
        const name = monster.corpseLoot.name;
        monster.corpseLoot = null;
        return `Salvaged ${name} into inventory!`;
      }
      return `Inventory is full!`;
    }
    return `Corpse already looted or empty.`;
  }
}
