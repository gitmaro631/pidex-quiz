export default {
  items: {
    dosimeter: { label: 'Dosimeter',  desc: 'Measure radiation · detect safe paths' },
    hazmat:    { label: 'Hazmat Suit', desc: 'Enter hot zones safely · find vehicles' },
    iodine:    { label: 'Iodine',     desc: 'Reduce radiation exposure · restore health' },
  },
  scenes: {
    zone_entry: {
      title: 'Exclusion Zone',
      text: 'A military experiment accident has sealed off a 20km radius.\nYour vehicle stopped from the EMP. The radio is dead.\nAbandoned ruins spread out like a Soviet-era Pripyat.\n15km to the outer checkpoint. Radiation is being measured.',
      choices: [
        '[Dosimeter] Measure the safe direction with the dosimeter',
        '[Hazmat Suit] Put on the hazmat suit and enter the northern factory zone',
        'Follow the ruins outskirts toward the checkpoint',
      ],
      requireDescs: ['Unknown radiation levels. No idea where is safe.', 'The factory zone without a hazmat suit is lethal radiation.', null],
    },
    safe_path_found: {
      title: 'Safe Route',
      text: 'The dosimeter alarmed. North is dangerous. East is relatively low.\nThrough the eastern forest to the checkpoint is 8km.\nWithout the dosimeter you never would have known this route.',
      choices: [
        '[Iodine] Take iodine and enter the forest route',
        'Carefully pass through the forest route',
      ],
      requireDescs: ['The forest route is dangerous without iodine', null],
    },
    forest_shortcut: {
      title: 'Forest Route',
      text: 'Trees grow in deformed shapes. Silence.\nYou stepped only on ground where the dosimeter showed low readings.\n3 hours later, the checkpoint fence is visible.',
      choices: ['Run toward the checkpoint'],
    },
    factory_zone: {
      title: 'Factory Zone',
      text: 'The hazmat suit blocked the radiation.\nInside the abandoned factory, there\'s a running vehicle.\nThe battery is alive — someone was here recently.',
      choices: [
        'Drive to the checkpoint',
        'Search the factory further',
      ],
    },
    factory_search: {
      title: 'Inside the Factory',
      text: 'A radio on a shelf. You tuned the frequency.\n"...Military checkpoint here. Respond if anyone hears this."\nYou transmitted your location.',
      choices: [
        'Wait in the factory for the rescue team',
        'Drive out yourself',
      ],
    },
    vehicle_escape: {
      title: 'Vehicle Escape',
      text: 'The dusty military jeep started up.\nYou drove full speed to the checkpoint.\nSoldiers came running at the barricade.',
      endText: 'The hazmat suit opened the hot zone. The vehicle completed the escape.',
    },
    outskirts_path: {
      title: 'Outskirts March',
      text: 'You went around the ruins outskirts.\nLower contamination, but exposure time is growing.\nA research container is visible.',
      choices: [
        'Go inside the container',
        'Keep moving toward the checkpoint',
      ],
    },
    research_container: {
      title: 'Research Container',
      text: '"I\'m Nikos. Radiation environment research team. This is Cheng."\n"We have spare hazmat suits. We have a vehicle too."\nCheng handed over the keys and told you the checkpoint route.',
      choices: ['Escape together'],
    },
    success_researcher_escape: {
      title: 'Escape',
      text: 'You reached the checkpoint in Nikos and Cheng\'s vehicle.\n"We need to finish the research. The data matters." The two went back into the zone.',
      endText: 'There were people even in the radiation zone. An unexpected companion opened the exit.',
    },
    daylong_march: {
      title: 'Full-Day March',
      text: 'Radiation is accumulating as you walk.\nNausea sets in.',
      choices: [
        '[Iodine] Take iodine to reduce exposure',
        'Don\'t stop — keep moving',
      ],
      requireDescs: ['No iodine. Symptoms worsen.', null],
    },
    iodine_recovery: {
      title: 'Iodine',
      text: 'Symptoms eased. Your body came back to life a little.\nThe checkpoint fence is starting to appear.',
      choices: ['Head to the checkpoint'],
    },
    push_through: {
      title: 'Push Through',
      text: 'You walked through the nausea.\nThe fence is visible. Squeeze out your last strength.\nSoldiers came running.',
      choices: ['Arrive just before collapsing'],
    },
    radiation_sickness: {
      title: 'Radiation Sickness',
      text: 'Nausea, headaches, convulsions.\nYou can no longer walk.',
      endText: 'Radiation is invisible. That\'s what makes it more terrifying.',
    },
    success_checkpoint: {
      title: 'Checkpoint',
      text: 'You shouted past the fence.\nSoldiers ran out. They put a hazmat suit on you and loaded you into a vehicle.\nYou received a full-body scan at the decontamination station.\n"You were lucky."',
      endText: 'You fought an invisible enemy. The right decisions were faster than the radiation.',
    },
    success_factory_rescue: {
      title: 'Rescue Team Arrives',
      text: '20 minutes later, soldiers in hazmat suits came in.\n"How did you get inside here?"\nYou were evacuated by helicopter.',
      endText: 'One radio transmission became the exit. The hazmat suit made that opportunity possible.',
    },
  },
};
