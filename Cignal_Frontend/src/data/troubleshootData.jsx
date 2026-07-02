// src/data/troubleshootData.jsx

const createHdIssues = () => [
  {
    id: "e1-e2-e11",
    shortTitle: "E1 / E2 / E11",
    description: "Smart Card or Access Issue",
    sections: [
      {
        title: "Perform a Hard Reset",
        steps: [
          "Turn off the box using the remote or front panel.",
          "Unplug the power cord from the outlet.",
          "Wait for about 10–15 seconds.",
          "Plug the box back in and let it start up."
        ]
      },
      {
        title: "Remove & Clean the Smart Card",
        steps: [
          "Pull out the Smart Card from the slot.",
          "Use a clean, dry cloth to gently wipe the gold chip.",
          "Reinsert the Smart Card with the chip facing downward.",
          "Ensure it is fully pushed inside the slot."
        ]
      },
      {
        title: "Check Smart Card Pairing",
        steps: [
          "Menu → System Information → Conditional Access.",
          "Verify Subscriber ID matches the Smart Card.",
          "If mismatched, contact support."
        ]
      }
    ],
    note: "If the error remains after troubleshooting, please contact support."
  },

  {
    id: "e4-e6-e14",
    shortTitle: "E4 / E6 / E14",
    description: "Technical or Service Issue",
    sections: [
      {
        title: "Restart the Box",
        steps: [
          "Turn off the box.",
          "Disconnect the power plug.",
          "Wait for 15 seconds and reconnect.",
          "Check if the error clears."
        ]
      },
      {
        title: "Check Signal Level",
        steps: [
          "Menu → System Setup → Installation → Signal Test.",
          "Ensure signal strength and quality are acceptable."
        ]
      }
    ],
    note:
      "These errors often relate to signal problems. Contact support if issue continues."
  },

  {
    id: "missing-channels",
    shortTitle: "Missing / Skipping Channels",
    description: "Incomplete or missing channels",
    sections: [
      {
        title: "Check Signal Quality",
        steps: [
          "Press Menu → Installation → Signal Test.",
          "Ensure both strength and quality are acceptable."
        ]
      },
      {
        title: "Perform Channel Scan",
        steps: [
          "Menu → Installation → Manual Scan.",
          "Select 'Default TP' and press OK."
        ]
      }
    ],
    note:
      "If channels still do not appear, it may relate to account subscription."
  },

  {
    id: "technical-problem",
    shortTitle: "Technical Problem / No Signal",
    description: "Blue screen, weak signal, or no signal",
    sections: [
      {
        title: "Check Weather",
        steps: ["Bad weather can affect signal temporarily."]
      },
      {
        title: "Check Dish & Cable",
        steps: [
          "Ensure dish angle is correct.",
          "Inspect cable for cuts or loose connectors."
        ]
      }
    ],
    note: "If the dish is misaligned, a technician visit may be required."
  },

  {
    id: "av-failure",
    shortTitle: "Audio / Video Failure",
    description: "No audio, blank screen, or distorted video",
    sections: [
      {
        title: "Check Cables",
        steps: [
          "Ensure HDMI/AV cables are secure.",
          "Confirm your TV input source is correct."
        ]
      },
      {
        title: "Restart the Box",
        steps: [
          "Turn off the box.",
          "Unplug for 10 seconds.",
          "Plug back in and recheck."
        ]
      }
    ],
    note: "If problem continues, try a different cable."
  },

  {
    id: "not-powering-on",
    shortTitle: "Box Not Powering On",
    description: "No lights or no response",
    sections: [
      {
        title: "Check Power Cable",
        steps: ["Ensure power adapter is firmly connected."]
      },
      {
        title: "Check Outlet",
        steps: ["Try a different power outlet."]
      }
    ],
    note: "If there is still no power, the box may require service."
  },

  {
    id: "audio-distorted",
    shortTitle: "Distorted / Delayed / No Audio",
    description: "Audio issues such as delay or static",
    sections: [
      {
        title: "Check Audio Settings",
        steps: [
          "Menu → Settings → Audio.",
          "Ensure Stereo / PCM mode is correct."
        ]
      },
      {
        title: "Restart Box",
        steps: ["Unplug for 10 seconds and reconnect."]
      }
    ],
    note:
      "If only one channel has an issue, it may be a broadcast feed problem."
  }
];

export const boxModels = [
  {
    id: "arion-hd-zapper",
    name: "Arion Cordless HD Zapper",
    type: "HD",
    image: "/images/boxes/ArionCordlessHDZapper.png",
    issues: createHdIssues()
  },
  {
    id: "changhong-silver-hd",
    name: "Changhong Silver HD",
    type: "HD",
    image: "/images/boxes/ChangHongSilverHD.png",
    issues: createHdIssues()
  },
  {
    id: "pace-hd",
    name: "Pace HD",
    type: "HD",
    image: "/images/boxes/PACE.png",
    issues: createHdIssues()
  },
  {
    id: "humax-hd",
    name: "Humax HD",
    type: "HD",
    image: "/images/boxes/Humax.png",
    issues: createHdIssues()
  },
  {
    id: "samsung-pvr-hd",
    name: "Samsung PVR",
    type: "HD",
    image: "/images/boxes/SamsungPVR.png",
    issues: createHdIssues()
  },
  {
    id: "changhong-black-hd",
    name: "Changhong Black HD",
    type: "HD",
    image: "/images/boxes/ChangHongBlackHD.png",
    issues: createHdIssues()
  },
  {
    id: "giec-hd",
    name: "Giec HD",
    type: "HD",
    image: "/images/boxes/GiecHD.png",
    issues: createHdIssues()
  },
  {
    id: "samsung-hd",
    name: "Samsung HD",
    type: "HD",
    image: "/images/boxes/SamsungHD.png",
    issues: createHdIssues()
  }
];
