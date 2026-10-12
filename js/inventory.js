export class InventoryManager {
  constructor() {
    this.activeTab = 'carl';
    this.carlGrid = Array(16).fill(null);
    this.donutGrid = Array(16).fill(null);
    this.equipment = { head: null, chest: null, feet: null, weapon: null };
    this.belt = [null, null, null, null];

    // Starting gear
    this.equipment.chest = { name: "Tactical Vest", icon: "🦺", desc: "+10 Armor", armor: 10 };
    this.equipment.feet = { name: "Bare Feet", icon: "🦶", desc: "Carl's famous feet (+5 dex)" };
    this.carlGrid[0] = { name: "Health Potion", icon: "🧪", desc: "Restores 50 HP", type: "potion", heal: 50 };
    this.donutGrid[0] = { name: "Magical Cyan Collar", icon: "💍", desc: "Empowers Donut" };
    this.belt[0] = { name: "Health Potion", icon: "🧪", desc: "Restores 50 HP", type: "potion", heal: 50 };

    this.setupUI();
    this.updateUI();
  }

  setupUI() {
    document.querySelectorAll('.inv-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.activeTab = e.target.dataset.target;
        this.updateUI();
      });
    });

    document.querySelectorAll('.belt-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const idx = parseInt(slot.dataset.slot);
        if (this.belt[idx] && this.belt[idx].type === 'potion') {
          if (window.gameInstance) window.gameInstance.usePotion(this.belt[idx]);
          this.belt[idx] = null;
          this.updateUI();
        }
      });
    });
  }

  updateUI() {
    const gridContainer = document.getElementById('grid-container');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const currentGrid = this.activeTab === 'carl' ? this.carlGrid : this.donutGrid;

    for (let i = 0; i < 16; i++) {
      const slot = document.createElement('div');
      slot.className = 'grid-slot';
      const item = currentGrid[i];
      if (item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inv-item';
        itemDiv.textContent = item.icon;
        itemDiv.title = `${item.name}: ${item.desc}`;
        slot.appendChild(itemDiv);
      }
      gridContainer.appendChild(slot);
    }

    // Equipment Slots
    ['head', 'chest', 'feet', 'weapon'].forEach(eqKey => {
      const eqSlot = document.getElementById(`eq-${eqKey}`);
      if (eqSlot) {
        const item = this.equipment[eqKey];
        eqSlot.innerHTML = `<label>${eqKey.toUpperCase()}</label>` + (item ? item.icon : '');
        if (item) eqSlot.title = `${item.name}: ${item.desc}`;
      }
    });

    // Belt Slots
    for (let i = 0; i < 4; i++) {
      const beltSlot = document.querySelector(`.belt-slot[data-slot="${i}"]`);
      if (beltSlot) {
        beltSlot.innerHTML = `<span>${i+1}</span>`;
        if (this.belt[i]) {
          beltSlot.innerHTML += this.belt[i].icon;
          beltSlot.title = this.belt[i].name;
        }
      }
    }
  }

  addItem(item) {
    const grid = this.activeTab === 'carl' ? this.carlGrid : this.donutGrid;
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]) {
        grid[i] = item;
        this.updateUI();
        return true;
      }
    }
    return false;
  }
}
