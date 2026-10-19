const TILES = {
    0: { name: 'void', solid: true, color: '#050505' },
    1: { name: 'ground', solid: false, color: '#2a2a2a' },
    2: { name: 'building_wall', solid: true, color: '#593b1f' }, // Apartment/Surface ruins
    3: { name: 'street', solid: false, color: '#1a1a1a' },
    4: { name: 'stairwell', solid: false, color: '#ffcc00', isGoal: true } // The way down
};
