//const vFOV = 60;
//const radius = 1000;
//const height = 2 * Math.tan( ( vFOV / 2 ) ) * radius;
//const aspect = window_width / window_height;
//const hFOV = 2 * Math.atan( Math.tan( vFOV / 2 ) * aspect );
//const width = 2 * Math.tan( ( hFOV / 2 ) ) * radius;

const CAMERA_POSITION = new THREE.Vector3(0, 0, -1);
const DEFAULT_CAMERA_SHAKE = 1;
const SHAKE_INTENSITY = 1;

const visibleHeightAtZDepth = ( depth, camera ) => {
  // compensate for cameras not positioned at z=0
  const cameraOffset = camera.position.z;
  if ( depth < cameraOffset ) depth -= cameraOffset;
  else depth += cameraOffset;

  // vertical fov in radians
  const vFOV = camera.fov * Math.PI / 180;

  // Math.abs to ensure the result is always positive
  return 2 * Math.tan( vFOV / 2 ) * Math.abs( depth );
};

const visibleWidthAtZDepth = ( depth, camera ) => {
  const height = visibleHeightAtZDepth( depth, camera );
  return height * camera.aspect;
};

//setup scene
var scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.2));
scene.add(new THREE.DirectionalLight(0xffffff, 0.5));

//setup camera
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000);
camera.position.copy(CAMERA_POSITION);
camera.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(camera);

// create an AudioListener and add it to the camera
var listener = new THREE.AudioListener();
camera.add(listener);

// create a global audio source
var sound = new THREE.Audio(listener); 

// load a sound and set it as the Audio object's buffer
var audioLoader = new THREE.AudioLoader();
audioLoader.load( 'sounds/background.mp3', function(buffer) {
	sound.setBuffer(buffer);
	sound.setLoop(true);
	sound.setVolume(0.5);
	sound.play();
});
//setup background sphere
const sphereDepth = 500;
var background = new THREE.Mesh(new THREE.SphereGeometry(sphereDepth, 90, 45), new THREE.MeshBasicMaterial({
	color: 0x490E61,
	wireframe: true
}));
scene.add(background);

//setup renderer
var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// var controls = new THREE.OrbitControls(camera, renderer.domElement);

//setup aim-line/weapon
var lineGeometry = new THREE.Geometry();
lineGeometry.vertices.push(
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(0, 0, 99999)
);
var weapon = new THREE.Object3D();
weapon.position.set(0, 0, 0);
scene.add(weapon);
// var weaponCone = new THREE.Mesh(new THREE.ConeGeometry(0.01, 10, 16), new THREE.MeshLambertMaterial({
	// color: 0x5555ff
// }));
// weaponCone.position.set(0, 0, 5);
// weaponCone.rotateX(Math.PI / 2);
// weapon.add(weaponCone);
//camera.add(weapon);
var emitter = new THREE.Object3D();
emitter.position.set(0, 0, 8);
//camera.add(emitter);
weapon.add(emitter);

var crosshair = new THREE.Group();
var crosshairMaterial = new THREE.LineBasicMaterial({
	color: 0xffffff
});
var crosshairCircle = new THREE.CircleGeometry(0.25, 32);
crosshairCircle.vertices.shift();
crosshair.add(new THREE.LineLoop(crosshairCircle, crosshairMaterial));
var crosshairNorth = new THREE.BufferGeometry();
var crosshairVertices = new Float32Array([
	0, 0.35, 0,
	0, 0.15, 0,
	0, -0.35, 0,
	0, -0.15, 0,
	0.35, 0, 0,
	0.15, 0, 0,
	-0.35, 0, 0,
	-0.15, 0, 0
]);
crosshairNorth.addAttribute('position', new THREE.BufferAttribute(crosshairVertices, 3));
crosshair.add(new THREE.LineSegments(crosshairNorth, crosshairMaterial));
crosshair.position.set(0, 0, 8);
weapon.add(crosshair);

var collidableMeshList = [];

