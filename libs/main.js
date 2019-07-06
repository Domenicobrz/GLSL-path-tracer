window.addEventListener("load", init);

var scene;
var postProcScene;
var camera;
var postProcCamera;
var controls;
var renderer;
var canvas;
var offscreenRT;

var pathTracerMaterial;

var context;
var imageDataObject;
var canvasSize = 400;
var radianceBuffer = [];
var samples = 0;
var exposure = 30.5;
var trianglesCount = 450;   


var tileSize = 5000;
var tilesCount;
var currentTileIndex = 0;
var xTilesCount;
var yTilesCount;


var dataTextureSize = 2048;
var trianglesTexture;
var bvhTexture;



var canvasWidth = 1200;
var canvasHeight = 800;



function init() {    
    canvas = document.createElement("canvas");
    var context = canvas.getContext( 'webgl2' );
    renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(canvasWidth, canvasHeight );
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);

    scene  = new THREE.Scene();
    scene.background = null;
    postProcScene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 45, canvasWidth / canvasHeight, 2, 200 );
    camera.position.set(0, 0, 20);

    postProcCamera = new THREE.PerspectiveCamera( 20, canvasWidth / canvasHeight, 2, 200 );
    postProcCamera.position.set(0, 0, 10);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.rotateSpeed     = 1;
	// controls.minAzimuthAngle = -Infinity; 
	// controls.maxAzimuthAngle = +Infinity; 
	// controls.minPolarAngle   = 0.85;      
    // controls.maxPolarAngle   = Math.PI - 0.85; 


    createMeshes();

    let pathTracerQuad = new THREE.PlaneBufferGeometry(2,2);
    pathTracerMaterial = new THREE.ShaderMaterial({
        uniforms: {
            trianglesDataTexture: { type: "t", value: trianglesTexture },
            bvhDataTexture:       { type: "t", value: bvhTexture },
            uScreenSize:          { value: new THREE.Vector2(canvasWidth, canvasHeight) },
            uDataTextureSize:     { value: dataTextureSize },
            uRandomVec4:          { value: new THREE.Vector4(0,0,0,0) },
            uTime:                { value: 0 },
        },
        side: THREE.DoubleSide,
        vertexShader: pathtracerv,
        fragmentShader: pathtracerf,

        depthTest:      false,

        blending:      THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc:      THREE.OneFactor, 
        blendSrcAlpha: THREE.OneFactor,
        blendDst:      THREE.OneFactor, 
        blendDstAlpha: THREE.OneFactor,  
    });
    let pathTracerMesh = new THREE.Mesh(pathTracerQuad, pathTracerMaterial);
    pathTracerMesh.position.set(0, 0, -50); // to avoid frustum culling, there's no other reason to set a position on this mesh

    scene.add(pathTracerMesh);





    
    offscreenRT = new THREE.WebGLRenderTarget(canvasWidth, canvasHeight, {
        stencilBuffer: false,
        depthBuffer: false,
        type: THREE.FloatType,
    });

    var postProcQuadGeo = new THREE.PlaneBufferGeometry(2,2);
    postProcQuadMaterial = new THREE.ShaderMaterial({
        vertexShader: postprocv,
        fragmentShader: postprocf,
        uniforms: {
            uTexture: { type: "t", value: offscreenRT.texture },
            uSamples: { value: samples },
            uExposure: { value: exposure },
            uBackgroundColor: new THREE.Uniform(new THREE.Vector3(21/255, 16/255, 16/255)),
        },
        side: THREE.DoubleSide,
    });
    postProcScene.add(new THREE.Mesh(postProcQuadGeo, postProcQuadMaterial));


    tilingSetup();
    render();

    console.log("intersections made (in total, all samples) " + intersectionTestsMade);
    console.log("aabb intersections made (in total, all samples) " + aabbIntersectionTestsMade);
    console.log("intersections per pixel: " + (aabbIntersectionTestsMade / (canvasSize*canvasSize)));
    console.log("intersections ratio without BVH: " + ((canvasSize*canvasSize*trianglesCount) / (aabbIntersectionTestsMade) )    );
}  

function tilingSetup() {
    xTilesCount = Math.floor(canvasWidth / tileSize) + 1;
    yTilesCount = Math.floor(canvasHeight / tileSize) + 1;

    tilesCount = xTilesCount * yTilesCount;
}

