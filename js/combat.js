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
      const added = this.inventory.addItem(monster.corpseLoot);
      if (added) {
        const name = monster.corpseLoot.name;
        monster.corpseLoot = null;
        return `Salvaged ${name} into inventory!`;
      }
      return `Inventory is full!`;
    }
    return `Corpse already looted.`;
  }
}
