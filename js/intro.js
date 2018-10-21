const rulesDialogs = [
  "Alright cadet, let's get you geared up.",
  "Put the colored caps on your first and third digits.",
  "To shoot, point at the screen and move your hand as shown."
]

let rulesInterval = null
const firstTriggerPulled = false

const screens = {
  title: `
    <img id="logo" src="res/FINGRR.svg" />
    <button class="retro title">Start your adventure</button>
  `,
  rules: `
  <p id="calibration-text">${rulesDialogs[0]}</p>
  <button class="retro rules">Okay, I'm ready!</button>
  <div id="container--gun">
    <div id="finger-img" class="animated">
      <img id="thumb-up" class="fade-in" src="./res/finger_thumb_up.svg" />
      <img id="thumb-down" class="fade-out" src="./res/finger_thumb_down.svg" />
    </div>
  </div>
  `,
  calibration: `
  <div class="centered-container">
    <div id="dot" class="top-left"></div>
    <div id="finger-img" class="point-top-left">
      <img id="thumb-up" class="fade-in" src="./res/finger_thumb_up.svg" />
      <img id="thumb-down" class="fade-out" src="./res/finger_thumb_down.svg" />
    </div>
  </div>
  `
}

const container = document.getElementById('container')

document.addEventListener('click', (event) => {
  const classes = event.target.classList
  if (classes.contains('title')) {
    container.innerHTML = screens['rules']
    initializeRules()
  } else if (classes.contains('rules')) {
    container.innerHTML = screens['calibration']
    initializeCalibration()
  }
})

const initializeRules = () => {
  let dialogID = 0
  const text = document.getElementById('calibration-text')
  const dialogInterval = setInterval(() => {
    text.innerHTML = (dialogID < rulesDialogs.length - 1) ?
      rulesDialogs[++dialogID] :
      rulesDialogs[rulesDialogs.length - 1]

    if (dialogID >= rulesDialogs.length - 1) {
      let up = true
      rulesInterval = setInterval(() => {
        if (up) {
          document.getElementById("thumb-down").classList = ["fade-in"]
          document.getElementById("thumb-up").classList = ["fade-out"]
          up = false
        } else {
          document.getElementById("thumb-up").classList = ["fade-in"]
          document.getElementById("thumb-down").classList = ["fade-out"]
          up = true
        }
      }, 1500)
      clearInterval(dialogInterval)
    }
  }, 6000)
}

const initializeCalibration = () => {
  if (!rulesInterval) {
    let up = true
    rulesInterval = setInterval(() => {
      if (up) {
        document.getElementById("thumb-down").classList = ["fade-in"]
        document.getElementById("thumb-up").classList = ["fade-out"]
        up = false
      } else {
        document.getElementById("thumb-up").classList = ["fade-in"]
        document.getElementById("thumb-down").classList = ["fade-out"]
        up = true
      }
    }, 1500)
  }
}

const triggerPulled = () => {
  if (firstTriggerPulled) {
    document.getElementById('container').classList = ["fade-out"]
  } else {
    document.getElementById('finger-img').classList = ["point-bottom-right"]
    document.getElementById('dot').classList = ["bottom-right"]
  }
  firstTriggerPulled = true
}

//set initial screen
container.innerHTML = screens['calibration']
initializeCalibration()