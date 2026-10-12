export class InventoryManager {
  constructor() {
    this.activeTab = 'carl'; // 'carl' or 'donut'
    this.carlGrid = Array(24).fill(null);
    this.donutGrid = Array(24).fill(null);
    this.belt = [null, null, null, null]; // Quick slots (e.g., Health Potion)

    // Add starting items
    this.addItemToGrid(this.carlGrid, { name: "Boxers with Pink Hearts", icon: "🩳", desc: "Carl's iconic starting apparel." });
    this.addItemToGrid(this.donutGrid, { name: "Magical Cyan Collar", icon: "💍", desc: "Empowers Princess Donut." });
    this.addItemToGrid(this.carlGrid, { name: "Health Potion", icon: "🧪", desc: "Restores 50 HP.", type: "potion", heal: 50 });
    this.belt[0] = { name: "Health Potion", icon: "🧪", desc: "Restores 50 HP.", type: "potion", heal: 50 };

    this.setupUI();
    this.updateUI();
  }

  addItemToGrid(grid, item) {
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]) {
        grid[i] = item;
        return true;
      }
    }
    return false;
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
          if (window. gameInstance) window.gameInstance.usePotion(this.belt[idx]);
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

    for (let i = 0; i < 24; i++) {
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

    // Update Belt UI
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

  addLoot(item) {
    if (this.addItemToGrid(this.carlGrid, item)) {
      this.updateUI();
      return true;
    }
    return false;
  }
}
