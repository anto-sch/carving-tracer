import React from "react";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

var container;
var camera, scene, renderer, controls;

export default function PLYvis() {
  return <div></div>;
}

init();
animate();

function init() {
    //div container for 3D object
    container = document.createElement("div");
    document.body.appendChild(container);

    //initialize camera position
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 150);
    camera.position.z = 2;
    camera.position.set(0, 9, 100);

    //initialize scene
    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(30));
    // add scene lighting  
    const light = new THREE.SpotLight()
    light.position.set(20, 20, 20)
    scene.add(light)

    //initialize renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    //add renderer to DOM
    container.appendChild(renderer.domElement);

    //initialize interactive controls to move in scene
    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    //initialize ply loader
    const plyLoader = new PLYLoader();
    
    //test with taurus knot
    // const torusKnotGeometry = new THREE.TorusKnotGeometry()
    // const material = new THREE.MeshStandardMaterial({ color: 'red'})
    // const torusKnot = new THREE.Mesh(torusKnotGeometry, material)
    // torusKnot.position.x = 0
    // torusKnot.name = 'torus';
    // scene.add(torusKnot)

    plyLoader.load(
        "R0149.ply",
        function (geometry) {
            geometry.computeVertexNormals();
            const material = new THREE.PointsMaterial( { size: 0.01, vertexColors: true } );
            // const mesh = new THREE.Points( geometry, material );
            const mesh = new THREE.Mesh( geometry, material );
            mesh.name = 'ply';
            scene.add( mesh );
            console.log(scene.getObjectByName('ply'));
        },
        // called when loading is in progress
        function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        // called when loading has errors
        function (error) {
        console.log("An error happened");
        console.log(error);
        }
    );
    }

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    controls.update();
}