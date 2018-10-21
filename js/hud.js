let activeOverlay = document.querySelector('.overlay.active');

function switchToOverlay(overlay) {
    const hud = document.getElementById('hud');

    if (activeOverlay) {
        activeOverlay.classList.remove('active');
        activeOverlay = undefined;
    }

    if (overlay) {
        activeOverlay = hud.getElementsByClassName(overlay)[0];
    }

    if (activeOverlay) {
        activeOverlay.classList.add('active');
        hud.classList.add('has-overlay');
    } else {
        hud.classList.remove('has-overlay');
    }
}