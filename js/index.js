THREEx.ArToolkitContext.baseURL = '/WebAr-WebBrowser/';
var iframeBrowser = null;
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
    sourceWidth: window.innerWidth,
    sourceHeight: window.innerHeight,
    displayWidth: window.innerWidth,
    displayHeight: window.innerHeight,

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
    changeMatrixMode: 'cameraTransformMatrix',
    size: 1,
    smooth: true,
})
// as we do changeMatrixMode: 'cameraTransformMatrix', start with invisible scene
scene.visible = false
var iframeBrowserDebounceCount = 0;
onRenderFcts.push(function(){
    if(iframeBrowser){
        if(markerControls.object3d.visible){
            iframeBrowserDebounceCount = 0;
            iframeBrowser.style.visibility = 'visible';
        }else{
            iframeBrowserDebounceCount++;
            // debounce
            if(iframeBrowserDebounceCount===20){
                iframeBrowserDebounceCount = 0;
                iframeBrowser.style.visibility = 'hidden';
            }
        }
        
    }
})

//////////////////////////////////////////////////////////////////////////////////
//		add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

// var material = new THREE.MeshBasicMaterial({ wireframe: true});
// var geometry = new THREE.PlaneGeometry();
// var planeMesh = new THREE.Mesh( geometry, material);
// scene.add(planeMesh);

// add html

var browserEle = createWebBrowser();
var obj = new THREE.CSS3DObject(browserEle);
obj.position.x = 0;
obj.position.y = -300;
obj.position.z = -1500;
scene.add(obj);

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
// add window.load events
window.addEventListener('load',function(){
    addJumpUrlEvent();
    getElementByIdAsync('iframe-browser', function(ele){
        iframeBrowser = ele;
    })
})

function createWebBrowser(){
    var browserDiv = document.createElement('div');
    browserDiv.id = 'iframe-browser';
    browserDiv.style.width =  '1280px';
    browserDiv.style.height = '720px';
    
    browserDiv.style.visibility = 'hidden';
    
    var addressBarDiv = document.createElement('div');
    addressBarDiv.style={
        height: '30px',
        width: '100%',
        display: 'flex',
        flexFlow: 'row nowrap'
    }
    browserDiv.appendChild(addressBarDiv);



    var inputEle = document.createElement('input');
    inputEle.id = "address-bar-input";
    inputEle.style={
        height: '100%',
        width: '100%',
        borderRadius: '4px'
    }
    addressBarDiv.appendChild(inputEle);

    var ButtonEle = document.createElement('button');
    ButtonEle.id = "address-bar-button"
    ButtonEle.type='button';
    ButtonEle.innerText='Jump';
    ButtonEle.style={
        height: '100%',
        width: '100%',
        borderRadius: '4px'
    }
    addressBarDiv.appendChild(ButtonEle);
    
    var iframeEle	= document.createElement('iframe');
    iframeEle.src	= 'https://www.bilibili.com';
    iframeEle.id = "iframe_1";
    iframeEle.name = "iframe_1";
    iframeEle.height = '100%';
    iframeEle.width = '100%';
    iframeEle.sandbox= "allow-downloads-without-user-activation allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-storage-access-by-user-activation";
    iframeEle.style.border = 'none';
    browserDiv.appendChild(iframeEle);

    return browserDiv;
}
function addJumpUrlEvent(){
    getElementByIdAsync('iframe_1',(iframe)=>
        getElementByIdAsync('address-bar-input', (input)=>
            getElementByIdAsync('address-bar-button', (button)=>{
                button.addEventListener('click', function(e){
                    var val = input.value;
                    console.log('val', val)
                    if(!val){
                        return false;
                    }
                    iframe.src = val;
                    input.value = '';
                })
            })));
    console.log('addJumpUrlEvent')
}
function getElementByIdAsync(id, callback, delay=200){
    if(typeof id!=='string'){
        console.error("function getElementByIdAsync error: id!=='string'");
        return false;
    }
    if(id===''){
        console.error("function getElementByIdAsync error: id===''");
        return false;
    }
    if(typeof callback !== 'function'){
        console.error("function getElementByIdAsync error: typeof callback !== 'function'");
        return false;
    }
    var interval = setInterval(function(e){
        var ele = document.getElementById(id);
        if(ele){
            clearInterval(interval)
            callback(ele);
        }
    },delay)
}
