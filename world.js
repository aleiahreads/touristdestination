import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { MinMaxGUIHelper } from './GUIHelper.js';
import { FogGUIHelper } from './FogGUIHelper.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
// Switch between the cameras, set to camera
let currentCamera = 'camera1';

function main() {
    const view1Elem = document.querySelector('#view1');
    const view2Elem = document.querySelector('#view2');
    // Set the size of the renderer to match the window dimensions
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;  // This enables shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create perspective camera
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight; //2;  // the canvas default
    const near = 0.1;
    const far = 50;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 6;

    // Second perspective camera
    const camera2 = new THREE.PerspectiveCamera(
        60,  // fov
        2,   // aspect
        0.1, // near
        500, // far
    );

    camera2.position.set(40, 10, 30);
    camera2.lookAt(0, 5, 0);
    const cameraHelper = new THREE.CameraHelper(camera);

    /*
    function updateCamera() {
		camera.updateProjectionMatrix();
        console.log('Near:', camera.near, 'Far:', camera.far);
        console.log("camera is updated")
	}*/

    // gui stuff
    const gui = new GUI();
    gui.add(camera, 'fov', 1, 180)  //.onChange(updateCamera);
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    gui.add(minMaxGUIHelper, 'min', 0.1, 60, 0.1).name('near') //.onChange(updateCamera);
    gui.add(minMaxGUIHelper, 'max', 0.1, 60, 0.1).name('far')  //.onChange(updateCamera);

    // texture stuff
    const loader = new THREE.TextureLoader(); // create a TextureLoader

    // Camera1 controls
    const controls = new OrbitControls( camera, view1Elem ); // used to be canvas, now only control view1Elem
	//controls.target.set( 0, 5, 0 );
	controls.update();
  
    const controls2 = new OrbitControls(camera2, view2Elem);
    //controls2.target.set(0, 5, 0);
    controls2.update();
      
    // Create scene
    const scene = new THREE.Scene();
    scene.add(cameraHelper); 
    scene.fog = new THREE.Fog('lightblue', near, far); // add fog
    scene.background = new THREE.Color( 'skyblue' ); 

    // fog gui helper
    const fogGUIHelper = new FogGUIHelper(scene.fog);
    gui.add(fogGUIHelper, 'near', near, far).listen();
    gui.add(fogGUIHelper, 'far', near, far).listen();

    // create a BoxGeometry which contains the data for a box.
    const boxWidth = 1.5;
    const boxHeight = 1.5;
    const boxDepth = 1.5;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Lights
    const dirColor = 0xFFFFFF;
    const dirIntensity = 3;
    const dirLight = new THREE.DirectionalLight(dirColor, dirIntensity);
    dirLight.position.set(-1, 2, 4);
    dirLight.castShadow = true; // Only this light casts shadows
    dirLight.shadow.mapSize.width = 512;  // Resolution of the shadow map
    dirLight.shadow.mapSize.height = 512; // Resolution of the shadow map
    dirLight.shadow.bias = -0.005; // This can help with shadow acne artifacts
    scene.add(dirLight);

    const ambColor = 0xFFFFFF;
    const ambIntensity = 1;
    const ambLight = new THREE.AmbientLight(ambColor, ambIntensity);
    scene.add(ambLight);

    const spotColor = 0xFFFFF;
    const spotIntensity = 150;
    const spotLight = new THREE.SpotLight(spotColor, spotIntensity);
    spotLight.angle = Math.PI/4;
    spotLight.penumbra = 0.2;
    spotLight.castShadow = false;
    scene.add(spotLight);
    //spotLight.position.set(-2, 1, 0); // so light shines directly down
    //scene.add(spotLight.target);

    // Make ground plane
    const planeSize = 60;
    const grassTexture = loadColorTexture('images/grass.png', loader);
    // Set texture wrapping to repeat (default is clamp to edge)
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.magFilter = THREE.NearestFilter;
    grassTexture.colorSpace = THREE.SRGBColorSpace;
    grassTexture.repeat.set(planeSize/2, planeSize/2);

    // Create a large plane geometry
    const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize);  // 100x100 is an example, adjust size as needed
    const planeMaterial = new THREE.MeshStandardMaterial({ map: grassTexture, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    // Rotate the plane so it's flat on the ground
    plane.rotation.x = - Math.PI / 2; // Rotate by 90 degrees to make the plane horizontal
    plane.position.y = -4;
    plane.receiveShadow = true; // enable ground to receive shadows
    scene.add(plane);

    /*
    // Shadows stuff
    const shadowTexture = loader.load('images/roundshadow.png');
    // an array to remeber each object and their shaddow
    const sobjectShadowBases = [];
    
    const planeSize = 1;
    const shadowGeo = new THREE.PlaneGeometry(planeSize, planeSize);
*/

    // Skybox
    const cubeLoader = new THREE.CubeTextureLoader();
    const skyTexture = cubeLoader.load([
      'images/px.png',
      'images/nx.png',
      'images/py.png',
      'images/ny.png',
      'images/pz.png',
      'images/nz.png',
    ]);
    skyTexture.minFilter = THREE.LinearFilter; // Use linear filter for smoother transitions
    skyTexture.magFilter = THREE.LinearFilter; // Ensures the image doesn't get pixelated
    skyTexture.encoding = THREE.sRGBEncoding;
    scene.background = skyTexture;

    // Phong material and set its color
    // Colors can be specified using standard CSS style 6 digit hex color values.
    //const material = new THREE.MeshPhongMaterial({color: 0x44aa88});

    // Create Mesh (represents the combination of 3 things:
    // 1. A Geometry (the shape of the object)
    // 2. A Material (how to draw object, shiny or flat, what color, what texture(s) to apply. Etc.)
    // 3. The position, orientation, and scale of that object in the scene relative to its parent. 
    
    // 6 different texture -> 6 different materials and pass them as an array when we create Mesh
    const materials = [
        new THREE.MeshStandardMaterial({map: loadColorTexture('images/flower-1.jpg', loader)}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('images/flower-2.jpg', loader)}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('images/flower-3.jpg', loader)}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('images/flower-4.jpg', loader)}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('images/flower-5.jpg', loader)}),
        new THREE.MeshStandardMaterial({map: loadColorTexture('images/flower-6.jpg', loader)}),
    ];
    const cube = new THREE.Mesh(geometry, materials);
    cube.castShadow = true; 
    scene.add(cube);
    cube.position.set(0, 1, 2.2);
    spotLight.target = cube;
    

    // Load 3d bunnies
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('images/gltf/bunny_gltf.glb', function (bunny) {
        bunny.scene.position.set(0, -3.95, -1); // Position the bunny in the scene
        
        // Traverse through all meshes of the bunny and enable shadow casting
        bunny.scene.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;   // Allow the bunny to cast shadows
                child.receiveShadow = true; // Allow the bunny to receive shadows
            }
        });
        scene.add(bunny.scene);
    });
