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
uniform float uTime;

uniform sampler2D trianglesDataTexture;
uniform sampler2D bvhDataTexture;



` + shaderpart_calcTriangleNormal + `
` + shaderpart_triangleIntersection + `
` + shaderpart_lineIntersection + `
` + shaderpart_aabbIntersection + `
` + shaderpart_bvhIntersection + `




//  the function below is hash12 from https://www.shadertoy.com/view/4djSRW - I just renamed it nrand()
//  sin based random functions wont work
float nrand(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}
float n1rand( vec2 n )
{
	float t = fract( uTime );
	float nrnd0 = nrand( n + 0.7*t );
	return nrnd0;
}





void main() {
    vec2 uvSampleOffset = vec2((1.0 / uScreenSize.x) * uRandomVec4.x, (1.0 / uScreenSize.y) * uRandomVec4.y); 
    vec2 ndcUV = (vUv + uvSampleOffset * 1.0) * 2.0 - 1.0;
    ndcUV.x *= (uScreenSize.x / uScreenSize.y);


    vec3 ro = vec3(0, 0, 0);
    vec3 rd = normalize(vec3(ndcUV * 0.3, 1.0));




    // ********* dof
    // as it's made currently, we're not focusing on a "focal plane"
    // because rays are displaced in terms of a length from their direction
    // so what we're doing is a DOF on a "curved plane" which is wrong obviously
    vec4 rand = uRandomVec4.xyzw;
    rand.x = n1rand( vec2(uRandomVec4.x + vUv.x * 93.0 + vUv.y * 87.0, uTime) );
    rand.y = n1rand( vec2(uRandomVec4.y + vUv.x * 93.0 + vUv.y * 87.0, uTime) );
    rand.z = n1rand( vec2(uRandomVec4.z + vUv.x * 93.0 + vUv.y * 87.0, uTime) );
    rand.w = n1rand( vec2(uRandomVec4.w + vUv.x * 93.0 + vUv.y * 87.0, uTime) );

    vec3 focalPoint = ro + (
        (rd * (1.0 / dot(rd, vec3(0,0,1.0)))   )
     * 9.5);

    float lambda = rand.x;
    float u      = rand.y * 2.0 - 1.0;
    float phi    = rand.z * 6.28;
    float R      = 0.35;

    float x = R * pow(lambda, 0.33333) * sqrt(1.0 - u * u) * cos(phi);
    float y = R * pow(lambda, 0.33333) * sqrt(1.0 - u * u) * sin(phi);
    float z = R * pow(lambda, 0.33333) * u;


    {
        float a = rand.x * 2.0 * 3.141592;
        float r = R * sqrt(rand.y);

        // If you need it in Cartesian coordinates
        x = r * cos(a);
        y = r * sin(a);
    }


    ro += vec3(x, y, 0.0);

    rd = normalize(focalPoint - ro);
    // ********* dof - END
    







    vec4 seed = vec4(34.5, 249.0, 201.0, 177.0);

    vec3 mask = vec3(1.0);
    vec3 accucolor = vec3(0.0);
    bool stop = false;
    for(int i = 0; i < 4; i++) {
        float stepsTaken = 0.0;
        float t = 0.0;
        vec3 color  = vec3(0.0);
        vec3 normal = vec3(0.0);
        bool intersects = BVHintersect(ro, rd, t, color, normal, stepsTaken, false, stop);  

        if(intersects) {

            ro = ro + rd * (t - 0.001);

            seed.x += 19.0;
            seed.y += 15.0;
            seed.z += 41.0;
            seed.w += 22.0;


            // ******************** random on unit sphere
            vec4 rand = uRandomVec4.xyzw;
            rand.x = n1rand( vec2(uRandomVec4.z + seed.x, uRandomVec4.x) );
            rand.y = n1rand( vec2(uRandomVec4.y + seed.y, uRandomVec4.y) );
            rand.z = n1rand( vec2(uRandomVec4.w + seed.z, uRandomVec4.z) );
            rand.w = n1rand( vec2(uRandomVec4.x + seed.w, uRandomVec4.w) );
            
            float lambda = rand.x;
            float u      = rand.y * 2.0 - 1.0;
            float phi    = rand.z * 6.28;
            float R      = 1.0;
            
            float x = R * pow(lambda, 0.33333) * sqrt(1.0 - u * u) * cos(phi);
            float y = R * pow(lambda, 0.33333) * sqrt(1.0 - u * u) * sin(phi);
            float z = R * pow(lambda, 0.33333) * u;

            vec3 hpn = ro + normal;
            vec3 randomOnUnitSphere = vec3(x,y,z);
            // ******************** random on unit sphere - END

            rd = normalize((hpn + randomOnUnitSphere) - ro);
            mask *= color * dot(normal, rd);

        } else {

            if(i > 0) accucolor = vec3(
                pow(max(dot(rd, normalize(vec3(9.0, 1.0, 0.0))), 0.0), 16.0)
            ) * 1000.0;

            stop = true;
            break;
        }
    }


    out_FragColor = vec4(accucolor * mask, 1.0);

}`;