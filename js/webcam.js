const VELOCITY_DATAPOINT_COUNT = 3;
const MAX_UNTRACKED_TICKS = 5;

const Calibration = {
    FIRE_MIN_THUMB_Y_VELOCITY: 12,
    FIRE_MAX_FINGER_Y_VELOCITY: 12,
    RELEASE_MAX_THUMB_Y_VELOCITY: 5,
    RELEASE_MIN_FINGER_Y_VELOCITY: 5,
    FIRE_MIN_THUMB_Y_VELOCITY_K: 0.65,
    FIRE_MAX_FINGER_Y_VELOCITY_K: 0.35,
    RELEASE_MAX_THUMB_Y_VELOCITY_K: 0.8,
    RELEASE_MIN_FINGER_Y_VELOCITY_K: 0.2
};

const TriggerState = {
    RELEASE: 0,
    FIRE: 1
};

const TRIGGER_DISTANCE_THRESHOLDS = {
    [TriggerState.FIRE]: 38,
    [TriggerState.RELEASE]: 42
};

const state = {
    tracker: null,
    calibrated: false,
    fov: {
        leftEdge: 0,
        rightEdge: 0,
        topEdge: 0,
        bottomEdge: 0
    },
    emitter: new EventEmitter(),
    trackingCache: {},
    trigger: {
        state: TriggerState.RELEASE,
        fire: {
            minThumbVelocity: Calibration.FIRE_MIN_THUMB_Y_VELOCITY,
            maxFingerVelocity: Calibration.FIRE_MAX_FINGER_Y_VELOCITY
        },
        release: {
            maxThumbVelocity: Calibration.RELEASE_MAX_THUMB_Y_VELOCITY,
            minFingerVelocity: Calibration.RELEASE_MIN_FINGER_Y_VELOCITY
        }
    }
};

function getRectCenter(rect) {
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
    };
}

function getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy)
}

function processTrackingData(trackingData) {
    const categorizedTrackingData = {};
    const colors = [];

    // categorize each detected rect by its color
    trackingData.forEach(function (rect) {
        if (!categorizedTrackingData.hasOwnProperty(rect.color)) {
            categorizedTrackingData[rect.color] = [rect];
            colors.push(rect.color);
        } else {
            categorizedTrackingData[rect.color].push(rect);
        }
    });

    // take the biggest rect of each color
    const newTrackingData = {};
    colors.forEach(function (color) {
        if (!state.trackingCache.hasOwnProperty(color)) {
            state.trackingCache[color] = {
                points: [],
                untrackedTicks: 0
            };
        }

        const dataForColor = categorizedTrackingData[color];
        if (!dataForColor.length) return;
        const sizes = dataForColor.map(function (rect) { return rect.width * rect.height; });
        const rect = dataForColor[sizes.indexOf(Math.max.apply(Math, sizes))];
        const center = getRectCenter(rect);

        const cache = state.trackingCache[color];
        cache.untrackedTicks = 0;
        cache.points.push(rect);
        if (cache.points.length > VELOCITY_DATAPOINT_COUNT) {
            cache.points.shift();
        }
        if (cache.points.length === VELOCITY_DATAPOINT_COUNT) {
            rect.velocity = {
                x: (center.x - cache.points[0].x) / VELOCITY_DATAPOINT_COUNT,
                y: (center.y - cache.points[0].y) / VELOCITY_DATAPOINT_COUNT
            };
        }

        newTrackingData[color] = rect;
    });

    // increment untracked ticks for all rect colors; delete accordingly
    Object.keys(state.trackingCache).forEach(function (color) {
        state.trackingCache[color].untrackedTicks++;
        if (state.trackingCache[color].untrackedTicks > MAX_UNTRACKED_TICKS) {
            delete state.trackingCache[color];
        } else if (!newTrackingData.hasOwnProperty(color) && state.trackingCache[color].points.length) {
            newTrackingData[color] = state.trackingCache[color].points[state.trackingCache[color].points.length - 1];
        } 
    });

    return newTrackingData;
}