/*
    // Rest of the shapes for the scene
    const sphereGeo = new THREE.SphereGeometry(2, 32, 16);
    const sphereMat = new THREE.MeshStandardMaterial({color: '#CA8'});
    const sphere1 = new THREE.Mesh(sphereGeo, sphereMat);
    sphere1.castShadow = true; 
    sphere1.position.set(5, -2, -2);
    scene.add(sphere1);
*/
    const coneGeo = new THREE.ConeGeometry( 1, 3, 32 ); 
    const coneMaterial = new THREE.MeshStandardMaterial( {color: 'skyblue'} );
    const cone1 = new THREE.Mesh(coneGeo, coneMaterial ); scene.add( cone1 );
    cone1.castShadow = true; 
    cone1.position.set(0,-2.45, 2);

    const tableGeo = new THREE.BoxGeometry(4,.2, 4);
    const tableMat = new THREE.MeshStandardMaterial({color: 'skyblue'});
    const tableTop = new THREE.Mesh(tableGeo, tableMat);
    tableTop.position.set(0,-.75,2);
    tableTop.castShadow = true;
    scene.add(tableTop);

    // donut stand
    const donutTexture = loader.load('images/donut.jpg');
    const donGeometry = new THREE.TorusGeometry( 5, 2, 16, 100 ); //{ color: 0xffff00 } ); 
    const donMaterial = new THREE.MeshStandardMaterial({
        map: donutTexture // Apply the texture to the material
    });       
    const donut = new THREE.Mesh( donGeometry, donMaterial ); scene.add( donut );
    donut.position.set(0, 14, -8);
    donut.castShadow = true;

    const standGeo = new THREE.BoxGeometry(10,5, 3);
    const standMat = new THREE.MeshStandardMaterial({color: 0xfec0ff});
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.set(0, -1.95, -8);
    stand.castShadow = true;
    scene.add(stand);

    const poleGeometry = new THREE.CylinderGeometry( .5, .5, 15, 32 ); 
    const poleMaterial = new THREE.MeshStandardMaterial( {color: 0xE5E4E2} ); 
    const poleCylinder1 = new THREE.Mesh( poleGeometry, poleMaterial ); scene.add( poleCylinder1 );
    poleCylinder1.castShadow = true;
    poleCylinder1.position.set(4.5, 5.5, -8);
    const poleCylinder2 = new THREE.Mesh( poleGeometry, poleMaterial ); scene.add( poleCylinder2 );
    poleCylinder2.castShadow = true;
    poleCylinder2.position.set(-4.5, 5.5, -8);

    const pyramidTex = loader.load('images/rocks.jpg');
    const pyramidHeight = 20;
    const pyramidBaseWidth = 17;
    const pyramidGeometry = new THREE.ConeGeometry(pyramidBaseWidth, pyramidHeight, 4); // 4 segments for square base
    const pyramidMaterial = new THREE.MeshStandardMaterial({ //color: 0xFFFF00 }); // Yellow material
        map: pyramidTex
    });
    const pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    pyramid.castShadow = true;
    pyramid.position.set(20, 0, 4);
    scene.add(pyramid);

    // ball pit
    const pitWidth = 10;
