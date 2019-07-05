let shaderpart_calcTriangleNormal = `

vec3 calcTriangleNormal(vec3 v0, vec3 v1, vec3 v2) {
    vec3 U = v1 - v0;
    vec3 V = v2 - v0;

    vec3 normal = vec3(0.0);
    normal.x = (U.y * V.z) - (U.z * V.y);
    normal.y = (U.z * V.x) - (U.x * V.z);
    normal.z = (U.x * V.y) - (U.y * V.x);

    return normalize(normal);
}

`;