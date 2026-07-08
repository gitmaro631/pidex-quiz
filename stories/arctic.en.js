export default {
  items: {
    thermal:  { label: 'Thermal Suit', desc: 'Prevents freezing · maintains body heat' },
    ice_pick: { label: 'Ice Pick',     desc: 'Ice wall climbing · ice fishing' },
    radio:    { label: 'Emergency Radio', desc: 'Broadcasting rescue signal' },
  },
  scenes: {
    blizzard_end: {
      title: 'After the Blizzard',
      text: 'The snow vehicle fell into a crevasse. The blizzard just ended.\n−38°C. The wind cuts skin.\nYou remember the Sejong Antarctic Base is 40km away.\nYou need to use this break in the weather.',
      choices: [
        '[Radio] Contact the base with the emergency radio',
        'Start moving in the direction of the base',
        '[Thermal Suit] Build an ice shelter and prepare to weather another storm',
      ],
      requireDescs: ['No radio. You\'re on your own.', null, 'Building a shelter without a thermal suit risks hypothermia'],
    },
    radio_call: {
      title: 'Radio Contact',
      text: 'A voice through the static.\n"Base here. Coordinates received. Snow vehicle deploying — 90 minutes ETA."\nYou gripped the radio with trembling hands.',
      choices: [
        '[Thermal Suit] Wear the thermal suit and wait for rescue',
        'Burrow into the snow and wait',
      ],
      requireDescs: ['Surviving 90 minutes without a thermal suit is dangerous.', null],
    },
    wait_rescue_thermal: {
      title: 'Rescue Arrives',
      text: 'The thermal suit maintained your body heat.\n85 minutes later, snow vehicle headlights appeared. Base crew came running.',
      endText: 'Survived 90 minutes at −38°C. The radio and thermal suit were lifelines.',
    },
    wait_rescue_bare: {
      title: 'At the Limit',
      text: 'After 30 minutes your hands and feet lost feeling.\nConsciousness dimmed. When the snow vehicle arrived you couldn\'t move your hands.\nYou barely survived.',
      endText: 'You lived — but surviving without a thermal suit was a gamble.',
    },
    ice_shelter: {
      title: 'Snow Shelter',
      text: 'Wearing the thermal suit you dug out an igloo-shaped shelter.\nInternal temperature rose to −15°C. You\'ll make it.\nYou need to move before the next storm.',
      choices: [
        '[Ice Pick] Break through the ice and go ice fishing for food',
        'Wait for the weather to clear then head for the base',
      ],
      requireDescs: ["Can't break through the ice", null],
    },
    ice_fishing: {
      title: 'Antarctic Ice Fishing',
      text: 'You broke through and clear water rose up.\nYou caught fish. Raw, but your strength returned.\nOutside the shelter, a penguin poked its nose in.',
      choices: ['Follow the penguin', 'Start moving toward the base'],
    },
    penguin_follow: {
      title: 'The Penguin\'s Path',
      text: 'The penguin walked 30 minutes to lead you to the top of a coastal cliff.\nBelow, through gaps in the ice — the base antenna is visible!\nThe penguins knew this route.',
      choices: [
        '[Ice Pick] Climb down the cliff to the base',
        'Go around the ice field to find the base entrance',
      ],
      requireDescs: ['Without an ice pick, the cliff is impossible', null],
    },
    cliff_descent: {
      title: 'Cliff Descent',
      text: 'You anchored into the ice wall with the ice pick and descended.\nThe base entrance door is right in front of you.\nYou knocked and the door opened.',
      choices: ['Go inside the base'],
    },
    ice_trek: {
      title: 'Ice Field March',
      text: 'You walk across a plain at −30°C.\nNothing but white to the horizon.\nFour hours later, a red structure far away — the base.\nBut you hear the ice cracking underfoot.',
      choices: [
        '[Ice Pick] Check the ice condition and move carefully',
        'Turn back and find a longer detour',
      ],
      requireDescs: ['You step without checking. The ice breaks.', null],
    },
    safe_crossing: {
      title: 'Safe Crossing',
      text: 'You tapped with the ice pick and only stepped on solid ice.\n20 minutes later you reached a safe zone.\nThe base is 1km ahead.',
      choices: ['Run to the base'],
    },
    detour_path: {
      title: 'Detour',
      text: 'Two more hours of walking. Your strength is bottomed out.\nThe base is visible. Squeeze out your last strength.',
      choices: ['Knock on the base door'],
    },
    ice_crack: {
      title: 'Crevasse',
      text: 'The ice under your feet broke.\nYou fell into cold water.',
      endText: 'Antarctic ice hides dangers invisible to the eye.',
    },
    base_arrive: {
      title: 'Base Arrival',
      text: 'The door opened. Warm air flooded in.\n"I\'m Nikos. Base commander. This is Cheng. We were just about to organize a search."\nHot chocolate was pressed into your hands.',
      endText: 'You walked back from −38°C. The base lights were never more beautiful.',
    },
    hypothermia: {
      title: 'Hypothermia',
      text: 'You shivered — then stopped. The paradoxical warmth of hypothermia arrived.\nYou fell on the snow.',
      endText: 'Antarctica knows how to make you die warm. Insulation was everything.',
    },
  },
};
