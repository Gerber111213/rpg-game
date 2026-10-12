export class CombatEngine {
  constructor(scene, inventoryManager) {
    this.scene = scene;
    this.inventory = inventoryManager;
    this.bloodDecals = [];
  }

  spawnBloodSplatter(x, z) {
    const geo = new THREE.CircleGeometry(Math.random() * 0.7 + 0.5, 12);
    const mat = new THREE.MeshBasicMaterial({ color: 0x770000, side: THREE.DoubleSide });
    const decal = new THREE.Mesh(geo, mat);
    decal.rotation.x = -Math.PI / 2;
    decal.position.set(x, 0.02, z);
    this.scene.add(decal);
    this.bloodDecals.push(decal);
  }

  handleCorpseCollapse(monster) {
    monster.group.rotation.x = Math.PI / 2;
    monster.group.position.y = 0.2;
    this.spawnBloodSplatter(monster.group.position.x, monster.group.position.z);

    // Generate randomized book-accurate loot table
    const possibleLoot = [
      'Goblin Ear Token',
      'Lesser Healing Potion',
      'Rage Ibis Feather Plume',
      'Torn Leather Scrap',
      'Bronze Ring of Agility'
    ];
    
    monster.looted = false;
    monster.loot = {
      coins: Math.floor(Math.random() * 45) + 10,
      item: possibleLoot[Math.floor(Math.random() * possibleLoot.length)]
    };
  }

  lootCorpse(monster) {
    if (monster.looted) {
      return `This corpse has already been looted, Carl.`;
    }
    monster.looted = true;
    
    // Add items & coins to inventory
    this.inventory.addCoins(monster.loot.coins);
    this.inventory.addItem(monster.loot.item);
    
    return `Looted ${monster.loot.coins} coins and [${monster.loot.item}] from ${monster.name}!`;
  }
}
