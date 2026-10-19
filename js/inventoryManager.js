export class InventoryManager {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.carlBag = Array(12).fill(null);
    this.donutBag = Array(12).fill(null);
    this.draggedItem = null;
    this.dragSource = null;

    // Starting Gear & Items
    this.carlBag[0] = { name: "Health Potion", icon: "🧪", desc: "Restores 50 HP.", type: "potion", heal: 50 };
    this.carlBag[1] = { name: "Spiked Club", icon: "🏏", desc: "A sturdy wooden club with rusty nails.", damage: 12 };
    this.donutBag[0] = { name: "Magical Cat Treat", icon: "🐟", desc: "Princess Donut's favorite snack.", type: "treat" };

    this.setupTooltip();
    this.updateUI();
  }

  setupTooltip() {
    this.tooltip = document.getElementById('item-tooltip');
  }

  showTooltip(item, e) {
    if (!this.tooltip || !item) return;
    document.getElementById('tooltip-title').textContent = item.name;
    document.getElementById('tooltip-desc').textContent = item.desc;
    this.tooltip.style.left = `${e.clientX + 12}px`;
    this.tooltip.style.top = `${e.clientY + 12}px`;
    this.tooltip.classList.remove('hidden');
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.classList.add('hidden');
  }

  updateUI() {
    // Populate Carl's Bag
    const carlBagEl = document.getElementById('carl-bag');
    if (carlBagEl) {
      carlBagEl.innerHTML = '';
      this.carlBag.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'bag-slot';
        slot.dataset.index = index;
        slot.dataset.bag = 'carl';

        if (item) {
          slot.textContent = item.icon;
          slot.draggable = true;

          slot.addEventListener('dragstart', (e) => {
            this.draggedItem = item;
            this.dragSource = { bag: 'carl', index };
          });

          slot.addEventListener('mousemove', (e) => this.showTooltip(item, e));
          slot.addEventListener('mouseleave', () => this.hideTooltip());

          slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.game && this.game.showContextMenu) {
              this.game.showContextMenu(e.clientX, e.clientY, item, 'carl', index);
            }
          });
        }

        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          this.handleDrop('carl', index);
        });

        carlBagEl.appendChild(slot);
      });
    }

    // Populate Donut's Bag
    const donutBagEl = document.getElementById('donut-bag');
    if (donutBagEl) {
      donutBagEl.innerHTML = '';
      this.donutBag.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'bag-slot';
        slot.dataset.index = index;
        slot.dataset.bag = 'donut';

        if (item) {
          slot.textContent = item.icon;
          slot.draggable = true;

          slot.addEventListener('dragstart', (e) => {
            this.draggedItem = item;
            this.dragSource = { bag: 'donut', index };
          });

          slot.addEventListener('mousemove', (e) => this.showTooltip(item, e));
          slot.addEventListener('mouseleave', () => this.hideTooltip());
        }

        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          this.handleDrop('donut', index);
        });

        donutBagEl.appendChild(slot);
      });
    }

    // Update Quick Belt
    for (let i = 0; i < 4; i++) {
      const beltSlot = document.querySelector(`.belt-slot[data-slot="${i}"]`);
      if (beltSlot) {
        beltSlot.innerHTML = `<span>${i+1}</span>`;
        const item = this.carlBag[i];
        if (item) {
          beltSlot.innerHTML += item.icon;
          beltSlot.onclick = () => {
            if (item.type === 'potion' && this.game) {
              this.game.usePotion(item, i);
            }
          };
        }
      }
    }
  }

  handleDrop(targetBagName, targetIndex) {
    if (!this.dragSource) return;
    const sourceBag = this.dragSource.bag === 'carl' ? this.carlBag : this.donutBag;
    const targetBag = targetBagName === 'carl' ? this.carlBag : this.donutBag;

    const temp = targetBag[targetIndex];
    targetBag[targetIndex] = this.draggedItem;
    sourceBag[this.dragSource.index] = temp;

    this.draggedItem = null;
    this.dragSource = null;
    this.updateUI();
  }

  addItem(item) {
    const emptyIndex = this.carlBag.indexOf(null);
    if (emptyIndex !== -1) {
      this.carlBag[emptyIndex] = item;
      this.updateUI();
      return true;
    }
    return false;
  }

  removeItem(bagName, index) {
    const bag = bagName === 'carl' ? this.carlBag : this.donutBag;
    bag[index] = null;
    this.updateUI();
  }
}
