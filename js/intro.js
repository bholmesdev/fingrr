const rulesDialogs = [
  "Alright cadet, let's get you geared up.",
  "Put the colored caps on your first and third digits.",
  "To shoot, point at the screen and move your hand as shown."
]

let firstTriggerPulled = false

document.addEventListener('click', (event) => {
  const classes = event.target.classList
  if (classes.contains('title')) {
    switchToOverlay('rules-screen')
    initializeRules()
  } else if (classes.contains('rules')) {
    startGame()
    initializeCalibration()
  }
})

const initializeRules = () => {
  let dialogID = 0
  const text = document.getElementById('rules-text')
  document.getElementsByClassName("finger-img")[0].classList.add("animated")
  const dialogInterval = setInterval(() => {
    text.innerHTML = (dialogID < rulesDialogs.length - 1) ?
      rulesDialogs[++dialogID] :
      rulesDialogs[rulesDialogs.length - 1]

    if (dialogID >= rulesDialogs.length - 1) {
      let up = true
      setInterval(() => {
        if (up) {
          document.getElementById("rules-thumb-down").classList.remove("fade-out")
          document.getElementById("rules-thumb-down").classList.add("fade-in")
          document.getElementById("rules-thumb-up").classList.remove("fade-in")
          document.getElementById("rules-thumb-up").classList.add("fade-out")
          up = false
        } else {
          document.getElementById("rules-thumb-down").classList.remove("fade-in")
          document.getElementById("rules-thumb-down").classList.add("fade-out")
          document.getElementById("rules-thumb-up").classList.remove("fade-out")
          document.getElementById("rules-thumb-up").classList.add("fade-in")
          up = true
        }
      }, 1500)
      clearInterval(dialogInterval)
    }
  }, 5000)
}

const initializeCalibration = () => {
  let up = true
  calibrationInterval = setInterval(() => {
    if (up) {
      document.getElementById("calibration-thumb-down").classList.remove("fade-out")
      document.getElementById("calibration-thumb-down").classList.add("fade-in")
      document.getElementById("calibration-thumb-up").classList.remove("fade-in")
      document.getElementById("calibration-thumb-up").classList.add("fade-out")
      up = false
    } else {
      document.getElementById("calibration-thumb-down").classList.remove("fade-in")
      document.getElementById("calibration-thumb-down").classList.add("fade-out")
      document.getElementById("calibration-thumb-up").classList.remove("fade-out")
      document.getElementById("calibration-thumb-up").classList.add("fade-in")
      up = true
    }
  }, 1500)
}

const triggerPulled = () => {
  if (firstTriggerPulled) {
    clearInterval(calibrationInterval)
    document.getElementById('calibration-finger-img').classList.remove("point-bottom-right")
    document.getElementById('calibration-finger-img').classList.add("point-top-left")
    document.getElementById('dot').classList.remove("bottom-right")
    document.getElementById('dot').classList.add("top-left")
  } else {
    document.getElementById('calibration-finger-img').classList.remove("point-top-left")
    document.getElementById('calibration-finger-img').classList.add("point-bottom-right")
    document.getElementById('dot').classList.remove("top-left")
    document.getElementById('dot').classList.add("bottom-right")
    document.getElementById('dot').classList = ["bottom-right"]
  }
  firstTriggerPulled = !firstTriggerPulled
}
