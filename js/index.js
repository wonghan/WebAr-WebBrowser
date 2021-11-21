THREEx.ArToolkitContext.baseURL = '../'
// init renderer
var renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0)
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.domElement.style.position = 'absolute'
renderer.domElement.style.top = '0px'
renderer.domElement.style.left = '0px'
document.body.appendChild( renderer.domElement );

var rendererCSS3D = new THREE.CSS3DRenderer();
rendererCSS3D.setSize( window.innerWidth, window.innerHeight );
rendererCSS3D.domElement.style.position = 'absolute';
rendererCSS3D.domElement.style.top = '0px';
rendererCSS3D.domElement.style.left = '0px';
document.body.appendChild( rendererCSS3D.domElement );

// array of functions for the rendering loop
var onRenderFcts= [];

// init scene and camera
var scene	= new THREE.Scene();

//////////////////////////////////////////////////////////////////////////////////
//		Initialize a basic camera
//////////////////////////////////////////////////////////////////////////////////

// Create a camera
var camera = new THREE.PerspectiveCamera();
scene.add(camera);

////////////////////////////////////////////////////////////////////////////////
//          handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

var arToolkitSource = new THREEx.ArToolkitSource({
    // to read from the webcam
    sourceType : 'webcam',

    // // to read from an image
    // sourceType : 'image',
    // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

    // to read from a video
    // sourceType : 'video',
    // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
})

arToolkitSource.init(function onReady(){
    setTimeout(() => {
        onResize()
    }, 2000);
})

// handle resize
window.addEventListener('resize', function(){
    onResize()
})

function onResize(){
    arToolkitSource.onResizeElement()
    arToolkitSource.copyElementSizeTo(renderer.domElement)
rendererCSS3D.setSize( window.innerWidth, window.innerHeight );
// 	if (window.innerWidth > window.innerHeight) {
//     //landscape
//     rendererCSS3D.domElement.style.transform = 'scale(0.1)';
//   } else {
//   	rendererCSS3D.domElement.style.transform = 'scale(0.1)';
//   }
    if( arToolkitContext.arController !== null ){
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
    }
}
////////////////////////////////////////////////////////////////////////////////
//          initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////


// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: THREEx.ArToolkitContext.baseURL + 'sources/camera_para.dat',
    detectionMode: 'mono',
})
// initialize it
arToolkitContext.init(function onCompleted(){
    // copy projection matrix to camera
    camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
})

// update artoolkit on every frame
onRenderFcts.push(function(){
    if( arToolkitSource.ready === false )	return

    arToolkitContext.update( arToolkitSource.domElement )

    // update scene.visible if the marker is seen
    scene.visible = camera.visible
})

////////////////////////////////////////////////////////////////////////////////
//          Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

// init controls for camera
var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
    type : 'pattern',
    patternUrl : THREEx.ArToolkitContext.baseURL + 'sources/patt.hiro',
    // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
    // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
    changeMatrixMode: 'cameraTransformMatrix'
})
// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

// add html
var url		= 'https://www.bilibili.com/';
var domElement	= document.createElement('iframe');
domElement.src	= url;
domElement.id = "iframe_1";
domElement.name = "iframe_1";
console.log('domElement',domElement)
domElement.style.height = '640px';
domElement.style.width = '1280px';
domElement.style.border	= 'none';

var obj = new THREE.CSS3DObject( domElement );
obj.position.x = 0; 
obj.position.y = 0;
obj.position.z = -1000;
scene.add(obj)

//////////////////////////////////////////////////////////////////////////////////
//		render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(function(){
    renderer.render( scene, camera );
    rendererCSS3D.render( scene, camera );
})

// run the rendering loop
var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
    // keep looping
    requestAnimationFrame( animate );
    // measure time
    lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
    var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
    lastTimeMsec	= nowMsec
    // call each update function
    onRenderFcts.forEach(function(onRenderFct){
        onRenderFct(deltaMsec/1000, nowMsec/1000)
    })
})