self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('v1').then(function (cache) {
            return cache.addAll([
                '/',
                '/index.html',
                '/sw.js',
                '/js/eventemitter.js',
                '/js/hud.js',
                '/js/intro.js',
                '/js/links.js',
                '/js/main.js',
                '/js/swinstall.js',
                '/js/three.js',
                '/js/tracking.js',
                '/js/webcam.js',
                '/res/background-tile.svg',
                '/res/BF7B0B20FB7A6EC2.png',
                '/res/finger_thumb_down.svg',
                '/res/finger_thumb_up.svg',
                '/res/FINGRR.svg',
                '/sounds/background.mp3',
                '/sounds/crash.wav',
                '/sounds/explosion.wav',
                '/sounds/gameover.wav',
                '/sounds/lifelost.wav',
                '/sounds/pew.wav',
                '/styles/calibration.css',
                '/styles/index.css',
                '/styles/keyframes.css',
                '/styles/rules.css',
                '/styles/title.css'
            ]);
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(caches.match(event.request).then(function (response) {
        // caches.match() always resolves
        // but in case of success response will have value
        if (response !== undefined) {
            return response;
        } else {
            return fetch(event.request).then(function (response) {
                // response may be used only once
                // we need to save clone to put one copy in cache
                // and serve second one
                let responseClone = response.clone();

                caches.open('v1').then(function (cache) {
                    cache.put(event.request, responseClone);
                });
                return response;
            });
        }
    }));
});