function render(now) {
    requestAnimationFrame(render);

    controls.update();

    let tile_x = currentTileIndex % xTilesCount;
    let tile_y = Math.floor(currentTileIndex / xTilesCount);

    let px = tile_x * tileSize;
    let py = tile_y * tileSize;
    let ex = (tile_x + 1) * tileSize;
    let ey = (tile_y + 1) * tileSize;
    if(ex > canvasWidth) ex = canvasWidth;
    if(ey > canvasHeight) ey = canvasHeight;

    // renderer.setScissorTest(true);
    // renderer.setScissor(px, py, ex - px, ey - py);
    // renderer.setViewport( 0, 0, canvasWidth, canvasHeight );

    offscreenRT.scissor.set(px, py, ex - px, ey - py);
    offscreenRT.scissorTest = true;

    
    if(currentTileIndex === 0) {
        samples++;    
        // updating this uniform here ensures all tiles have the same set of random values
        pathTracerMaterial.uniforms.uRandomVec4.value = new THREE.Vector4(Math.random(), Math.random(), Math.random(), Math.random());
        pathTracerMaterial.uniforms.uTime.value = now;
    }
    // for(let i = 0; i < 5; i++) {
        renderer.setRenderTarget(offscreenRT);
        renderer.render(scene, camera);
    // }

    // renderer.setScissor(0, 0, canvasWidth, canvasHeight);
    // renderer.setScissorTest(false);

    currentTileIndex = (++currentTileIndex) % tilesCount;


    postProcQuadMaterial.uniforms.uSamples.value = Math.max(samples, 1);
    postProcQuadMaterial.uniforms.uExposure.value = exposure;
    renderer.setRenderTarget(null);
    renderer.render(postProcScene, postProcCamera);
}