const pitHeight = 2;
const pitDepth = 10;
const wallThickness = 0.2; // Added thickness to the walls

// Create the pit by adding 5 sides (no top)
const pitMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x4E9F3D }), // Front
    new THREE.MeshStandardMaterial({ color: 0x4E9F3D }), // Back
    new THREE.MeshStandardMaterial({ color: 0x4E9F3D }), // Bottom
    new THREE.MeshStandardMaterial({ color: 0x4E9F3D }), // Left
    new THREE.MeshStandardMaterial({ color: 0x4E9F3D })  // Right
];

// Front Wall (using BoxGeometry instead of PlaneGeometry)
const front = new THREE.Mesh(new THREE.BoxGeometry(pitWidth, pitHeight, wallThickness), pitMaterials[0]);
// Back Wall
const back = new THREE.Mesh(new THREE.BoxGeometry(pitWidth, pitHeight, wallThickness), pitMaterials[1]);
// Bottom Wall (fixed rotation to be horizontal)
const bottom = new THREE.Mesh(new THREE.BoxGeometry(pitWidth, wallThickness, pitDepth), pitMaterials[2]);
// Left Wall
const left = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, pitHeight, pitDepth), pitMaterials[3]);
// Right Wall
const right = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, pitHeight, pitDepth), pitMaterials[4]);

// Position the sides of the pit
front.position.set(0, 0, pitDepth / 2); // Front wall
back.position.set(0, 0, -pitDepth / 2); // Back wall
bottom.position.set(0, -pitHeight / 2, 0); // Bottom wall (horizontal position)
left.position.set(-pitWidth / 2, 0, 0); // Left wall
right.position.set(pitWidth / 2, 0, 0); // Right wall

// Create a group to hold all pit walls
const pitGroup = new THREE.Group();
pitGroup.add(front);
pitGroup.add(back);
pitGroup.add(bottom);
pitGroup.add(left);
pitGroup.add(right);

// Add the group to the scene
scene.add(pitGroup);

// Create Balls
const numBalls = 100; // Number of balls in the pit
const ballRadius = 0.5; // Radius of each ball
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xFF5733 }); // Red color for balls

const balls = [];

for (let i = 0; i < numBalls; i++) {
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);

    // Random position inside the pit (adjusting to fit within pit boundaries)
    const x = Math.random() * (pitWidth - 2 * ballRadius) - (pitWidth / 2 - ballRadius);  // Random X inside the pit
    const y = Math.random() * 1 + 0.5;  // Random Y (start above the pit bottom)
    const z = Math.random() * (pitDepth - 2 * ballRadius) - (pitDepth / 2 - ballRadius);  // Random Z inside the pit

    ball.position.set(x, y, z);

    balls.push(ball);
    pitGroup.add(ball);
}


