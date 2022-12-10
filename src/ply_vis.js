import React from "react";
import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter.js";

var container;
var camera, scene, renderer, controls;
var strokes = [];
var redoStrokes = [];

function downloadPly() {
    // create mesh from point cloud
    const mesh = new THREE.Mesh(scene.getObjectByName('trans_ply').geometry, scene.getObjectByName('trans_ply').material);

    // Instantiate an exporter
    const exporter = new PLYExporter();

    // Parse the input and generate the ply output
    const data = exporter.parse(mesh);

    // download ply
    const element = document.createElement("a");
    const file = new Blob([data], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "traced_ply.ply";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

function undo() {
    // const color = new THREE.Color(0xeb3f1c);
    const colorAttribute = scene.getObjectByName('trans_ply').geometry.getAttribute( 'color' );
    const vertexColor = scene.getObjectByName('ply').geometry.getAttribute( 'color' );
    const stroke = strokes.pop();
    redoStrokes.push(stroke);

    for (var i = 0; i < stroke.length; i++) {
        const color = new THREE.Color(vertexColor.getX(stroke[i]), vertexColor.getY(stroke[i]), vertexColor.getZ(stroke[i]));   
        colorAttribute.setXYZ( stroke[i], color.r, color.g, color.b );
    }
    colorAttribute.needsUpdate = true;
}

function redo() {
    const color = new THREE.Color(0x3dc236);
    const colorAttribute = scene.getObjectByName('trans_ply').geometry.getAttribute( 'color' );
    const stroke = redoStrokes.pop();
    strokes.push(stroke);

    for (var i = 0; i < stroke.length; i++) {   
        colorAttribute.setXYZ( stroke[i], color.r, color.g, color.b );
    }
    colorAttribute.needsUpdate = true;
}

export default function PLYvis() {
  return <div></div>;
}

init();
// animate();

function init() {
    //download button
    const btn = document.createElement("button");
    btn.innerHTML = "Download PLY";
    document.body.appendChild(btn);
    btn.addEventListener('click', () => downloadPly());

    //undo button
    const undoBtn = document.createElement("button");
    undoBtn.id = "undo";
    undoBtn.innerHTML = "Undo";
    // if (strokes.length === 0) {
    //     undoBtn.disabled = true;
    // } else {
    //     undoBtn.disabled = false;
    // }
    document.body.appendChild(undoBtn);
    undoBtn.addEventListener('click', () => undo());

    //redo button
    const redoBtn = document.createElement("button");
    redoBtn.id = "redo";
    redoBtn.innerHTML = "Redo";
    document.body.appendChild(redoBtn);
    redoBtn.addEventListener('click', () => redo());

    //div container for 3D object
    container = document.createElement("div");
    document.body.appendChild(container);

    //set up raycaster
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(null, null);
    console.log(mouse)

    //initialize camera position
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 150);
    camera.position.z = 2;
    camera.position.set(-35, 35, 35);

    //initialize scene
    scene = new THREE.Scene();
    // scene.add(new THREE.AxesHelper(30));
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

    //variable for tracking drawing mode
    var drawingMode = false;
    //mouse position for drawing 
    document.addEventListener("mousedown", function(event){
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        if (event.shiftKey && event.which === 1) {
            strokes.push([]);
            drawingMode = true;
            controls.enabled = false;
            controls.update();
        } else {
            drawingMode = false;
            controls.update();
        }

        document.onmousemove = function(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }
    });
    
    document.addEventListener("mouseup", function(event){
        document.onmousemove = null;
        controls.enabled = true;
        controls.update();
    });

    function animate() {
        if (drawingMode === true) {
            raycaster.setFromCamera(mouse, camera);
            // TO DO: set raycaster threshold and tracing color interactively
            raycaster.params.Points.threshold = 0.3;

            var intersects = raycaster.intersectObjects(scene.children);
            
            for (var i = 0; i < intersects.length; i++) {

                const index = intersects[i].index;

                var stroke = strokes.length-1;

                if (!strokes[stroke].includes(index)) {
                    // console.log(index);
                    strokes[stroke].push(index);
                } 

                // tracing color
                // const color = new THREE.Color(0xeb3f1c);
                // const color = new THREE.Color(0xf0d62e);
                const color = new THREE.Color(0x3dc236);

                const colorAttribute = intersects[i].object.geometry.getAttribute( 'color' );

                colorAttribute.setXYZ( index, color.r, color.g, color.b );

                colorAttribute.needsUpdate = true;
            }

            // var strokesString = JSON.stringify(strokes);
            // if (strokePoints.length > 0 && !strokes.includes(strokePoints)) {
            //     var strokePointsString = JSON.stringify(strokePoints);
            //     var c = strokesString.indexOf(strokePointsString);
            //     if(c == -1){
            //         strokes.push(strokePoints);
            //     }
            // }  
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
        controls.update();
    }

    //initialize ply loader
    let plyLoader = new PLYLoader();

    plyLoader.load(
        "R0149.ply",
        function (geometry) {
            geometry.computeVertexNormals();
            const material = new THREE.PointsMaterial( { size: 0.01, vertexColors: true } );
            // const mesh = new THREE.Points( geometry, material );
            const mesh = new THREE.Mesh( geometry, material );
            mesh.name = 'ply';
            mesh.position.z -= .01;
            mesh.updateMatrixWorld();
            scene.add( mesh );
            renderer.render(scene, camera)
            animate();
            console.log(scene.getObjectByName('ply'));

        },
        // called when loading is in progress
        function (xhr) {
            console.log(xhr);
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        // called when loading has errors
        function (error) {
            console.log("An error happened");
            console.log(error);
        }
    );

    let transPlyLoader = new PLYLoader();

    transPlyLoader.load(
        "R0149.ply",
        function (geometry) {
            geometry.computeVertexNormals();
            const material = new THREE.PointsMaterial({ 
                size: 0.2, 
                vertexColors: true, 
            });
            const mesh = new THREE.Points( geometry, material );
            mesh.name = 'trans_ply';
            mesh.updateMatrixWorld();
            scene.add(mesh);
            renderer.render(scene, camera)
            animate();
            console.log(scene.getObjectByName('trans_ply'));
        },
        // called when loading is in progress
        function (xhr) {
            console.log(xhr);
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        // called when loading has errors
        function (error) {
            console.log("An error happened");
            console.log(error);
        }
    );
}