function createMeshes() {
    // var geometry  = new THREE.BufferGeometry();
    // var position = [];
    // var color    = [];

    let objects  = [];

    // for(let i = -1; i <= 1; i++) {
    //     for(let j = -1; j <= 1; j++) {
    //         // let lx1 = i * 2;
    //         // let ly1 = j * 2 + 1;
    //         // let lz1 = 11 + i;
            
    //         // let lx2 = i * 2 - 0.5; 
    //         // let ly2 = j * 2;
    //         // let lz2 = 11 + i;
        
    //         // let lx3 = i * 2 + 0.5; 
    //         // let ly3 = j * 2;
    //         // let lz3 = 11 + i;

    //         let lx1 = Utils.rand() * 20 - 10;
    //         let ly1 = Utils.rand() * 20 - 10;
    //         let lz1 = 12;
            
    //         let lx2 = lx1 - 1;
    //         let ly2 = ly1 - 1;
    //         let lz2 = lz1 - 0.5;
        
    //         let lx3 = lx1 + 1; 
    //         let ly3 = ly1 - 1;
    //         let lz3 = lz1 + 0.5;
        
    //         let object  = new Triangle(lx1, ly1, lz1, lx2, ly2, lz2, lx3, ly3, lz3);
    //         objects.push(object);
    //     }
    // }

    
// {
//     let lx1 = 0;
//     let ly1 = 1;
//     let lz1 = 5;

//     let lx2 = -0.5; 
//     let ly2 = 0;
//     let lz2 = 5;

//     let lx3 = 0.5; 
//     let ly3 = 0;
//     let lz3 = 5;

//     let object  = new Triangle(lx1, ly1, lz1, lx2, ly2, lz2, lx3, ly3, lz3);
//     object.setColor(1,1,1);        
//     objects.push(object);
// }
   
// {

//     let lx1 = 0;
//     let ly1 = -2;
//     let lz1 = 8;

//     let lx2 = 0; 
//     let ly2 = 2;
//     let lz2 = 8;

//     let r = 0.2;
//     let lx3 = r; 

//     let object  = new Line(lx1, ly1, lz1, lx2, ly2, lz2, lx3);
//     object.setColor(1,1,1);        
//     objects.push(object);
// }

// {

//     let ly1 = -2;
//     let lx1 = 0;
//     let lz1 = 8.5;

//     let ly2 = 2; 
//     let lx2 = 0;
//     let lz2 = 8.5;

//     let r = 0.2;
//     let lx3 = r; 

//     let object  = new Line(lx1, ly1, lz1, lx2, ly2, lz2, lx3);
//     object.setColor(0.2, 0.5, 1);        
//     objects.push(object);
// }
   




    // for(let j = 0; j < 5; j++) {
    //     for(let i = 0; i < 300; i++) {
    //         let a11 = (i / 300)     * Math.PI * 14;
    //         let a12 = (i / 300)     * Math.PI * 2 + j * 0.1;
    //         let a21 = ((i+1) / 300) * Math.PI * 14;
    //         let a22 = ((i+1) / 300) * Math.PI * 2 + j * 0.1;

    //         let r1 = 0; //Math.sin(i / 300 * Math.PI * 8)     * 0.8;
    //         let r2 = 0; //Math.sin((i+1) / 300 * Math.PI * 8) * 0.8;

    //         let v1 = new THREE.Vector3(0, 1 + r1, 0);
    //         v1.applyAxisAngle(new THREE.Vector3(0,0,1), a11);
    //         v1.add(new THREE.Vector3(-5,0,0));
    //         v1.applyAxisAngle(new THREE.Vector3(0,1,0), a12);
    //         v1.applyAxisAngle(new THREE.Vector3(1,0,0), -0.35);
    //         v1.add(new THREE.Vector3(0,0, 8));


    //         let v2 = new THREE.Vector3(0, 1 + r2, 0);
    //         v2.applyAxisAngle(new THREE.Vector3(0,0,1), a21);
    //         v2.add(new THREE.Vector3(-5,0,0));
    //         v2.applyAxisAngle(new THREE.Vector3(0,1,0), a22);
    //         v2.applyAxisAngle(new THREE.Vector3(1,0,0), -0.35);
    //         v2.add(new THREE.Vector3(0,0, 8));

    //         // let r = 0.03 + Math.sin(j * 0.3) * 0.15;
    //         let r = 0.05;

    //         let object  = new Line(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, r);
    //         if(j === 3)
    //             object.setColor(0.2 * 1, 0.5 * 1, 1 * 1);     

    //         objects.push(object);
    //     }
    // }




    for(let j = 0; j < trianglesCount; j++) {



        let lx1 = Utils.rand() * 5 - 5 * 0.5; 
        let ly1 = Utils.rand() * 5 - 5 * 0.5;
        let lz1 = 10 + (Utils.rand() * 2.0 - 1.0) * 1.0;

        let r = 0.05;
        let z = Utils.rand() * 8;
        
        let lx2 = lx1 + (Utils.rand() * 2 - 1) * 0.5;
        let ly2 = ly1 + (Utils.rand() * 2 - 1) * 0.5;
        let lz2 = lz1 + z;

        let lx3 = lx1 + (Utils.rand() * 2 - 1) * 0.5; 
        let ly3 = ly1 + (Utils.rand() * 2 - 1) * 0.5;
        let lz3 = lz1 + z;

        // let object  = new Triangle(lx1, ly1, lz1, lx2, ly2, lz2, lx3, ly3, lz3);
        let object  = new Line(lx1, ly1, lz1, lx2, ly2, lz2, r);
        // object.setColor(1, 0.4, 0.15);
        
        let res = Utils.hslToRgb(Utils.rand() * 1 + 0, 1, 0.7);
        object.setColor(res[0], res[1], res[2]);        
        object.setColor(2.5,2.5,2.5);        

        if(Utils.rand() > 0.5) {
            let grayValue = Math.pow(Math.random(), 1.0);
            // object.setColor(0, grayValue * 0.3, grayValue);        
            object.setColor(0.15 * 2, 0.4 * 2, 1 * 2);        
        }



    //     if(
    //         // (j < 200 || j > 380) || 
    //         (j == 12) ||
    //         (j == 57)
    //     ) {

    //         if(j == 12) {
    //             object.v0.x = object.v0.x;
    //             object.v0.y = object.v0.y;
    //             object.v0.z = object.v0.z;
    //         }
    //         if(j == 57) {
    //             object.v0.x = object.v0.x;
    //             object.v0.y = object.v0.y;
    //             object.v0.z = object.v0.z;
    //         }
            objects.push(object);
    //     }
    }
 
    // geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(position), 3 ) );
    // geometry.addAttribute( 'color',    new THREE.BufferAttribute( new Float32Array(color), 3 ) );

    let rootNode = makeBVH(objects);

    createTrianglesTexture(objects);
    createBVHTexture(rootNode, objects);

    // function makeBVHGeometry(node, level) {

    //     let aabb = node.aabb;
    //     let xs = aabb.max.x - aabb.min.x;
    //     let ys = aabb.max.y - aabb.min.y;
    //     let zs = aabb.max.z - aabb.min.z;
        
    //     let geometry = new THREE.BoxBufferGeometry(xs, ys, zs);
    
    //     let meshColor             = 0xffffff;
    //     if(level === 0) meshColor = 0xff5555;
    //     if(node.leaf)   meshColor = 0x5555ff;

    //     let mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    //         wireframe: true,
    //         color: meshColor,
    //         transparent: true,
    //         opacity: 0.1 + level * 0.05
    //     }));

    //     mesh.position.set(
    //         aabb.min.x + xs * 0.5,
    //         aabb.min.y + ys * 0.5,
    //         aabb.min.z + zs * 0.5,
    //     );

    //     scene.add(mesh);

    //     if(node.child1) {
    //         makeBVHGeometry(node.child1, level + 1);
    //     }
    //     if(node.child2) {
    //         makeBVHGeometry(node.child2, level + 1);
    //     }
    // }
    // makeBVHGeometry(rootNode, 0);
}

