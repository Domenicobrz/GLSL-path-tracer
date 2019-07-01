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



` + shaderpart_triangleIntersection + `
` + shaderpart_aabbIntersection + `
` + shaderpart_bvhIntersection + `





void main() {
    // out_FragColor = vec4(vUv, 0.0, 1.0);
    out_FragColor = texture2D(bvhDataTexture, vec2(vUv.x, 0.0));


    vec2 uvSampleOffset = vec2((1.0 / uScreenSize.x) * uRandomVec4.x, (1.0 / uScreenSize.y) * uRandomVec4.y); 
    vec2 ndcUV = (vUv + uvSampleOffset * 1.0) * 2.0 - 1.0;
    ndcUV.x *= (uScreenSize.x / uScreenSize.y);


    vec2 dataTexturePixelCentralOffset = vec2(1.0 / (uDataTextureSize * 2.0));

    vec3 ro = vec3(0, 0, 0.0);
    vec3 rd = vec3(ndcUV, 1.0);




    // ********* dof
    vec4 rand = uRandomVec4.xyzw;
    rand.x = mod(rand.x + vUv.x * 100.0 + vUv.y * 100.0, 1.0);
    rand.y = mod(rand.y + vUv.x * 264.0 + vUv.y * 532.0, 1.0);
    rand.z = mod(rand.z + vUv.x * 93.0  + vUv.y * 789.0, 1.0);
    rand.w = mod(rand.w + vUv.x * 155.0 + vUv.y * 221.0, 1.0);

    vec3 focalPoint = ro + rd * 12.0;
    float lambda = rand.x;
    float u      = rand.y * 2.0 - 1.0;
    float phi    = rand.z * 6.28;
    float R      = 1.005;

    float x = R * pow(lambda, 0.33333) * sqrt(1.0 - u * u) * cos(phi);
    float y = R * pow(lambda, 0.33333) * sqrt(1.0 - u * u) * sin(phi);
    float z = R * pow(lambda, 0.33333) * u;

    ro += vec3(x, y, 0.0);

    rd = normalize(focalPoint - ro);
    // ********* dof - END





    float t     = 0.0;
    vec3  color = vec3(0.0);
    if(BVHintersect(ro, rd, t, color)) {
        out_FragColor = vec4(color, 1.0);
    } else {
        out_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}`;