const calibrationDialogs = [
  "Alright cadet, let's get you geared up.",
  "Put the colored caps on your first and third digits.",
  "To shoot, point at the screen and move your hand as shown."
]

const screens = {
  title: `
    <img id="logo" src="res/FINGRR.svg" />
    <button class="title fancy">Start your adventure</button>
  `,
  gunCalibration: `
  <p id="calibration-text">${calibrationDialogs[0]}</p>
  <button class="continue-to-game fancy">Okay, I'm ready!</button>
  <div id="container--gun">
    <div id="finger-img">
      <img id="thumb-up" class="fade-in" src="./res/finger_thumb_up.svg" />
      <img id="thumb-down" class="fade-out" src="./res/finger_thumb_down.svg" />
    </div>
  </div>
  `,
  screenCalibration: `
  <div id="finger-img">
    <img id="thumb-up" class="fade-in" src="./res/finger_thumb_up.svg" />
    <img id="thumb-down" class="fade-out" src="./res/finger_thumb_down.svg" />
  </div>
  `
}

const container = document.getElementById('container')

document.addEventListener('click', (event) => {
  const classes = event.target.classList
  if (classes.contains('title')) {
    container.innerHTML = screens['gunCalibration']
    initializeGunCalibration()
  } else if (classes.contains('continue-to-game')) {
    startGame();
  }
})

const initializeGunCalibration = () => {
  let dialogID = 0
  const text = document.getElementById('calibration-text')
  const dialogInterval = setInterval(() => {
    if (!text) return;
    text.innerHTML = (dialogID < calibrationDialogs.length - 1) ?
      calibrationDialogs[++dialogID] :
      calibrationDialogs[calibrationDialogs.length - 1]

    if (dialogID >= calibrationDialogs.length - 1) {
      let up = true
      const calibrationInterval = setInterval(() => {
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
  }, 4000)
}

//set initial screen
container.innerHTML = screens['title']
initializeGunCalibration()