function createTrianglesTexture(objects) {
    let vectorsPerTriangle = 5;
    let maxEntriesPerRow = Math.floor(dataTextureSize / vectorsPerTriangle);
    let maxNumberOfObjects = maxEntriesPerRow * dataTextureSize;

    if(objects.length > maxNumberOfObjects) {
        console.error("too many triangles - aborting operation - texture size: " + dataTextureSize);
        return;
    }
    
    var width  = dataTextureSize;
    var height = dataTextureSize;
    var size = width * height;
    var data = new Float32Array( 4 * size );
    

    var stride = 4 * vectorsPerTriangle;    // in the "array stride" each component (x,y,z,w) is a separate element
    var pixelStride = vectorsPerTriangle;
    for ( var i = 0; i < objects.length; i++ ) {

        let index_x = i % maxEntriesPerRow;
        let index_y = Math.floor(i / maxEntriesPerRow);

        let real_index_x = index_x * stride;
        let real_index_y = index_y;
                                        // ricordati il * 4!! ci sono 4 elementi per ogni pixel!!!
        let flat_index = real_index_y * dataTextureSize * 4 + real_index_x;

        let triangle = objects[i];
        // the coordinate is to be interpreted as the "pixel index of the texture, which is the start of (pointer to) the triangle data entry"
        triangle.textureDataIndexX = index_x * pixelStride;
        triangle.textureDataIndexY = index_y;

    	data[ flat_index + 0  ] = triangle.v0.x;
    	data[ flat_index + 1  ] = triangle.v0.y;
    	data[ flat_index + 2  ] = triangle.v0.z;
        data[ flat_index + 3  ] = 0;
        
        data[ flat_index + 4  ] = triangle.v1.x;
        data[ flat_index + 5  ] = triangle.v1.y;
        data[ flat_index + 6  ] = triangle.v1.z;
        data[ flat_index + 7  ] = 0;

        data[ flat_index + 8  ] = triangle.v2.x;
        data[ flat_index + 9  ] = triangle.v2.y;
        data[ flat_index + 10 ] = triangle.v2.z;
        data[ flat_index + 11 ] = 0;

        data[ flat_index + 12 ] = triangle.color.x; // should be uv1.s  
        data[ flat_index + 13 ] = triangle.color.y; // should be uv1.t
        data[ flat_index + 14 ] = triangle.color.z; // should be uv2.s
        data[ flat_index + 15 ] = 0; // should be uv2.t

        data[ flat_index + 16 ] = 0; // should be uv3.s    
        data[ flat_index + 17 ] = 0; // should be uv3.t
        data[ flat_index + 18 ] = 0; // should be a flag telling if uv1-2 should be interpreted as a flat color
        data[ flat_index + 19 ] = 0;    
    }
    
    // used the buffer to create a DataTexture
    
    trianglesTexture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    trianglesTexture.magFilter = THREE.NearestFilter;
    trianglesTexture.minFilter = THREE.NearestFilter;
    trianglesTexture.wrapS = THREE.ClampToEdgeWrapping;
    trianglesTexture.wrapT = THREE.ClampToEdgeWrapping;
    trianglesTexture.needsUpdate = true;

}

