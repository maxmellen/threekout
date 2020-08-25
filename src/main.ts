import * as THREE from "three";
import vertexShader from "./monjori.vert";
import fragmentShader from "./monjori.frag";

type UniformNames = "time" | "resolution" | "tAudioData";

const FFT_SIZE = 1024;

let container = document.getElementById("main")!;

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.Camera;
let sound: THREE.Audio;
let analyser: THREE.AudioAnalyser;
let uniforms: Record<UniformNames, THREE.IUniform>;

init();

async function init(): Promise<void> {
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
    resolution: { value: [window.innerWidth, window.innerHeight] },
    tAudioData: {
      value: audioDataTexture,
    },
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

  window.addEventListener("resize", onWindowResize);
  onWindowResize();

  renderer.domElement.addEventListener("click", getUserMedia);

  requestAnimationFrame(function loop() {
    render();
    requestAnimationFrame(loop);
  });
}

function render(): void {
  analyser.getFrequencyData();
  uniforms.time.value = performance.now() / 1000;
  uniforms.tAudioData.value.needsUpdate = true;

  renderer.render(scene, camera);
}

function onWindowResize(): void {
  uniforms.resolution.value = [window.innerWidth, window.innerHeight];
  renderer.setSize(window.innerWidth, window.innerHeight);
}

async function getUserMedia(): Promise<void> {
  try {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    sound.setMediaStreamSource(stream);
  } catch (e) {
    console.warn("Could not get user media:", e);
  }
}
