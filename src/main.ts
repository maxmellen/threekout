import * as THREE from "three";
import vertexShader from "./monjori.vert";
import fragmentShader from "./monjori.frag";

const FFT_SIZE = 1024;

type UniformNames = "time" | "tAudioData" | "ferp";

let gotUserMedia = false;

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.Camera;
let sound: THREE.Audio;
let analyser: THREE.AudioAnalyser;
let uniforms: Record<UniformNames, THREE.IUniform>;

init();
animate();

function init(): void {
  let container = document.getElementById("main") as HTMLDivElement;
  let ferpSlider = document.getElementById("ferp") as HTMLInputElement;

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new THREE.Scene();

  let listener = new THREE.AudioListener();
  listener.setMasterVolume(0);
  camera.add(listener);

  sound = new THREE.Audio(listener);
  analyser = new THREE.AudioAnalyser(sound, FFT_SIZE);

  let geometry = new THREE.PlaneBufferGeometry(2, 2);

  let audioDataTexture = new THREE.DataTexture(
    analyser.data,
    FFT_SIZE / 2,
    1,
    THREE.LuminanceFormat
  );

  audioDataTexture.minFilter = THREE.LinearFilter;
  audioDataTexture.magFilter = THREE.LinearFilter;

  uniforms = {
    time: { value: 1.0 },
    tAudioData: {
      value: audioDataTexture,
    },
    ferp: { value: 0.52 },
  };

  let material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
  });

  let mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  onWindowResize();
  ferpSlider.value = uniforms.ferp.value;

  window.addEventListener("resize", onWindowResize);
  ferpSlider.addEventListener("input", onFerpInput);
  renderer.domElement.addEventListener("click", getUserMedia);
}

function onWindowResize(): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onFerpInput(event: Event): void {
  let ferpSlider = event.target as HTMLInputElement;
  uniforms.ferp.value = ferpSlider.value;
}

async function getUserMedia(): Promise<void> {
  if (gotUserMedia) return;

  let stream: MediaStream;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.error("Could not get user media:", e);
    return;
  }

  sound.setMediaStreamSource(stream);
  sound.context.resume();

  gotUserMedia = true;
}

function animate(): void {
  requestAnimationFrame(animate);

  analyser.getFrequencyData();
  uniforms.time.value = performance.now() / 1000;
  uniforms.tAudioData.value.needsUpdate = true;

  renderer.render(scene, camera);
}