function createBVHTexture(root, objects) {
    let vectorsPerNode = 3;
    let maxEntriesPerRow = Math.floor(dataTextureSize / vectorsPerNode);
    let maxNumberOfObjects = maxEntriesPerRow * dataTextureSize;

    if(objects.length > maxNumberOfObjects) {
        console.error("too many BVH nodes - aborting operation - texture size: " + dataTextureSize);
        return;
    }
    
    var width  = dataTextureSize;
    var height = dataTextureSize;
    var size = width * height;
    var data = new Float32Array( 4 * size );

    var stride = 4 * vectorsPerNode;

    let currentIndex = 0;
    function currentIndexToTextureCoordinates() {
        let index_x = currentIndex % maxEntriesPerRow;
        let index_y = Math.floor(currentIndex / maxEntriesPerRow);

        return [index_x * vectorsPerNode, index_y];
    };
    function currentIndexToDataArrayIndex() {
        let index_x = currentIndex % maxEntriesPerRow;
        let index_y = Math.floor(currentIndex / maxEntriesPerRow);

        let real_index_x = index_x * stride;
        let real_index_y = index_y;
                                        // ricordati il * 4!! ci sono 4 elementi per ogni pixel!!!
        let flat_index = real_index_y * (dataTextureSize * 4) + real_index_x;
        
        return flat_index;
    };

    function traverseBVH(node, isTriangle) {
        // transform currentIndex to data array index
        let index = currentIndexToDataArrayIndex();

        // assign data to texture
        data[ index + 0  ] = node.aabb.min.x;
    	data[ index + 1  ] = node.aabb.min.y;
    	data[ index + 2  ] = node.aabb.min.z;
        data[ index + 3  ] = node.leaf ? 1 : 0;
        
        data[ index + 4  ] = node.aabb.max.x;
        data[ index + 5  ] = node.aabb.max.y;
        data[ index + 6  ] = node.aabb.max.z;
        data[ index + 7  ] = 0;

    

        // if it's a leaf, place the correct triangle index
        if(node.leaf) {
            // which is going to be in node.textureDataIndexX/Y
            data[ index + 8  ] = node.textureDataIndexX;
            data[ index + 9  ] = node.textureDataIndexY;
            // data[ index + 10 ] = 0;      <-- not used !! leaves represent single triangles !
            // data[ index + 11 ] = 0;      <-- not used !! leaves represent single triangles !

            return; // stop recursion there
        }


        // recurse on children
        let child1 = node.child1;
        let child2 = node.child2;

        // assign -1 by deafult which means no children
        data[ index + 8  ] = -1;
        data[ index + 9  ] = -1;
        data[ index + 10 ] = -1;
        data[ index + 11 ] = -1;

        if(child1) {
            currentIndex++;
            let xy = currentIndexToTextureCoordinates();
            data[ index + 8  ] = xy[0];
            data[ index + 9  ] = xy[1];

            traverseBVH(child1);
        }
        if(child2) {
            currentIndex++;
            let xy = currentIndexToTextureCoordinates();
            data[ index + 10 ] = xy[0];
            data[ index + 11 ] = xy[1];

            traverseBVH(child2);
        }
    }
    traverseBVH(root);



    bvhTexture = new THREE.DataTexture( data, width, height, THREE.RGBAFormat, THREE.FloatType );
    bvhTexture.magFilter = THREE.NearestFilter;
    bvhTexture.minFilter = THREE.NearestFilter;
    bvhTexture.wrapS = THREE.ClampToEdgeWrapping;
    bvhTexture.wrapT = THREE.ClampToEdgeWrapping;
    bvhTexture.needsUpdate = true;
}





