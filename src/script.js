import "./style.css";
import * as dat from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"; /** Base */

import firefliesVertexShader from "./shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./shaders/fireflies/fragment.glsl";

import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";

console.log(portalVertexShader, portalFragmentShader);

const debugObject = {
  clearColor: "#221e1c",
};

const gui = new dat.GUI({
  width: 400,
});
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();
// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const bakedTexture = textureLoader.load("/baked.jpg");
bakedTexture.encoding = THREE.sRGBEncoding;
bakedTexture.flipY = false;

const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });
const portalLightMaterial = new THREE.ShaderMaterial({
  fragmentShader: portalFragmentShader,
  vertexShader: portalVertexShader,
});
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

gltfLoader.load("portal.glb", (gltf) => {
  console.log("loaded", gltf.scene);
  const bakedMesh = gltf.scene.children.find((child) => child.name === "baked");
  bakedMesh.material = bakedMaterial;

  const poleLightAMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightA"
  );

  const poleLightBMesh = gltf.scene.children.find(
    (child) => child.name === "poleLightB"
  );

  const portalLight = gltf.scene.children.find(
    (child) => child.name === "portalLight"
  );

  console.log(poleLightAMesh, poleLightBMesh, portalLight);

  poleLightAMesh.material = poleLightMaterial;
  poleLightBMesh.material = poleLightMaterial;

  portalLight.material = portalLightMaterial;
  scene.add(gltf.scene);
});

const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 30;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4;
  positionArray[i * 3 + 1] = Math.random() * 4;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);

firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1)
);

const firefliesMaterial = new THREE.ShaderMaterial({
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 100 },
    uTime: { value: 0 },
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("Fireflies sizes");

const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 4;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(debugObject.clearColor);

gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Update fireflies
  firefliesMaterial.uniforms.uTime.value = elapsedTime;

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