pitGroup.position.set(-15, -2.9, 0);





   /* 
    // Render by calling the renderer's render function and passing it the scene and camera
    //renderer.render(scene, camera);
    function render( time ) {

        time *= 0.001; // convert time to seconds

		cube.rotation.x = time;
		cube.rotation.y = time;

		renderer.render( scene, camera );

		requestAnimationFrame( render );

	}
*/
    const switchCameraButton = document.querySelector('#switchCameraButton');
    // Button event listener to toggle between cameras
    switchCameraButton.addEventListener('click', () => {
        if (currentCamera === 'camera1') {
            currentCamera = 'camera2';
        } else {
            currentCamera = 'camera1';
        }
        render();
    });

    const clock = new THREE.Clock();  // Create a clock to manage time-based updates

    function render() {
        // Rotate the cube every frame 
        const delta = clock.getDelta();  // Time in seconds between the last two frames
        // Rotate the cube smoothly based on delta time
        cube.rotation.x += delta * 0.5; // Rotate 0.5 radians per second around X axis
        cube.rotation.y += delta * 0.5; // Rotate 0.5 radians per second around Y axis

		renderer.render( scene, camera );

		requestAnimationFrame( render );
		resizeRendererToDisplaySize( renderer );
		
        // turn on the scissor
		renderer.setScissorTest( true );
		// render the current view
		if (currentCamera == 'camera1') {
			//const aspect = setScissorForElement( view1Elem );
			renderer.setScissor(0, 0, canvas.width, canvas.height);
            renderer.setViewport(0, 0, canvas.width, canvas.height);
            
            camera.aspect = canvas.width / canvas.height;
            //camera.aspect = aspect;
			camera.updateProjectionMatrix();
			cameraHelper.update();
            cameraHelper.visible = false;

			//scene.background.set( 0x000000 );

			// render
            controls.update();
			renderer.render( scene, camera );

		} else { // render from the 2nd camera
			//const aspect = setScissorForElement( view2Elem );
            // Set the viewport and scissor to fill the entire canvas
            renderer.setScissor(0, 0, canvas.width, canvas.height);
            renderer.setViewport(0, 0, canvas.width, canvas.height);
			// adjust the camera for this aspect
			camera2.aspect = canvas.width / canvas.height;
            //camera2.aspect = aspect;
			camera2.updateProjectionMatrix();

			// draw the camera helper in the 2nd view
			cameraHelper.visible = true;

			//scene.background.set( 0x000040 );
            controls2.update();
			renderer.render( scene, camera2 );
		}
        
		//requestAnimationFrame( render );

	}
	requestAnimationFrame( render );
}


function loadColorTexture( path, texLoader ) {
    const texture = texLoader.load( path );
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function setScissorForElement(elem) {
    const canvasRect = canvas.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();
   
    // compute a canvas relative rectangle
    const right = Math.min(elemRect.right, canvasRect.right) - canvasRect.left;
    const left = Math.max(0, elemRect.left - canvasRect.left);
    const bottom = Math.min(elemRect.bottom, canvasRect.bottom) - canvasRect.top;
    const top = Math.max(0, elemRect.top - canvasRect.top);
   
    const width = Math.min(canvasRect.width, right - left);
    const height = Math.min(canvasRect.height, bottom - top);
   
    // setup the scissor to only render to that part of the canvas
    const positiveYUpBottom = canvasRect.height - bottom;
    renderer.setScissor(left, positiveYUpBottom, width, height);
    renderer.setViewport(left, positiveYUpBottom, width, height);
   
    // return the aspect
    return width / height;
}

function resizeRendererToDisplaySize( renderer ) {

    const canvas1 = renderer.domElement;
    const width = canvas1.clientWidth;
    const height = canvas1.clientHeight;
    const needResize = canvas1.width !== width || canvas1.height !== height;
    if ( needResize ) {

        renderer.setSize( width, height, false );

    }

    return needResize;

}

window.onload = main;