// object should have a .aabb property
// and a "center" property
function makeBVH(objects) {
    let stats = {
        degenerateNodes: 0,
        maxLevel: 0,
        splitOnX: 0,
        splitOnY: 0,
        splitOnZ: 0,
        intersectionTests: 0,
        intersectionCalls: 0,
        averageIntersectionCalls: 0,
    }

    // create a BVHNode root and add it to the queue
    let root            = new BVHNode();
    root.leaf           = false;
    root.level          = 0;
    root.objectsIndices = [];

    for(let i = 0; i < objects.length; i++) {
        root.objectsIndices.push(i);
    }

    let queue = [];
    queue.push(root);

    // until queue is not empty
    while ( queue.length > 0 ) {
        // remove the first node from the queue
        let node = queue.shift();

        // calculate a possible splitting axis / point 
        let nodeAABB        = new AABB();
        let nodeCentersAABB = new AABB();  // used to decide the splitting axis
        for(let i = 0; i < node.objectsIndices.length; i++) {
            let objectIndex = node.objectsIndices[i];
            let object      = objects[objectIndex];

            nodeAABB.addAABB(object.aabb);
            nodeCentersAABB.addVertex(object.center);
        }
        node.aabb = nodeAABB;

        // if the node has <= two children, those are leaves
        if ( node.objectsIndices.length <= 2 ) {

            let object1, object2;
            if(node.objectsIndices[0] !== undefined) object1 = objects[node.objectsIndices[0]];
            if(node.objectsIndices[1] !== undefined) object2 = objects[node.objectsIndices[1]];

            if(object1) {
                node.child1 = object1;
                node.child1.leaf = true;
            }
            if(object2) {
                node.child2 = object2;
                node.child2.leaf = true;
            }               
        } // otherwise we need to compute its children
        else {  
            // choose a splitting axis
            let xAxisLength = Math.abs(nodeCentersAABB.min.x - nodeCentersAABB.max.x);
            let xAxisCenter = (nodeCentersAABB.min.x + nodeCentersAABB.max.x) / 2;
            let yAxisLength = Math.abs(nodeCentersAABB.min.y - nodeCentersAABB.max.y);
            let yAxisCenter = (nodeCentersAABB.min.y + nodeCentersAABB.max.y) / 2;
            let zAxisLength = Math.abs(nodeCentersAABB.min.z - nodeCentersAABB.max.z);
            let zAxisCenter = (nodeCentersAABB.min.z + nodeCentersAABB.max.z) / 2;
            let splitOnX    = (xAxisLength > yAxisLength && xAxisLength > zAxisLength) ? true : false;
            let splitOnY    = (yAxisLength > xAxisLength && yAxisLength > zAxisLength) ? true : false;
            let splitOnZ    = (zAxisLength > xAxisLength && zAxisLength > yAxisLength) ? true : false;
            if(!splitOnX && !splitOnY && !splitOnZ) splitOnX = true; // at least one of the three needs to be true

            // let splitCenter = xAxisLength > yAxisLength ? xAxisCenter : yAxisCenter;
            let splitCenter = 0;
            if(splitOnX) splitCenter = xAxisCenter;
            if(splitOnY) splitCenter = yAxisCenter;
            if(splitOnZ) splitCenter = zAxisCenter;

            // create child nodes
            let node1 = new BVHNode();
            let node2 = new BVHNode();
            node1.leaf = false;
            node2.leaf = false;
            node1.level = node.level + 1;
            node2.level = node.level + 1;
            node1.parent = node;
            node2.parent = node;

            node.child1 = node1;
            node.child2 = node2;


            // stats collection
            stats.maxLevel = Math.max(node1.level, stats.maxLevel);
            if(splitOnX) stats.splitOnX++;
            if(splitOnY) stats.splitOnY++;
            if(splitOnZ) stats.splitOnZ++;
            // stats collection - END


            node1.objectsIndices   = [];
            node2.objectsIndices   = [];
            for (let i = 0; i < node.objectsIndices.length; i++) {
                let objectIndex = node.objectsIndices[i];
                let object = objects[objectIndex];

                let centerValue          = object.center.x;
                if(splitOnY) centerValue = object.center.y; 
                if(splitOnZ) centerValue = object.center.z; 
                
                if (centerValue > splitCenter) {
                    node2.objectsIndices.push(objectIndex);
                } else {
                    node1.objectsIndices.push(objectIndex);
                }
            }
            
            // make sure both children have at least one element (might happen that one of the two arrays is empty if all objects share the same center)
            // if that doesn't happen, partition elements in both nodes
            if(node1.objectsIndices.length === 0) {
                // m will be at least 1. if we got in here, node2.objectsIndices.length is at least 3
                let m = Math.floor(node2.objectsIndices.length / 2);
                for (let i = 0; i < m; i++) {
                    node1.objectsIndices.push(node2.objectsIndices.shift());
                }
                stats.degenerateNodes++;
            }
            if(node2.objectsIndices.length === 0) {
                // m will be at least 1. if we got in here, node1.objectsIndices.length is at least 3
                let m = Math.floor(node1.objectsIndices.length / 2);
                for (let i = 0; i < m; i++) {
                    node2.objectsIndices.push(node1.objectsIndices.shift());
                }
                stats.degenerateNodes++;
            }

            // push to queue
            queue.push(node1);
            queue.push(node2);
        }

        // reset the "temporary children" array of the node since we don't need it anymore
        node.objectsIndices = [];
    }


    // if(args.showDebug) {
        console.log("--- BVH stats ---");
        console.log("max depth: "        + stats.maxLevel);
        console.log("splits on x axis: " + stats.splitOnX);
        console.log("splits on y axis: " + stats.splitOnY);
        console.log("splits on z axis: " + stats.splitOnZ);
        console.log("degenerate nodes: " + stats.degenerateNodes);
        console.log("--- END ---");
    // }

    return root;
}

