(function () {
    document.getElementById('pause-btn').addEventListener('click', function () {
        switchToOverlay('pause-screen');
        isPlay = false;
    });
    document.getElementById('resume-link').addEventListener('click', function () {
        switchToOverlay();
        isPlay = true;
    });
    document.getElementById('recalibrate-link').addEventListener('click', function () {
        switchToOverlay('calibration-screen');
        calibrate().then(function () {
            switchToOverlay('pause-screen');
        });
    });

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (!activeOverlay) {
                switchToOverlay('pause-screen');
                isPlay = false;
            } else if (activeOverlay === 'pause-screen') {
                switchToOverlay();
                isPlay = true;
            }
        }
    });
})();