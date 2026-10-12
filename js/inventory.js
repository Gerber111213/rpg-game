export class InventoryManager {
  constructor(carlMesh, donutMesh) {
    this.carlMesh = carlMesh;
    this.donutMesh = donutMesh;
    
    this.carlEquipment = { feet: null, torso: 'Leather Vest', mainhand: 'Spiked Club' };
    this.donutEquipment = { neck: 'Pink Sequined Collar', head: 'Ruby Tiara' };
    
    this.carlBag = ['Health Potion (Lesser)', 'Goblin Ear Token', 'Dirty Bandage'];
    this.donutBag = ['Catnip Potion', 'Fancy Hairbrush'];
  }

  equipItem(character, slot, itemName) {
    if (character === 'carl') {
      this.carlEquipment[slot] = itemName;
      this.updateCarlVisuals(slot, itemName);
    } else if (character === 'donut') {
      this.donutEquipment[slot] = itemName;
      this.updateDonutVisuals(slot, itemName);
    }
  }

  updateCarlVisuals(slot, item) {
    if (slot === 'feet' && item) {
      // Attached boot mesh node onto Carl's model
      console.log(`[EQUIP]: Attached ${item} to Carl. Barefoot penalty removed!`);
    }
  }

  updateDonutVisuals(slot, item) {
    console.log(`[EQUIP]: Attached ${item} to Donut.`);
  }
}