function intersect(ray, root) {
    // this.stats.intersectionTests++;

    let mint = Infinity;
    let closestObject;
    let closestResult;

    let toVisit = [root];

    while (toVisit.length !== 0) {
        let node = toVisit.pop();
        // this.stats.intersectionCalls++;

        if (!node.leaf) {
            let res1 = false;
            let res2 = false;
            if(node.child1) res1 = node.child1.aabb.intersect(ray);
            if(node.child2) res2 = node.child2.aabb.intersect(ray);

            // USE FALSE AND NOT THE CONTRACTED IF FORM -- ZERO WOULD TEST AS FALSE!! (and we might need to check for a value of 0 instead of false)
            if(res1 === false && res2 === false) {
                continue;
            } else if (res1 !== false && res2 === false && (res1.t < mint)) {
                toVisit.push(node.child1);
            } else if (res1 === false && res2 !== false && (res2.t < mint)) {
                toVisit.push(node.child2);
            } else {
                if (res1.t < res2.t) {
                    if (res2.t < mint) toVisit.push(node.child2);
                    if (res1.t < mint) toVisit.push(node.child1);   // will be the first one of the two popped from the array 
                } else {
                    if (res1.t < mint) toVisit.push(node.child1);
                    if (res2.t < mint) toVisit.push(node.child2);   // will be the first one of the two popped from the array
                }
            }
        }

        if (node.leaf) {
            let res = false;

            // here we don't test the intersection with the aabb, but with the object itself !
            res = node.intersect(ray);

            if(res !== false && res.t < mint) {
                mint = res.t;
                closestObject = node;
                closestResult = res;
            } 
        }
    }

    // this.stats.averageIntersectionCalls = this.stats.intersectionCalls / this.stats.intersectionTests;

    if(closestResult) 
        return { t: closestResult.t, normal: closestResult.normal, object: closestObject };
    else
        return false;
}

class BVHNode {
    constructor() {
        this.parent;
        this.leaf;
        this.level;

        this.objectsIndices;

        this.child1;
        this.child2;
        
        this.aabb;
    }
}

let intersectionTestsMade = 0;
class Triangle {
    constructor(lx1, ly1, lz1, lx2, ly2, lz2, lx3, ly3, lz3) {
        this.aabb = new AABB();
        
        this.v0 = new THREE.Vector3(lx1, ly1, lz1);
        this.v1 = new THREE.Vector3(lx2, ly2, lz2);
        this.v2 = new THREE.Vector3(lx3, ly3, lz3);

        this.aabb.addVertex(this.v0);
        this.aabb.addVertex(this.v1);
        this.aabb.addVertex(this.v2);
        
        this.center = new THREE.Vector3(
            (lx1 + lx2 + lx3) / 3,
            (ly1 + ly2 + ly3) / 3,
            (lz1 + lz2 + lz3) / 3,
        );

        this.textureDataIndexX = -1;
        this.textureDataIndexY = -1;
    
        this.color = new THREE.Vector3(1,1,1);
    }

    setColor(r,g,b) {
        this.color = new THREE.Vector3(r,g,b);
    }