var asteroids = [];
const vHeight = visibleHeightAtZDepth(sphereDepth, camera);
const vWidth = visibleWidthAtZDepth(sphereDepth, camera);
var asteroidColor = 0x05EAFA;
function generateAsteroid() {
	const vAxis = -(vWidth/2) + vWidth * Math.random();
	const hAxis = -(vHeight/2) + vHeight * Math.random();
	const geometry = new THREE.SphereGeometry(15, 8, 6);
	const lineGeometry = new THREE.SphereBufferGeometry(15,8,6);
	//lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute([], 3));
	let asteroid = new THREE.Group();
	asteroid.add(new THREE.Mesh(lineGeometry, new THREE.MeshLambertMaterial({
		color: asteroidColor,
		flatShading: true
	})));
	asteroid.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0.5
	})));
	asteroid.position.set(hAxis, vAxis, sphereDepth);
	//asteroid.position.set(0, 0, sphereDepth);
	scene.add(asteroid);
	asteroids.push(asteroid);
	collidableMeshList.push(asteroid);
}

var intervalMilli = 3000;
var asteroidInterval = setInterval(generateAsteroid, intervalMilli);
var asteroidSpeed = 0.05;

var sphereColors = [0x490E61, 0xFA1505, 0x32FA05, 0xFA056F, 0xFFF001, 0xFA056F];
var asteroidColors = sphereColors.slice(0);
asteroidColors.reverse();
var sphereColorIdx = 0;
var asteroidColorIdx = 0;

function levelUp() {
	clearInterval(asteroidInterval);
	asteroidInterval = setInterval(generateAsteroid, intervalMilli*=0.8)
	asteroidSpeed += 0.005;
	sphereColorIdx++;
	asteroidColorIdx++;
	background.material.color.setHex(sphereColors[sphereColorIdx % sphereColors.length]);
	asteroidColor = asteroidColors[asteroidColorIdx % asteroidColors.length];
	console.log("LEVEL UP");

}

var levelupInterval = setInterval(levelUp, 10000);
var plasmaBalls = [];
window.addEventListener("mousedown", onMouseDown);

function onMouseDown() {
  	let plasmaBall = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 4), new THREE.MeshBasicMaterial({
  		color: "aqua"
  	}));
  	plasmaBall.position.copy(emitter.getWorldPosition()); // start position - the tip of the weapon
  	plasmaBall.quaternion.copy(weapon.quaternion); // apply camera's quaternion
  	scene.add(plasmaBall);
	var pew = new THREE.Audio(listener); 
	var pewAudioLoader = new THREE.AudioLoader();
	pewAudioLoader.load( 'sounds/pew.wav', function(buffer) {
		pew.setBuffer(buffer);
		pew.setLoop(false);
		pew.setVolume(0.5);
		pew.play()
	});
	plasmaBalls.push(plasmaBall);
}

function isCollision(ball) {
	var collision = false;
	//for (vertexIndex = 0; vertexIndex < object.geometry.vertices.length; vertexIndex++) {
	//	var localVertex = object.geometry.vertices[vertexIndex].clone();
    	//	var globalVertex = object.matrix.multiplyVector3(localVertex);
    	//	var directionVector = globalVertex.sub( object.position );

    	//	var ray = new THREE.Raycaster( object.position, directionVector.clone().normalize());
    	//	var collisionResults = ray.intersectObjects( collidableMeshList );
    	//	if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
	//		scene.remove(collisionResults[0]);
    	//	}
	//}
	if (ball.position.z >= sphereDepth) {
		const bIndex = plasmaBalls.indexOf(ball);
		plasmaBalls.splice(bIndex, 1);
		scene.remove(ball);
		console.log("BULLET MAX DIST -> REMOVED")
	} else {
		var ballBox = new THREE.Box3().setFromObject(ball);
		asteroids.forEach(a => {
			var asteroidBox = new THREE.Box3().setFromObject(a);
			if (ballBox.intersectsBox(asteroidBox)) {
				const aIndex = asteroids.indexOf(a);
				asteroids.splice(aIndex, 1);
				scene.remove(a);
				const bIndex = plasmaBalls.indexOf(ball);
				plasmaBalls.splice(aIndex, 1);
				scene.remove(ball);
				collision = true;
			}
		})
	}
	return collision;
}

//explode settings
var movementSpeed = 80;
var totalObjects = 1000;
var objectSize = 10;
var sizeRandomness = 4000;
var colors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];
var dirs = [];
var parts = [];

