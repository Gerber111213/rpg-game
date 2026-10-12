const logBox = document.getElementById('log-box');
function logMessage(text, className = '') {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  if (logBox) {
    logBox.appendChild(p);
    logBox.scrollTop = logBox.scrollHeight;
  }
}

export class InventoryManager {
  constructor() {
    this.carlCoins = 100;
    this.carlBag = ['Health Potion (Lesser)', 'Dirty Bandage'];
    this.donutBag = ['Catnip Potion'];
    
    this.setupUI();
  }

  setupUI() {
    this.updateUI();
  }

  addCoins(amount) {
    this.carlCoins += amount;
    logMessage(`[SYNDICATE COIN]: +${amount} coins acquired! Total: ${this.carlCoins} coins.`, 'sys-msg');
    this.updateUI();
  }

  addItem(itemString) {
    this.carlBag.push(itemString);
    logMessage(`[INVENTORY]: Acquired [${itemString}]!`, 'sys-msg');
    this.updateUI();
  }

  updateUI() {
    // Synchronize UI bag grids if modal exists
    const carlBagContainer = document.getElementById('carl-bag');
    if (carlBagContainer) {
      carlBagContainer.innerHTML = '';
      this.carlBag.forEach(item => {
        const slot = document.createElement('div');
        slot.className = 'bag-slot';
        slot.title = item;
        slot.textContent = item.substring(0, 4);
        carlBagContainer.appendChild(slot);
      });
    }
  }
}
