//const vFOV = 60;
//const radius = 1000;
//const height = 2 * Math.tan( ( vFOV / 2 ) ) * radius;
//const aspect = window_width / window_height;
//const hFOV = 2 * Math.atan( Math.tan( vFOV / 2 ) * aspect );
//const width = 2 * Math.tan( ( hFOV / 2 ) ) * radius;

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
camera.position.set(0, 0, -1);
camera.lookAt(new THREE.Vector3(0, 0, 0));
scene.add(camera);

//setup background sphere
const sphereDepth = 1000;
var background = new THREE.Mesh(new THREE.SphereGeometry(sphereDepth, 90, 45), new THREE.MeshBasicMaterial({
  color: "gray",
  wireframe: true
}));
scene.add(background);

//setup renderer
var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);

//setup aim-line/weapon
var lineGeometry = new THREE.Geometry();
lineGeometry.vertices.push(
	new THREE.Vector3(0, 0, 0),
	new THREE.Vector3(0, 0, 99999)
);
var weapon = new THREE.Object3D();
weapon.position.set(0, 0, 0);
scene.add(weapon);
var weaponCone = new THREE.Mesh(new THREE.ConeGeometry(0.01, 10, 16), new THREE.MeshBasicMaterial({
  color: 0x5555ff
}));
weaponCone.position.set(0, 0, 5);
weaponCone.rotateX(Math.PI / 2);
weapon.add(weaponCone);
//camera.add(weapon);
var emitter = new THREE.Object3D();
emitter.position.set(0, 0, 8);
//camera.add(emitter);
weapon.add(emitter);

var asteroids = [];
const vHeight = visibleHeightAtZDepth(sphereDepth, camera);
const vWidth = visibleWidthAtZDepth(sphereDepth, camera);

function generateAsteroids() {
	const vAxis = -(vWidth/2) + vWidth * Math.random();
	const hAxis = -(vHeight/2) + vHeight * Math.random();
	const geometry = new THREE.SphereGeometry(15, 8, 6);
	const lineGeometry = new THREE.SphereBufferGeometry(15,8,6);
	//lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute([], 3));
	let asteroid = new THREE.Group();
	asteroid.add(new THREE.Mesh(lineGeometry, new THREE.MeshLambertMaterial({
		color: "red",
		flatShading: true
	})));
	asteroid.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
		color: 0xffffff,
		transparent: true,
		opacity: 0.5
	})));
	asteroid.position.set(hAxis, vAxis, sphereDepth);
	scene.add(asteroid);
	asteroids.push(asteroid);
}

setInterval(generateAsteroids, 1000);

var plasmaBalls = [];
window.addEventListener("mousedown", onMouseDown);

function onMouseDown() {
  let plasmaBall = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 4), new THREE.MeshBasicMaterial({
    color: "aqua"
  }));
  plasmaBall.position.copy(emitter.getWorldPosition()); // start position - the tip of the weapon
  plasmaBall.quaternion.copy(weapon.quaternion); // apply camera's quaternion
  scene.add(plasmaBall);
  plasmaBalls.push(plasmaBall);
}

var speed = 50;
var clock = new THREE.Clock();
var delta = 0;

(function render() {
  requestAnimationFrame(render);
  delta = clock.getDelta();
  plasmaBalls.forEach(b => {
    b.translateZ(speed * delta); // move along the local z-axis
  });
  asteroids.forEach(a => {
    a.translateOnAxis(a.worldToLocal(new THREE.Vector3(0, 0, 0)), 0.005);
  });
  //weapon.rotateX(0.005);
  //weapon.rotateY(0.005);
  renderer.render(scene, camera);
})()