function ExplodeAnimation(x, y, z) {
 	var geometry = new THREE.Geometry();

	for (i = 0; i < totalObjects; i ++) {
	var vertex = new THREE.Vector3();
	vertex.x = x;
    	vertex.y = y;
    	vertex.z = z;

    	geometry.vertices.push( vertex );
    	dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),y:(Math.random() * movementSpeed)-(movementSpeed/2),z:(Math.random() * movementSpeed)-(movementSpeed/2)});
  	}
  	var material = new THREE.PointsMaterial( { size: objectSize,  color: colors[Math.round(Math.random() * colors.length)] });
  	var particles = new THREE.Points( geometry, material );

  	this.object = particles;
  	this.status = true;

  	this.xDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  	this.yDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  	this.zDir = (Math.random() * movementSpeed)-(movementSpeed/2);

  	scene.add(this.object);

  	this.update = function(){
		var pCount = totalObjects;
      		while(pCount--) {
			var particle =  this.object.geometry.vertices[pCount]
        		particle.y += dirs[pCount].y;
        		particle.x += dirs[pCount].x;
       			particle.z += dirs[pCount].z;
      			}
      		this.object.geometry.verticesNeedUpdate = true;
  	}
}

var speed = 500;
var clock = new THREE.Clock();
var delta = 0;
var lives = 3000000;
var cameraShake = 0;
var isPlay = false;
(function render() {
	requestAnimationFrame(render);
  	delta = clock.getDelta();
	if (!isPlay) return;
  	plasmaBalls.forEach(b => {
		if (isCollision(b)) {
			console.log("REMOVED BULLET AND ASTEROID");
			var explosion = new THREE.Audio(listener);
			var explosionAudioLoader = new THREE.AudioLoader();
			explosionAudioLoader.load( 'sounds/explosion.wav', function(buffer) {
				explosion.setBuffer(buffer);
				explosion.setLoop(false);
				explosion.setVolume(0.5);
				explosion.play();
			});

			parts.push(new ExplodeAnimation(b.position.x, b.position.y, b.position.z));
		}
  		b.translateZ(speed * delta); // move along the local z-axis
  	});
	var pCount = parts.length;
        	while(pCount--) {
        		parts[pCount].update();
        	}
  	asteroids.forEach(a => {
		var asteroidBox = new THREE.Box3().setFromObject(a);
		if (asteroidBox.containsPoint(new THREE.Vector3(0, 0, 0))) {
			var crash = new THREE.Audio(listener);
			var crashAudioLoader = new THREE.AudioLoader();
			crashAudioLoader.load( 'sounds/crash.wav', function(buffer) {
				crash.setBuffer(buffer);
				crash.setLoop(false);
				crash.setVolume(0.5);
				crash.play();
			});
			cameraShake = DEFAULT_CAMERA_SHAKE;
			lives--;
			if (lives > 0) {
				console.log("You lost a life :(");
				var lifelost = new THREE.Audio(listener);
				var llAudioLoader = new THREE.AudioLoader();
				llAudioLoader.load( 'sounds/lifelost.wav', function(buffer) {
					lifelost.setBuffer(buffer);
					lifelost.setLoop(false);
					lifelost.setVolume(1);
					lifelost.play();
				});
			} else {
				console.log("GAME OVER");
				clearInterval(asteroidInterval);
				clearInterval(levelupInterval);
				var gameover = new THREE.Audio(listener);
				var goAudioLoader = new THREE.AudioLoader();
				goAudioLoader.load( 'sounds/gameover.wav', function(buffer) {
					gameover.setBuffer(buffer);
					gameover.setLoop(false);
					gameover.setVolume(5);
					gameover.play();
				});
				//while(scene.children.length > 0){ scene.remove(scene.children[0]); }
				scene.remove.apply(scene, scene.children);
			}
			const aIndex = asteroids.indexOf(a);
			asteroids.splice(aIndex, 1);
			scene.remove(a);
			//TODO: Iterate lives && GameOver here
		}

    		a.translateOnAxis(a.worldToLocal(new THREE.Vector3(0, 0, 0)), asteroidSpeed);
  	});
	  
	if (cameraShake >= 0) {
		camera.position.copy(new THREE.Vector3(
			(Math.random() - 0.5) * 2 * cameraShake * cameraShake * cameraShake * SHAKE_INTENSITY,
			(Math.random() - 0.5) * 2 * cameraShake * cameraShake * cameraShake * SHAKE_INTENSITY,
			(Math.random() - 0.5) * 2 * cameraShake * cameraShake * cameraShake * SHAKE_INTENSITY
		).add(CAMERA_POSITION));
		cameraShake -= delta;
	}
  	//weapon.rotateX(0.005);
  	//weapon.rotateY(0.005);
  	renderer.render(scene, camera);
})()
