export default {
  items: {
    patch:  { label: 'Repair Patch',  desc: 'Temporary pressure seal' },
    tether: { label: 'Safety Tether', desc: 'Space movement · anchoring' },
    tablet: { label: 'Data Tablet',   desc: 'System access · navigation' },
  },
  scenes: {
    impact_alert: {
      title: 'Impact Alert',
      text: 'A crash shook the station. Asteroid debris.\nConnecting corridor B-7 of ISS-2 is damaged.\nThe escape pod is in Section D. You need to bypass B-7.\nPressure is venting. There\'s no time.',
      choices: [
        '[Patch] Temporarily seal the breach and move through the corridor',
        'Move to the communications room and send a distress signal',
        'Go through the airlock into open space',
      ],
      requireDescs: ['Pressure keeps venting. Can\'t pass.', null, null],
    },
    patched_corridor: {
      title: 'Temporary Seal',
      text: 'You stuck the repair patch over the crack. Pressure stabilized.\nYou moved quickly through the corridor and stood at the Section D entrance.\nThe escape pod door is visible.',
      choices: ['Board the escape pod'],
    },
    comms_room: {
      title: 'Communications Room',
      text: 'The communications system is half-damaged.\nSending a standard distress signal will take at least 72 hours for a response.\nBut if you have the tablet, there might be another way.',
      choices: [
        '[Tablet] Hack the autopilot nav beacon and amplify the signal',
        'Send the standard distress signal and move toward the escape pod',
      ],
      requireDescs: ['Standard signal sent. 72 hours for response.', null],
    },
    tablet_hack: {
      title: 'Beacon Amplification',
      text: 'You accessed the navigation satellite beacon protocol through the tablet.\nYou boosted signal strength 100×.\nTwelve minutes later, a response. "Mission Control here, this is Nikos. Move to the pod. Recovery prep underway."',
      choices: ['Move toward the escape pod'],
    },
    airlock_approach: {
      title: 'Airlock',
      text: 'You stood at the airlock. There\'s a route: go into space and travel along the outer hull back to the Section D airlock.\nBut going without a tether means drifting.',
      choices: [
        '[Tether] Hook the tether and begin EVA',
        'Too risky. Head to the communications room.',
      ],
      requireDescs: ['Without a tether you\'ll drift into space.', null],
    },
    spacewalk: {
      title: 'Spacewalk',
      text: 'The airlock opened. Earth spread out before your eyes.\nYou hooked the tether to the outer hull rail and moved.\n300 meters along the hull to the Section D airlock.\nThrough the windows, Earth\'s day and night alternated.',
      choices: ['Enter the Section D airlock'],
    },
    main_corridor: {
      title: 'Main Corridor',
      text: 'Moving through the corridor, another pressure warning went off near the B-7 damage zone.\nThe entire corridor will depressurize soon.',
      choices: [
        '[Patch] Seal the new crack',
        'Sprint to Section D',
      ],
      requireDescs: ['Can\'t seal it. Pressure drops rapidly.', null],
    },
    corridor_dash: {
      title: 'Sprint',
      text: 'You sprinted down the depressurizing corridor.\nYour ears are popping. The Section D door is visible.\nWith your last strength you pulled the door open.',
      choices: ['Board the escape pod'],
    },
    oxygen_depleting: {
      title: 'Oxygen Depleting',
      text: 'You waited at the airlock, but pressure kept dropping.\nConsciousness fades.',
      endText: 'Space does not allow waiting without oxygen.',
    },
    escape_pod_launch: {
      title: 'Escape Pod',
      text: 'You entered the pod. You entered the launch sequence.\nMission Control: "Escape pod confirmed. Reentry clearance granted."\nThe countdown began.',
      choices: ['Press the launch button'],
    },
    success_reentry: {
      title: 'Atmospheric Reentry',
      text: 'Flames flickered at the pod window. Atmospheric reentry.\nParachutes deployed. Ocean below.\nA boat approached from the naval vessel.',
      endText: 'Earth was never this beautiful. You came back alive.',
    },
    vacuum_death: {
      title: 'Vacuum',
      text: 'Pressure dropped to zero. It was instant.',
      endText: 'Space does not give mistakes a second chance.',
    },
  },
};
