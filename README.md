# Blurry
A simple glsl path tracer whose only primitives are.. capsules


How to use
======

Inside `libs/createMeshes.js` you can code the scene you want to render, guess what, only capsules are supported, here's an example on how to create a scene:

```javascript
function createLines(objects) {
    for(let j = 0; j < 450; j++) {

        let lx1 = Utils.rand() * 5 - 5 * 0.5; 
        let ly1 = Utils.rand() * 5 - 5 * 0.5;
        let lz1 = 10 + (Utils.rand() * 2.0 - 1.0) * 1.0;

        let r = 0.05;
        let z = Utils.rand() * 8;
        
        let lx2 = lx1 + (Utils.rand() * 2 - 1) * 0.5;
        let ly2 = ly1 + (Utils.rand() * 2 - 1) * 0.5;
        let lz2 = lz1 + z;

        let object  = new Line(
            new THREE.Vector3(lx1, ly1, lz1), 
            new THREE.Vector3(lx2, ly2, lz2), 
            r);
        
        let res = Utils.hslToRgb(Utils.rand() * 1 + 0, 1, 0.7);
        // sets the color of each object
        object.setColor(1,1,1);        

        if(Utils.rand() > 0.9) {
            // if this object is a light source,
            // using setEmissive will set the rgb color (range [0...infinity])
            // of the light emitted by this object 
            object.setEmissive(100, 100, 50);        
        }

        if(Utils.rand() > 0.65) {
            let grayValue = Math.pow(Math.random(), 1.0);
            object.setColor(0.15 * 2, 0.4 * 2, 1 * 2);        
        }

        objects.push(object);
    }
}
```


You can change various parameters of the renderer by modifying the values in `libs/globals.js`

```javascript
var exposure = 30.5;  
// lower this value if you get low fps, and the path tracer will render smaller tiles at each frame
var tileSize = 2000;

var canvasWidth = 1200;
var canvasHeight = 800;

// increase this value if you get an error saying you fed too many objects to the renderer
// though I would argue your GPU will be exploded much sooner than you reach the point
// were this number is too small
var dataTextureSize = 2048;

var bokehStrength = 0.4;
// distance of the focal plane used to calculate the blur
var focalDistance = 9.5;
```
