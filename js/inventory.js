export class InventoryManager {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.activeTab = 'carl';
    this.carlGrid = Array(192).fill(null); // 24 rows * 8 cols = 192 slots
    this.donutGrid = Array(192).fill(null);
    this.equipment = { head: null, chest: null, pants: null, boots: null, gloves: null, weapon: null, ring1: null, ring2: null };
    this.belt = [null, null, null, null];

    // Starting items & stats
    this.equipment.chest = { name: "Tactical Vest", icon: "🦺", desc: "Military-grade protection.", armor: 15, str: 5 };
    this.equipment.pants = { name: "Boxers with Pink Hearts", icon: "🩳", desc: "Carl's iconic starting apparel.", armor: 2, dex: 3 };
    this.equipment.boots = { name: "Bare Feet", icon: "🦶", desc: "Legendary indestructible feet.", damage: 10 };
    this.carlGrid[0] = { name: "Health Potion", icon: "🧪", desc: "Restores 50 HP.", type: "potion", heal: 50 };
    this.belt[0] = { name: "Health Potion", icon: "🧪", desc: "Restores 50 HP.", type: "potion", heal: 50 };
    this.donutGrid[0] = { name: "Magical Cyan Collar", icon: "💍", desc: "Empowers Donut's charisma.", magic: 15 };

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

    // Tooltip element creation
    if (!document.getElementById('item-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.id = 'item-tooltip';
      tooltip.className = 'hidden';
      tooltip.innerHTML = `<div id="tooltip-title"></div><div id="tooltip-desc"></div><div id="tooltip-stats"></div>`;
      document.body.appendChild(tooltip);
    }
  }

  showTooltip(item, e) {
    const tip = document.getElementById('item-tooltip');
    if (!tip || !item) return;
    document.getElementById('tooltip-title').textContent = item.name;
    document.getElementById('tooltip-desc').textContent = item.desc;
    let statsStr = '';
    if (item.armor) statsStr += `Armor: +${item.armor}\n`;
    if (item.damage) statsStr += `Damage: +${item.damage}\n`;
    if (item.str) statsStr += `Strength: +${item.str}\n`;
    if (item.magic) statsStr += `Magical Properties: +${item.magic}\n`;
    document.getElementById('tooltip-stats').textContent = statsStr;

    tip.style.left = `${e.clientX + 15}px`;
    tip.style.top = `${e.clientY + 15}px`;
    tip.classList.remove('hidden');
  }

  hideTooltip() {
    const tip = document.getElementById('item-tooltip');
    if (tip) tip.classList.add('hidden');
  }

  updateUI() {
    const gridContainer = document.getElementById('grid-container');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const currentGrid = this.activeTab === 'carl' ? this.carlGrid : this.donutGrid;

    for (let i = 0; i < currentGrid.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'grid-slot';
      const item = currentGrid[i];
      if (item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inv-item';
        itemDiv.textContent = item.icon;
        itemDiv.addEventListener('mousemove', (e) => this.showTooltip(item, e));
        itemDiv.addEventListener('mouseleave', () => this.hideTooltip());
        
        // Drag and drop event binding
        itemDiv.draggable = true;
        itemDiv.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ index: i, source: 'grid', tab: this.activeTab }));
        });

        slot.appendChild(itemDiv);
      }
      gridContainer.appendChild(slot);
    }

    // Update Paperdoll Equipment Slots
    Object.keys(this.equipment).forEach(eqKey => {
      const eqSlot = document.getElementById(`eq-${eqKey}`);
      if (eqSlot) {
        const item = this.equipment[eqKey];
        eqSlot.innerHTML = `<span>${eqKey.toUpperCase()}</span>` + (item ? item.icon : '');
        if (item) {
          eqSlot.onmousemove = (e) => this.showTooltip(item, e);
          eqSlot.onmouseleave = () => this.hideTooltip();
        } else {
          eqSlot.onmousemove = null;
          eqSlot.onmouseleave = null;
        }
      }
    });

    // Update Belt
    for (let i = 0; i < 4; i++) {
      const beltSlot = document.querySelector(`.belt-slot[data-slot="${i}"]`);
      if (beltSlot) {
        beltSlot.innerHTML = `<span>${i+1}</span>`;
        if (this.belt[i]) {
          beltSlot.innerHTML += this.belt[i].icon;
          beltSlot.onmousemove = (e) => this.showTooltip(this.belt[i], e);
          beltSlot.onmouseleave = () => this.hideTooltip();
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
