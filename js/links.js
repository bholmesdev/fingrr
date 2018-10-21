(function () {
    const hud = document.getElementById('hud');

    document.getElementById('pause-btn').addEventListener('click', function () {
        hud.classList.add('paused');
        isPlay = false;
    });
    document.getElementById('resume-link').addEventListener('click', function () {
        hud.classList.remove('paused');
        isPlay = true;
    });
    document.getElementById('recalibrate-link').addEventListener('click', startCalibrationUI);

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            if (!hud.classList.length) {
                hud.classList.add('paused');
                isPlay = false;
            } else if (hud.classList.contains('paused')) {
                hud.classList.remove('paused');
                isPlay = true;
            }
        }
    });
})();