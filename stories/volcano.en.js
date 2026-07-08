export default {
  items: {
    gas_mask: { label: 'Gas Mask',      desc: 'Blocks volcanic gas' },
    rope:     { label: 'Rope',          desc: 'Cliff rappel · lava field crossing' },
    mirror:   { label: 'Signal Mirror', desc: 'Signal to passing ships' },
  },
  scenes: {
    eruption_caught: {
      title: 'Eruption',
      text: 'A deafening roar from the center of the island.\nA sudden eruption. You were here on a research survey.\nLava is flowing down the eastern slope.\nYou need to reach the coast. Two routes.',
      choices: [
        'Follow the northern coastal path',
        '[Rope] Rappel down the western cliff directly to the coast',
        '[Mirror] Signal immediately to ships passing at sea',
      ],
      requireDescs: [null, 'The cliff is too dangerous without a rope', 'No way to signal'],
    },
    mirror_signal_sea: {
      title: 'Sea Signal',
      text: 'You reflected light from the coastal cliff with the mirror.\n5 minutes later, a fishing boat 2km away changed course.\nA boat came down. "What\'s happening? The island was smoking."',
      endText: 'A mirror linked an island and the sea. Escaped 20 minutes after eruption began.',
    },
    cliff_rappel: {
      title: 'Cliff Rappel',
      text: 'You hooked the rope on a rock and rappelled down.\nBelow, a small coastal cave.\nWaves don\'t reach inside — it\'s safe.',
      choices: [
        '[Mirror] Signal passing boats from the cave entrance',
        'Rest in the cave and decide your next move',
      ],
      requireDescs: ['No signal. Wait for a boat.', null],
    },
    cove_signal: {
      title: 'Cave Signal',
      text: 'You flashed the mirror between waves.\nA fishing boat turned back.\n"The eruption started and you were still on the island?!"',
      endText: 'A hidden cave under the cliff was the refuge. Rope and mirror were the lifelines.',
    },
    cove_shelter: {
      title: 'Coastal Cave',
      text: 'The cave is cool inside.\nWave sounds mix with distant explosions.\nLava blocked the east. You need to get to the western coast.',
      choices: ['Move along the coast to the western shore'],
    },
    coast_path: {
      title: 'Coastal Path',
      text: 'You moved along the northern coast.\nSuddenly volcanic gas rolled in.\nSulfur smell. Your eyes sting and you\'re coughing.',
      choices: [
        '[Gas Mask] Put on the mask and push through',
        'Hold your shirt over your nose and sprint through',
        'Turn back and find another route',
      ],
      requireDescs: ['No way to block the gas. Your lungs burn.', null, null],
    },
    gas_passage: {
      title: 'Through the Gas',
      text: 'The gas mask blocked everything.\n10 minutes later you emerged into clean air.\nThe western coast is right ahead.',
      choices: ['Head out to the western coast'],
    },
    dash_through_gas: {
      title: 'Full Sprint',
      text: 'You held your breath and ran. 30 seconds felt too long.\nYou reached the coast but can\'t stop coughing.\nYour lungs are damaged.',
      choices: ['Signal from the coast'],
    },
    inland_detour: {
      title: 'Inland Detour',
      text: 'You went around the lava field. The heat is intense.\nA research hut is visible. Two people inside.',
      choices: ['Head to the hut'],
    },
    volcanologist_meet: {
      title: 'Volcanologists',
      text: '"I\'m Nikos. Volcanologist. This is Cheng."\n"We need to evacuate too. We have an inflatable boat. Come with us."\nCheng pulled out two more gas masks.',
      choices: ['Escape by boat'],
    },
    west_coast: {
      title: 'Western Coast',
      text: 'You reached the western coast.\nFishing boats are visible far beyond the waves.\nYou need to signal.',
      choices: [
        '[Mirror] Signal the fishing boats with the mirror',
        '[Gas Mask + Rope] Put on the gas mask, rappel the cliff, and jump into the waves',
        'Wait on the coast for a boat',
      ],
      requireDescs: ['No signal. The boats pass.', 'Need both gas mask and rope', null],
    },
    ocean_swim: {
      title: 'Sea Escape',
      text: 'You fixed the rope to the cliff and went down into the waves.\nYou swam with the gas mask blocking gas.\nA fishing boat came closer.',
      choices: ['Grab onto the fishing boat'],
    },
    wait_coast: {
      title: 'Waiting',
      text: 'The next day, a boat approached.\n"We came to check — there was a lot of smoke from the island."',
      choices: ['Board the boat'],
    },
    gas_death: {
      title: 'Volcanic Gas',
      text: 'Sulfur gas filled your lungs.\nThere was no gas mask.',
      endText: 'Volcanic gas attacks the lungs before the smell does.',
    },
    lava_death: {
      title: 'Lava',
      text: 'Lava blocked the path. Too late.',
      endText: 'Lava doesn\'t wait.',
    },
    success_boat_escape: {
      title: 'Escape',
      text: 'You got out of the island on the inflatable boat.\nLooking back, the island\'s center was shooting a column of fire.\n"Got all the data." Cheng held up a tablet.',
      endText: 'You got out of an erupting volcanic island. With the data too.',
    },
    success_rescue_boat: {
      title: 'Sea Rescue',
      text: 'You watched the island from the deck.\nLava was rewriting the coastline.\nOne more hour and there would have been no way out.',
      endText: 'A volcanic island lives on geological time. Human time was a gap in between.',
    },
  },
};