    intersect(ray) {

        // THIS FUNCTION IS ALL WRONG CHANGE IT TO THE GLSL ONE WE HAVE IMPLEMENTED IN SHADERCODE
        // THIS FUNCTION IS ALL WRONG CHANGE IT TO THE GLSL ONE WE HAVE IMPLEMENTED IN SHADERCODE
        // THIS FUNCTION IS ALL WRONG CHANGE IT TO THE GLSL ONE WE HAVE IMPLEMENTED IN SHADERCODE
        // THIS FUNCTION IS ALL WRONG CHANGE IT TO THE GLSL ONE WE HAVE IMPLEMENTED IN SHADERCODE


        // from: https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution
        intersectionTestsMade++;
        
        let kEpsilon = 0.000001;

        // compute plane's normal
        // Vec3f v0v1 = v1 - v0; 
        // Vec3f v0v2 = v2 - v0; 
        let v0v1 = new THREE.Vector3();
        v0v1.add(this.v1);
        v0v1.sub(this.v0);

        let v0v2 = new THREE.Vector3();
        v0v2.add(this.v2);
        v0v2.sub(this.v0);

        // no need to normalize
        // Vec3f N = v0v1.crossProduct(v0v2); // N 
        // float area2 = N.length(); 
        let N = new THREE.Vector3();
        N.crossVectors(v0v1, v0v2);
        let area2 = N.length();


        // Step 1: finding P
        
        // check if ray and plane are parallel ?
        // float NdotRayDirection = N.dotProduct(dir); 
        // if (fabs(NdotRayDirection) < kEpsilon) // almost 0 
        //     return false; // they are parallel so they don't intersect ! 
        let NdotRayDirection = N.dot(ray.d);
        if(Math.abs(NdotRayDirection) < kEpsilon)
            return false;

        
        // compute d parameter using equation 2
        // float d = N.dotProduct(v0); 
        let d = N.dot(this.v0);
        
        // compute t (equation 3)
        // t = (N.dotProduct(orig) + d) / NdotRayDirection; 
        let t = (N.dot(ray.o) + d) / NdotRayDirection; 
        // check if the triangle is in behind the ray
        if (t < 0) return false; // the triangle is behind 
        
        // compute the intersection point using equation 1
        // Vec3f P = orig + t * dir; 
        let P = new THREE.Vector3();
        P.x = ray.o.x + t * ray.d.x;
        P.y = ray.o.y + t * ray.d.y;
        P.z = ray.o.z + t * ray.d.z;
        
        // Step 2: inside-outside test
        // Vec3f C; // vector perpendicular to triangle's plane 
        let C = new THREE.Vector3();

        
        // edge 0
        // Vec3f edge0 = v1 - v0; 
        // Vec3f vp0 = P - v0; 
        // C = edge0.crossProduct(vp0); 
        // if (N.dotProduct(C) < 0) return false; // P is on the right side 
        let edge0 = new THREE.Vector3();
        edge0.add(this.v1);
        edge0.sub(this.v0);

        let vp0 = new THREE.Vector3();
        vp0.add(P);
        vp0.sub(this.v0);

        C.crossVectors(edge0, vp0);
        if (N.dot(C) < 0) return false; // P is on the right side 


        

        // edge 1
        // Vec3f edge1 = v2 - v1; 
        // Vec3f vp1 = P - v1; 
        // C = edge1.crossProduct(vp1); 
        // if (N.dotProduct(C) < 0)  return false; // P is on the right side 
        let edge1 = new THREE.Vector3();
        edge1.add(this.v2);
        edge1.sub(this.v1);

        let vp1 = new THREE.Vector3();
        vp1.add(P);
        vp1.sub(this.v1);

        C.crossVectors(edge1, vp1);
        if (N.dot(C) < 0) return false; // P is on the right side 
        

        // edge 2
        // Vec3f edge2 = v0 - v2; 
        // Vec3f vp2 = P - v2; 
        // C = edge2.crossProduct(vp2); 
        // if (N.dotProduct(C) < 0) return false; // P is on the right side; 
        let edge2 = new THREE.Vector3();
        edge2.add(this.v0);
        edge2.sub(this.v2);

        let vp2 = new THREE.Vector3();
        vp2.add(P);
        vp2.sub(this.v2);

        C.crossVectors(edge2, vp2);
        if (N.dot(C) < 0) return false; // P is on the right side 


        return {
            t: t
        }; // this ray hits the triangle 
    }
}

class Line {
    constructor(lx1, ly1, lz1, lx2, ly2, lz2, r) {
        this.aabb = new AABB();
        
        this.v0 = new THREE.Vector3(lx1, ly1, lz1);
        this.v1 = new THREE.Vector3(lx2, ly2, lz2);
        this.v2 = new THREE.Vector3(r, r, r);

        let m = 1;
        this.aabb.addVertex(new THREE.Vector3(lx1 - r * m, ly1 - r * m, lz1 - r * m));
        this.aabb.addVertex(new THREE.Vector3(lx1 + r * m, ly1 + r * m, lz1 + r * m));
        this.aabb.addVertex(new THREE.Vector3(lx2 - r * m, ly2 - r * m, lz2 - r * m));
        this.aabb.addVertex(new THREE.Vector3(lx2 + r * m, ly2 + r * m, lz2 + r * m));
        // this.aabb.addVertex(this.v2);
        
        this.center = new THREE.Vector3(
            (lx1 + lx2) / 3,
            (ly1 + ly2) / 3,
            (lz1 + lz2) / 3,
        );

        this.textureDataIndexX = -1;
        this.textureDataIndexY = -1;
    
        this.color = new THREE.Vector3(1,1,1);
    }

    setColor(r,g,b) {
        this.color = new THREE.Vector3(r,g,b);
    }
}