function getHSVFilter(hMin, hMax, sMin, sMax, vMin, vMax) {
    return function (r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        let h;

        if (delta === 0) {
            h = 0;
        } else if (max === r) {
            h = (60 * (g - b) / delta) % 360;
        } else if (max === g) {
            h = (120 + 60 * (b - r) / delta) % 360;
        } else {
            h = (240 + 60 * (r - g) / delta) % 360;
        }

        const s = max && delta / max;
        const v = max / 255;

        return (
            s >= sMin
            && s <= sMax
            && v >= vMin
            && v <= vMax
            && (
                hMin > hMax
                ? (h >= hMin || h <= hMax)
                : (h >= hMin && h <= hMax)
            )
        );
    };
}

function initialize(options) {
    return new Promise(function (resolve, reject) {
        window.navigator.getUserMedia({
            video: true
        }, function (stream) {
            try {
                if ('srcObject' in options.videoElement) {
                    options.videoElement.srcObject = stream;
                } else {
                    options.videoElement.src = window.URL.createObjectURL(stream);
                }
            } catch (err) {
                options.videoElement.src = stream;
            }

            const onTrack = function (event) {
                const data = processTrackingData(event.data);
                state.emitter.emit('data', data);
            };

            options.tracker.on('track', onTrack);
            tracking.track(options.videoElement, options.tracker);
            state.tracker = options.tracker;
            resolve();
        }, reject);
    });
}

function calibrate(helpTextElement) {
    state.calibrated = false;
    state.trigger.state = TriggerState.RELEASE;
    state.trigger.fire.minThumbVelocity = Calibration.FIRE_MIN_THUMB_Y_VELOCITY;
    state.trigger.fire.maxFingerVelocity = Calibration.FIRE_MAX_FINGER_Y_VELOCITY;
    state.trigger.release.maxThumbVelocity = Calibration.RELEASE_MAX_THUMB_Y_VELOCITY;
    state.trigger.release.minFingerVelocity = Calibration.RELEASE_MIN_FINGER_Y_VELOCITY;

    while (helpTextElement.firstChild) helpTextElement.removeChild(helpTextElement.firstChild);
    const strong = document.createElement('strong');
    strong.innerText = 'Step 1 of 2: ';
    const text = document.createTextNode('Point your finger gun at the top-left corner of the screen and shoot.');
    helpTextElement.appendChild(strong);
    helpTextElement.appendChild(text);

    let thumbVelocitySum = 0;

    return new Promise(function (resolve) { state.emitter.once('fire', resolve); }).then(function (topLeftTrackingData) {
        thumbVelocitySum += topLeftTrackingData.thumb.velocity.y;

        state.trigger.fire.minThumbVelocity = Calibration.FIRE_MIN_THUMB_Y_VELOCITY_K * thumbVelocitySum;
        state.trigger.fire.maxFingerVelocity = Calibration.FIRE_MAX_FINGER_Y_VELOCITY_K * thumbVelocitySum;
        state.trigger.release.maxThumbVelocity = Calibration.RELEASE_MAX_THUMB_Y_VELOCITY_K * thumbVelocitySum;
        state.trigger.release.minFingerVelocity = Calibration.RELEASE_MIN_FINGER_Y_VELOCITY_K * thumbVelocitySum;

        const center = getRectCenter(topLeftTrackingData.finger);
        state.fov.leftEdge = center.x;
        state.fov.topEdge = center.y;

        console.log('set trigger settings', state.trigger);
        console.log('set top left', state.fov);

        while (helpTextElement.firstChild) helpTextElement.removeChild(helpTextElement.firstChild);
        const strong = document.createElement('strong');
        strong.innerText = 'Step 2 of 2: ';
        const text = document.createTextNode('Point your finger gun at the bottom-right corner of the screen and shoot.');
        helpTextElement.appendChild(strong);
        helpTextElement.appendChild(text);

        return new Promise(function (resolve) { state.emitter.once('fire', resolve); });
    }).then(function (bottomRightTrackingData) {
        thumbVelocitySum += bottomRightTrackingData.thumb.velocity.y;

        state.trigger.fire.minThumbVelocity = Calibration.FIRE_MIN_THUMB_Y_VELOCITY_K * thumbVelocitySum / 2;
        state.trigger.fire.maxFingerVelocity = Calibration.FIRE_MAX_FINGER_Y_VELOCITY_K * thumbVelocitySum / 2;
        state.trigger.release.maxThumbVelocity = Calibration.RELEASE_MAX_THUMB_Y_VELOCITY_K * thumbVelocitySum / 2;
        state.trigger.release.minFingerVelocity = Calibration.RELEASE_MIN_FINGER_Y_VELOCITY_K * thumbVelocitySum / 2;

        const center = getRectCenter(bottomRightTrackingData.finger);
        state.fov.rightEdge = center.x;
        state.fov.bottomEdge = center.y;

        while (helpTextElement.firstChild) helpTextElement.removeChild(helpTextElement.firstChild);
        const text = document.createTextNode('Calibration successful!');
        helpTextElement.appendChild(text);

        state.calibrated = true;
    });
}

