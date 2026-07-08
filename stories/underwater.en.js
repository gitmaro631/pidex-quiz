export default {
  items: {
    toolkit: { label: 'Tool Kit',       desc: 'Opening hatches · sealing cracks' },
    flare:   { label: 'Underwater Flare', desc: 'Signaling · underwater lighting' },
    oxy:     { label: 'Emergency Oxygen', desc: 'Extended breathing · buoyancy' },
  },
  scenes: {
    emergency_room: {
      title: 'Emergency Alert',
      text: 'Magnitude 5.8 earthquake. Section B of deep-sea research base Neptune-7 is flooding.\nThe alarm is sounding. Section C where you are still has pressure.\nThe escape submersible is in the Section A docking bay. Two routes available.',
      choices: [
        'Move through the flooded corridor to Section A',
        '[Tool Kit] Open the control panel and restore emergency systems',
        'Exit through the emergency escape hatch to the outer hull',
      ],
      requireDescs: [null, 'No tool to open the panel cover', null],
    },
    control_panel: {
      title: 'Control Panel',
      text: 'Inside the control panel, you can see a manual valve.\nYou activated the emergency drain pump — the water level in the flooded corridor starts dropping.\nThe elevator is restored too. Twenty seconds to Section A.',
      choices: ['Take the elevator to the Section A docking bay'],
    },
    flooded_corridor: {
      title: 'Flooded Corridor',
      text: 'The corridor is waist-deep. The water level keeps rising.\nHalfway through, the ceiling above you collapsed. The path is blocked.\nAn emergency air pocket is visible.',
      choices: [
        '[Oxygen] Use the oxygen tank as buoyancy and float up through the ventilation shaft',
        'Find another way inside the air pocket',
      ],
      requireDescs: ['No oxygen. You drown.', null],
    },
    oxy_float: {
      title: 'Oxygen Buoyancy',
      text: 'You opened the oxygen valve and pulled the tank beneath you.\nThe tank rapidly generated buoyancy. You shot upward.\nThrough the ceiling ventilation shaft you emerged into Section A.',
      choices: ['Move to the docking bay'],
    },
    air_pocket: {
      title: 'Unexpected Company',
      text: 'Two people were already in the air pocket.\n"I\'m Nikos. Marine geology research team. This is Cheng."\nCheng is pulling out a waterproof satellite terminal.\n"A rescue submarine is already approaching. Just wait here."',
      choices: ['Wait for rescue with Nikos and Cheng'],
    },
    pocket_rescue: {
      title: 'Rescue Submarine',
      text: 'Thirty minutes later, a rescue submarine docked.\nThe hatch opened. Nikos grabbed your hand.\n"We\'ll close Neptune-7. Go ahead."\nThe two stayed behind in the base.',
      endText: 'Two people were in the flooded air pocket. Like fate, and like a mission.',
    },
    outer_hull: {
      title: 'Outer Hull',
      text: 'You opened the emergency hatch. Pressure changed and your ears popped.\nYou need to move along the outer hull. 180m depth. Pitch black all around.',
      choices: [
        '[Oxygen] Breathe from the tank and move along the hull to the docking bay',
        '[Flare] Set off the flare underwater',
      ],
      requireDescs: ['No oxygen at 180m depth. You drown.', 'No signal possible. Return to base.'],
    },
    flare_underwater: {
      title: 'Underwater Signal',
      text: 'The underwater flare went off. Even at 180m depth, light spread.\nA standby rescue submarine detected the light.\nFifteen minutes later, a hatch opened.',
      choices: ['Board the rescue submarine'],
    },
    hull_swim: {
      title: 'Hull Transit',
      text: 'You put on the oxygen mask and moved along the hull.\nThe external hatch of the docking bay is visible. It must be opened manually.',
      choices: [
        '[Tool Kit] Force the hatch open with the tools',
        '[Flare] Shine the flare at the docking bay window',
      ],
      requireDescs: ['The hatch won\'t open. Oxygen runs out.', 'Nothing. Only the oxygen depletes.'],
    },
    docking_bay: {
      title: 'Docking Bay',
      text: 'You stood before the escape submersible.\nYou entered the emergency code — it started up.\nThe hatch opened and the dark deep sea spread out.',
      choices: ['Pilot the escape submersible to the surface'],
    },
    engine_room: {
      title: 'Engine Room',
      text: 'You found the emergency generator. A little fuel remains.\nYou can direct power to the emergency signal transmitter.',
      choices: ['[Tool Kit] Connect the wiring and activate the signal transmitter'],
      requireDescs: ['No tool to connect the wiring'],
    },
    emergency_signal: {
      title: 'Emergency Signal',
      text: 'The signal was transmitted to the surface.\nSix hours later a rescue submarine docked.',
      choices: ['Board the rescue submarine'],
    },
    success_sub: {
      title: 'Breaking the Surface',
      text: 'You burst through to the surface. Sunlight was blinding.\nA coast guard vessel was waiting 200 meters away.\n"Neptune-7 survivor confirmed!"',
      endText: 'You came up alive from 180 meters deep. You never knew light could be this beautiful.',
    },
    drowning: {
      title: 'Drowning',
      text: 'Your oxygen ran out. Cold water in the dark filled your lungs.',
      endText: 'The deep sea does not allow you to remain without oxygen.',
    },
  },
};
