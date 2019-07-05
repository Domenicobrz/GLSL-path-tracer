let shaderpart_triangleIntersection = `

bool intersectTriangle(vec3 ro, vec3 rd, vec3 v0, vec3 v1, vec3 v2, inout float t) {
    
    float kEpsilon = 0.0001;

    // // compute plane's normal
    // // Vec3f v0v1 = v1 - v0; 
    // // Vec3f v0v2 = v2 - v0; 
    // vec3 v0v1 = v1 - v0;
    // vec3 v0v2 = v2 - v0;

    // // no need to normalize
    // // Vec3f N = v0v1.crossProduct(v0v2); // N 
    // // float area2 = N.length(); 
    // vec3 N = cross(v0v1, v0v2);
    // float area2 = length(N);

    // // Step 1: finding P
    
    // // check if ray and plane are parallel ?
    // // float NdotRayDirection = N.dotProduct(dir); 
    // // if (fabs(NdotRayDirection) < kEpsilon) // almost 0 
    // //     return false; // they are parallel so they don't intersect ! 
    // float NdotRayDirection = dot(N, rd);
    // if(abs(NdotRayDirection) < kEpsilon) {
    //     return -1.0;
    // }
    
    // // compute d parameter using equation 2
    // // float d = N.dotProduct(v0); 
    // float d = dot(N, v0);
    
    // // compute t (equation 3)
    // // t = (N.dotProduct(orig) + d) / NdotRayDirection; 
    // float t = (dot(N, ro) + d) / NdotRayDirection; 
    // // check if the triangle is in behind the ray
    // if (t < 0.0) return -1.0; // the triangle is behind 
    
    // // compute the intersection point using equation 1
    // // Vec3f P = orig + t * dir; 
    // vec3 P = ro + t * rd;
    
    // // Step 2: inside-outside test
    // // Vec3f C; // vector perpendicular to triangle's plane 
    // vec3 C;

    
    // // edge 0
    // // Vec3f edge0 = v1 - v0; 
    // // Vec3f vp0 = P - v0; 
    // // C = edge0.crossProduct(vp0); 
    // // if (N.dotProduct(C) < 0) return false; // P is on the right side 
    // vec3 edge0 = v1 - v0;
    // vec3 vp0 = P - v0;
    // C = cross(edge0, vp0);
    // if(dot(N,C) < 0.0) {
    //     return -1.0;
    // }

    

    // // edge 1
    // // Vec3f edge1 = v2 - v1; 
    // // Vec3f vp1 = P - v1; 
    // // C = edge1.crossProduct(vp1); 
    // // if (N.dotProduct(C) < 0)  return false; // P is on the right side 
    // vec3 edge1 = v2 - v1;
    // vec3 vp1 = P - v1;
    // C = cross(edge1, vp1);
    // if(dot(N,C) < 0.0) {
    //     return -1.0;
    // }
    

    // // edge 2
    // // Vec3f edge2 = v0 - v2; 
    // // Vec3f vp2 = P - v2; 
    // // C = edge2.crossProduct(vp2); 
    // // if (N.dotProduct(C) < 0) return false; // P is on the right side; 
    // vec3 edge2 = v0 - v2;
    // vec3 vp2 = P - v2;
    // C = cross(edge2, vp2);
    // if(dot(N,C) < 0.0) {
    //     return -1.0;
    // }
    
    // return t;













    vec3 v0v1 = v1 - v0; 
    vec3 v0v2 = v2 - v0; 
    vec3 pvec = cross(rd, v0v2); 
    float det = dot(v0v1, pvec); 
// #ifdef CULLING 
//     // if the determinant is negative the triangle is backfacing
//     // if the determinant is close to 0, the ray misses the triangle
//     if (det < kEpsilon) return false; 
// #else 
    // ray and triangle are parallel if det is close to 0
    if (abs(det) < kEpsilon) return false; 
// #endif 
    float invDet = 1.0 / det; 
 
    vec3 tvec = ro - v0; 
    float u = dot(tvec, pvec) * invDet; 
    if (u < 0.0 || u > 1.0) return false; 
 
    vec3 qvec = cross(tvec, v0v1); 
    float v = dot(rd, qvec) * invDet; 
    if (v < 0.0 || u + v > 1.0) return false; 
 
    t = dot(v0v2, qvec) * invDet; 
 
    return true; 
}
`;