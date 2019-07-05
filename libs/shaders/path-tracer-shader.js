let pathtracerv = `
#version 300 es

varying vec2 vUv;

void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
    vUv = uv;
}`;

let pathtracerf = `
#version 300 es

precision highp float;
precision highp int;
out vec4 out_FragColor;


varying vec2 vUv;

uniform vec4 uRandomVec4;
uniform vec2 uScreenSize;
uniform float uDataTextureSize;

uniform sampler2D trianglesDataTexture;
uniform sampler2D bvhDataTexture;



` + shaderpart_calcTriangleNormal + `
` + shaderpart_triangleIntersection + `
` + shaderpart_aabbIntersection + `
` + shaderpart_bvhIntersection + `





void main() {
    vec2 uvSampleOffset = vec2((1.0 / uScreenSize.x) * uRandomVec4.x, (1.0 / uScreenSize.y) * uRandomVec4.y); 
    vec2 ndcUV = (vUv + uvSampleOffset * 1.0) * 2.0 - 1.0;
    ndcUV.x *= (uScreenSize.x / uScreenSize.y);


    vec3 ro = vec3(0, 0, 0);
    vec3 rd = normalize(vec3(ndcUV, 1.0));




    // ********* dof
    // as it's made currently, we're not focusing on a "focal plane"
    // because rays are displaced in terms of a length from their direction
    // so what we're doing is a DOF on a "curved plane" which is wrong obviously
    vec4 rand = uRandomVec4.xyzw;
    rand.x = mod(rand.x + vUv.x * 100.0 + vUv.y * 100.0, 1.0);
    rand.y = mod(rand.y + vUv.x * 264.0 + vUv.y * 532.0, 1.0);
    rand.z = mod(rand.z + vUv.x * 93.0  + vUv.y * 789.0, 1.0);
    rand.w = mod(rand.w + vUv.x * 155.0 + vUv.y * 221.0, 1.0);

    vec3 focalPoint = ro + rd * 20.0;
    float lambda = rand.x;
    float u      = rand.y * 2.0 - 1.0;
    float phi    = rand.z * 6.28;
    float R      = 0.005;

    float x = R * pow(lambda, 0.33333) * sqrt(1.0 - u * u) * cos(phi);
    float y = R * pow(lambda, 0.33333) * sqrt(1.0 - u * u) * sin(phi);
    float z = R * pow(lambda, 0.33333) * u;

    ro += vec3(x, y, 0.0);

    rd = normalize(focalPoint - ro);
    // ********* dof - END
    





    float stepsTaken = 0.0;
    float t     = 0.0;
    vec3 color  = vec3(0.0);
    vec3 normal = vec3(0.0);
    bool intersects = BVHintersect(ro, rd, t, color, normal, stepsTaken, false, false);


    vec3 lightPos = vec3(5, 15, 0) + normalize(vec3(x, y, z)) * 0.65;

    if(dot(normal, rd) > 0.0) {
        normal = -normal;
    }

    ro = ro + rd * (t - 0.01);
    rd = normalize(lightPos - ro);

    float diffuse = max(dot(normal, rd), 0.0);



    out_FragColor = vec4(0,0,0, 1);
    if(intersects) {
        vec3 c = vec3(0.0), n = vec3(0.0);
        // shadow ray
        bool shadowIntersects = BVHintersect(ro, rd, t, c, n, stepsTaken, true, !intersects);

        if(!shadowIntersects) {
            out_FragColor = vec4(color * vec3(diffuse) * 100.0, 1);
        }
    }
   
   
    // out_FragColor = vec4(c, 1);
    // return;
   











    // if(stepsTaken > 200.0) {
    //     out_FragColor = vec4(0, 100, 0, 1);
    // } else {
    //     out_FragColor = vec4(100, 0, 0, 1);
    // }

    // return;     



    
    // out_FragColor = vec4(0, 0, 0, 1);
    
    // if (intersects) { // if we've hit an object and we're not in shadow..
    //     out_FragColor = vec4(color * vec3(diffuse) * 100.0, 1);
    // }

    // // // runs if this point should be in shadow
    // // if(intersects && shadowIntersects) {
    // //     out_FragColor = vec4(0, 0, 0, 1);
    // // } 


    // // out_FragColor = vec4(0, 0, 0, 1);
}`;