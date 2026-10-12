export class CombatEngine {
  constructor(scene, inventory) {
    this.scene = scene;
    this.inventory = inventory;
  }

  handleCorpseCollapse(monster) {
    monster.corpseLoot = {
      name: `Looted Remains of ${monster.type}`,
      desc: "Contains crawler salvage, scrap metal, and monster teeth."
    };
  }

  lootCorpse(monster) {
    if (monster.corpseLoot) {
      this.inventory.addItem(monster.corpseLoot);
      const itemTitle = monster.corpseLoot.name;
      monster.corpseLoot = null;
      return `Successfully salvaged items from the corpse: ${itemTitle}!`;
    }
    return `The corpse has already been thoroughly looted.`;
  }
}
