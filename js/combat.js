export class CombatEngine {
  constructor(scene, inventory) {
    this.scene = scene;
    this.inventory = inventory;
  }

  handleCorpseCollapse(monster) {
    monster.corpseLoot = {
      name: "Health Potion",
      icon: "🧪",
      desc: "Brewed monster extract. Restores 50 HP.",
      type: "potion",
      heal: 50
    };
  }

  lootCorpse(monster) {
    if (monster.corpseLoot) {
      const added = this.inventory.addLoot(monster.corpseLoot);
      if (added) {
        const name = monster.corpseLoot.name;
        monster.corpseLoot = null;
        return `Salvaged items into inventory: ${name}!`;
      }
      return `Inventory is full!`;
    }
    return `Corpse already looted.`;
  }
}
