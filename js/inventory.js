export class InventoryManager {
  constructor() {
    this.items = [
      { name: "Magical Cyan Collar (Donut)", desc: "Empowers Princess Donut's charisma." },
      { name: "Boxers with Pink Hearts", desc: "Carl's iconic starting apparel." }
    ];
    this.updateUI();
  }

  addItem(item) {
    this.items.push(item);
    this.updateUI();
  }

  updateUI() {
    const list = document.getElementById('inventory-list');
    if (!list) return;
    list.innerHTML = '';
    this.items.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.name}</strong><br><small>${item.desc}</small>`;
      list.appendChild(li);
    });
  }
}
