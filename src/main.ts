import * as THREE from "three";
import "./style.css";
import vertexShader from "./ray_marching.vert";
import fragmentShader from "./ray_marching.frag";

type Uniforms = "u_time" | "u_resolution";

let container = document.getElementById("main")!;

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.Camera;
let uniforms: Record<Uniforms, THREE.IUniform>;

init();

async function init(): Promise<void> {
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new THREE.Scene();

  let geometry = new THREE.PlaneBufferGeometry(2, 2);

  uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: [window.innerWidth, window.innerHeight] },
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

  requestAnimationFrame(function loop() {
    render();
    requestAnimationFrame(loop);
  });
}

function render(): void {
  uniforms["u_time"].value = performance.now() / 1000;
  renderer.render(scene, camera);
}

function onWindowResize(): void {
  uniforms["u_resolution"].value = [window.innerWidth, window.innerHeight];
  renderer.setSize(window.innerWidth, window.innerHeight);
}
