// js/player.js
const player = {
    x: 1.5,          // Safe open space in the map grid
    y: 1.5,
    angle: 0,        // Facing direction (radians)
    hp: 100,
    maxHp: 100,
    inventory: [
        { id: 'boxers', name: 'Heart-Print Boxer Shorts', type: 'armor', defense: 2 },
        { id: 'crowbar', name: 'Makeshift Crowbar', type: 'weapon', damage: 15 }
    ],
    equippedWeapon: 'crowbar',
    skills: [
        { id: 'taunt', name: 'Primal Scream (Taunt)', cooldown: 0, maxCooldown: 10, desc: 'Draws monster aggro.' },
        { id: 'dash', name: 'Hall Sprint', cooldown: 0, maxCooldown: 5, desc: 'Quick burst of speed.' }
    ]
};

function useSkill(skillId) {
    let skill = player.skills.find(s => s.id === skillId);
    if (skill && skill.cooldown === 0) {
        skill.cooldown = skill.maxCooldown;
        console.log(`Used skill: ${skill.name}`);
    }
}