const video = document.querySelector('#webcam video');
const canvas = document.querySelector('#webcam canvas');
const context = canvas.getContext('2d');

state.emitter.on('data', function (trackingData) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (trackingData.thumb) {
        const rect = trackingData.thumb;
        const x = canvas.width - rect.x - rect.width;
        const y = rect.y;
        context.strokeStyle = rect.color === 'thumb' ? '#ff0000' : '#00ff00';
        context.strokeRect(x, y, rect.width, rect.height);
        context.font = '11px Helvetica';
        context.fillStyle = "#fff";
        context.fillText('x: ' + x + 'px, y: ' + y + 'px', x + rect.width + 5, rect.y + 11);
        context.fillText('w: ' + rect.width + 'px, h: ' + rect.height + 'px', x + rect.width + 5, rect.y + 22);
    }
    if (trackingData.finger) {
        const rect = trackingData.finger;
        const x = canvas.width - rect.x - rect.width;
        const y = rect.y;
        context.strokeStyle = rect.color === 'thumb' ? '#ff0000' : '#00ff00';
        context.strokeRect(x, y, rect.width, rect.height);
        context.font = '11px Helvetica';
        context.fillStyle = "#fff";
        context.fillText('x: ' + x + 'px, y: ' + y + 'px', x + rect.width + 5, rect.y + 11);
        context.fillText('w: ' + rect.width + 'px, h: ' + rect.height + 'px', x + rect.width + 5, rect.y + 22);

        if (state.calibrated) {
            const center = getRectCenter(trackingData.finger);
            const hDelta = state.fov.rightEdge - state.fov.leftEdge;
            const hAngle = (camera.fov * camera.aspect / 2) - (camera.fov * camera.aspect) * (center.x - state.fov.leftEdge) / hDelta;
            const vDelta = state.fov.topEdge - state.fov.bottomEdge;
            const vAngle = (camera.fov / 2) - camera.fov * (center.y - state.fov.bottomEdge) / vDelta;
            const hRad = hAngle / 180 * Math.PI;
            const vRad = vAngle / 180 * Math.PI;
            weapon.rotation.set(vRad, hRad, 0);
        }
    }
});

state.emitter.on('data', function (trackingData) {
    const thumb = trackingData.thumb;
    const finger = trackingData.finger;

    if (thumb && finger && thumb.velocity && finger.velocity) {
        if (state.trigger.state === TriggerState.RELEASE
                && thumb.velocity.y >= state.trigger.fire.minThumbVelocity
                && finger.velocity.y <= state.trigger.fire.maxFingerVelocity) {
            state.trigger.state = TriggerState.FIRE;
            state.emitter.emit('fire', trackingData);
        } else if (state.trigger.state === TriggerState.FIRE
            && (thumb.velocity.y <= state.trigger.release.maxThumbVelocity
                || finger.velocity.y >= state.trigger.release.minFingerVelocity)) {
            state.trigger.state = TriggerState.RELEASE;
        }
    }
});

state.emitter.on('fire', (trackingData) => {
    onMouseDown();
    console.log('pew', trackingData);
});

tracking.ColorTracker.registerColor('thumb', getHSVFilter(330, 30, 0.5, 1, 0.75, 1));
tracking.ColorTracker.registerColor('finger', getHSVFilter(120, 180, 0.2, 1, 0.3, 1));

const tracker = new tracking.ColorTracker(['thumb', 'finger']);
tracker.setMinDimension(10);
tracker.setMinGroupSize(15);

initialize({
    videoElement: video,
    tracker: tracker
}).then(function () {
    document.getElementById('calibration').style.display = 'block';
    return calibrate(document.getElementById('calibration-help'));
}).then(function () {
    return new Promise(function (resolve) {
        setTimeout(resolve, 3000);
    });
}).then(function () {
    document.getElementById('calibration').style.display = 'none';
});