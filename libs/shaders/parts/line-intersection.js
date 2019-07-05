let shaderpart_lineIntersection = `


// float raySphereIntersect(vec3 r0, vec3 rd, vec3 s0, float sr) {
//     // - r0: ray origin
//     // - rd: normalized ray direction
//     // - s0: sphere center
//     // - sr: sphere radius
//     // - Returns distance from r0 to first intersecion with sphere,
//     //   or -1.0 if no intersection.
//     float a = dot(rd, rd);
//     vec3 s0_r0 = r0 - s0;
//     float b = 2.0 * dot(rd, s0_r0);
//     float c = dot(s0_r0, s0_r0) - (sr * sr);
//     if (b*b - 4.0*a*c < 0.0) {
//         return -1.0;
//     }
//     return (-b - sqrt((b*b) - 4.0*a*c))/(2.0*a);
// }


bool intersectLine(vec3 ro, vec3 rd, vec3 v0, vec3 v1, vec3 v2, inout float t, inout vec3 normal) {
    

    float r = v2.x;

    vec3  AB = v1 - v0;
    vec3  AO = ro - v0;
    vec3  AOxAB = cross(AO, AB);
    vec3  VxAB  = cross(rd, AB);
    float ab2 = dot(AB, AB);
    float a = dot(VxAB, VxAB);
    float b = 2.0 * dot(VxAB, AOxAB);
    float c = dot(AOxAB, AOxAB) - (r*r * ab2);
    float d = b * b - 4.0 * a * c;

    if (d < 0.0) return false;

    float time = (-b - sqrt(d)) / (2.0 * a);
    if (time < 0.0) return false;

    t = time;
    // normal = normalize(vec3(0.0, 0.0, -1.0));

    



    vec3 intersection = ro + rd * time;        /// intersection point
    // vec3 projection = v0 + (dot(AB, intersection - v0) / ab2) * AB; /// intersection projected onto cylinder axis
    // if (length(projection - v0) + length(v1 - projection) > length(AB)) return false; /// THIS IS THE SLOW SAFE WAY
    // normal = normalize(intersection - projection);



    // **************** slower way of getting the normal
    vec3 P1 = v0;
    vec3 v = normalize(v1 - v0);
    vec3 P2 = intersection;
    float vt = (dot(P2-P1, v) / dot(v, v));
    vec3 Pr = P1 + vt * v;


    // ************* spheres check
    float ts1 = -1.0;
    float ts2 = -1.0;
    {
        float a = dot(rd, rd);
        vec3 s0_r0 = ro - v0;
        float b = 2.0 * dot(rd, s0_r0);
        float c = dot(s0_r0, s0_r0) - (r * r);
        if (b*b - 4.0*a*c < 0.0) {
            ts1 = -1.0;
        } else {
            ts1 = (-b - sqrt((b*b) - 4.0*a*c))/(2.0*a);    
        }
    }
    {
        float a = dot(rd, rd);
        vec3 s0_r0 = ro - v1;
        float b = 2.0 * dot(rd, s0_r0);
        float c = dot(s0_r0, s0_r0) - (r * r);
        if (b*b - 4.0*a*c < 0.0) {
            ts2 = -1.0;
        } else {
            ts2 = (-b - sqrt((b*b) - 4.0*a*c))/(2.0*a);    
        }
    }
    if(ts1 > 0.0 && vt < 0.0) {
        normal = normalize((ro + rd * ts1) - v0);
        t = ts1;
        return true;
    }
    if(ts2 > 0.0 && vt > length(AB)) {
        normal = normalize((ro + rd * ts2) - v1);
        t = ts2;
        return true;
    }
    // ************* spheres check - END


    if(vt < 0.0)        return false;
    if(vt > length(AB)) return false;

    normal = normalize(intersection - Pr);
    // **************** slower way of getting the normal - END


    t = time; /// at last

    return true;
}`;