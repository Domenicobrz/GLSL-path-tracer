window.addEventListener("load", init);

var scene;
var camera;
var controls;
var renderer;
var canvas;

var context;
var imageDataObject;
var canvasSize = 800;
var radianceBuffer = [];
var samples = 0;
var trianglesCount = 30;

function init() {    
    // renderer = new THREE.WebGLRenderer( {  } );
    // renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.setSize( innerWidth, innerHeight );
    // renderer.autoClear = false;
    // document.body.appendChild(renderer.domElement);
    // canvas = renderer.domElement;

    scene  = new THREE.Scene();

    // camera = new THREE.PerspectiveCamera( 45, innerWidth / innerHeight, 2, 200 );
    // camera.position.set(0, 0, 20);

    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    // // controls.rotateSpeed     = 1;
	// // controls.minAzimuthAngle = -Infinity; 
	// // controls.maxAzimuthAngle = +Infinity; 
	// // controls.minPolarAngle   = 0.85;      
    // // controls.maxPolarAngle   = Math.PI - 0.85; 


    createMeshes();




    canvas = document.getElementById('canvas');
	canvas.width  = canvasSize;
	canvas.height = canvasSize;
	context = canvas.getContext('2d');
    imageDataObject = context.createImageData(canvasSize, canvasSize);
    for(let i = 0; i < canvasSize; i++) {
        radianceBuffer.push([]);
        for(let j = 0; j < canvasSize; j++) {
            radianceBuffer[i].push([0, 0, 0, 0]);
        }
    }



    render();

    console.log("intersections made (in total, all samples) " + intersectionTestsMade);
    console.log("aabb intersections made (in total, all samples) " + aabbIntersectionTestsMade);
    console.log("intersections per pixel: " + (aabbIntersectionTestsMade / (canvasSize*canvasSize)));
    console.log("intersections ratio without BVH: " + ((canvasSize*canvasSize*trianglesCount) / (aabbIntersectionTestsMade) )    );
}  

function render(now) {
    // requestAnimationFrame(render);

    // controls.update();

    // renderer.render(scene, camera);


    for(let i = 0; i < canvasSize; i++) {
        for(let j = 0; j < canvasSize; j++) {
            raytrace(i, j);
        }
    }

	var imageData = imageDataObject.data;

    for (var i = 0; i < canvasSize * canvasSize; i++) {
        let x = i % canvasSize;
        let y = Math.floor(i / canvasSize);
        

        imageData[i * 4 + 0] = radianceBuffer[y][x][0] * 255;
        imageData[i * 4 + 1] = radianceBuffer[y][x][1] * 255;
        imageData[i * 4 + 2] = radianceBuffer[y][x][2] * 255;
        imageData[i * 4 + 3] = 255;
    }

    context.putImageData(imageDataObject, 0, 0);

}





function raytrace(px, py) {
    // make ray
    let xDir = (px / canvasSize) * 2 - 1; 
    let yDir = ((py / canvasSize) * 2 - 1) * -1; 
    let zDir = 1;
    
    let ray = {
        o: new THREE.Vector3(0.25, 0.25, 0),
        d: new THREE.Vector3(xDir, yDir, zDir).normalize(),
        // invd: new THREE.Vector3(1 / xDir, 1 / yDir, 1 / zDir),
        // sign: [invDir.x < 0, invDir.y < 0, invDir.z < 0]
    }


    let color = {
        r: 0,
        g: 0,
        b: 0
    };
    
    if(px === 417 & py === 400) {
        color.r = 0.85;
        color.g = 0.15;
        color.b = 0.15;
    }

    // intersect it
    let res = intersect(ray, root);


    if(res !== false) {
        color.r = 0.65;
        color.g = 0.65;
        color.b = 0.65;
    }

    // update with radiance
    radianceBuffer[py][px][0] += color.r;
    radianceBuffer[py][px][1] += color.g;
    radianceBuffer[py][px][2] += color.b;
    radianceBuffer[py][px][3] += 1;
}






function createMeshes() {
    var geometry  = new THREE.BufferGeometry();
    var position = [];
    var color    = [];

    let objects  = [];




    let lx1 = 0;
    let ly1 = 1;
    let lz1 = 10;

    let lx2 = -0.5; 
    let ly2 = 0;
    let lz2 = 7;

    let lx3 = 0.5; 
    let ly3 = 0;
    let lz3 = 13;


    let object  = new Triangle(lx1, ly1, lz1, lx2, ly2, lz2, lx3, ly3, lz3);
    objects.push(object);



    // for(let j = 0; j < trianglesCount; j++) {

    //     let lx1 = Math.random() * 15 - 15 * 0.5; 
    //     let ly1 = Math.random() * 15 - 15 * 0.5;
    //     let lz1 = Math.random() * 15 + 5;
    
    //     let lx2 = lx1 + Math.random() * 1; 
    //     let ly2 = ly1 + Math.random() * 1;
    //     let lz2 = lz1 + Math.random() * 1;

    //     let lx3 = lx1 + Math.random() * 1; 
    //     let ly3 = ly1 + Math.random() * 1;
    //     let lz3 = lz1 + Math.random() * 1;


    //     let object  = new Triangle(lx1, ly1, lz1, lx2, ly2, lz2, lx3, ly3, lz3);
    //     objects.push(object);


    //     position.push(lx1, ly1, lz1);
    //     position.push(lx2, ly2, lz2);
    //     position.push(lx3, ly3, lz3);

    //     color.push(1,1,1);    
    //     color.push(1,1,1);    
    //     color.push(1,1,1);    
    // }
 
    geometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(position), 3 ) );
    geometry.addAttribute( 'color',    new THREE.BufferAttribute( new Float32Array(color), 3 ) );


    let mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ 
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide,
    }));

    scene.add(mesh);












    let rootNode = makeBVH(objects);
    function makeBVHGeometry(node, level) {

        let aabb = node.aabb;
        let xs = aabb.max.x - aabb.min.x;
        let ys = aabb.max.y - aabb.min.y;
        let zs = aabb.max.z - aabb.min.z;
        
        let geometry = new THREE.BoxBufferGeometry(xs, ys, zs);
    
        let meshColor             = 0xffffff;
        if(level === 0) meshColor = 0xff5555;
        if(node.leaf)   meshColor = 0x5555ff;

        let mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
            wireframe: true,
            color: meshColor,
            transparent: true,
            opacity: 0.1 + level * 0.05
        }));

        mesh.position.set(
            aabb.min.x + xs * 0.5,
            aabb.min.y + ys * 0.5,
            aabb.min.z + zs * 0.5,
        );

        scene.add(mesh);

        if(node.child1) {
            makeBVHGeometry(node.child1, level + 1);
        }
        if(node.child2) {
            makeBVHGeometry(node.child2, level + 1);
        }
    }
    makeBVHGeometry(rootNode, 0);

}

// object should have a .aabb property
// and a "center" property
let root;
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
    root            = new BVHNode();
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

        // if the node has two children, it becomes a leaf
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
    }

    intersect(ray) {
        // from: https://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/ray-triangle-intersection-geometric-solution
        intersectionTestsMade++;
        



        QUESTA FUNZIONE E' SBAGLIATA E VA RISCRITTA




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