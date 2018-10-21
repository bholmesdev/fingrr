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
})();