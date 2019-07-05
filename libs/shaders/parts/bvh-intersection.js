let shaderpart_bvhIntersection = `

bool BVHintersect(vec3 ro, vec3 rd, inout float t, inout vec3 color, inout vec3 normal, inout float stepsTaken,
                  bool secondBounce, bool skip) {

    if(skip) return false;

    float mint = 9999999999999999.0;

    bool collisionDetected = false;


    vec2 toVisit [64];
    int stackPointer = 1; // always one above the last element
    toVisit[0] = vec2(0.0, 0.0);


    vec2 pixelOffset = vec2(1.0 / uDataTextureSize, 0.0); 
    vec2 dataTexturePixelCentralOffset = vec2(1.0 / (uDataTextureSize * 2.0));


    int iterationsMade = 0;




    while(stackPointer > 0) {
        iterationsMade++;
        // if(iterationsMade > 100 && secondBounce) {
        //     stepsTaken = float(stackPointer);
        //     color = vec3(100.0);
        //     return collisionDetected;
        // }


        
        // used to debug old bugs
        // used to debug old bugs
        // used to debug old bugs
        // if( iterationsMade == 6 &&
        //     secondBounce == true
        //     && stackPointer == 6 
        //     &&  
        //     gl_FragCoord.x > 1192.5 && 
        //     gl_FragCoord.x < 1193.8 &&
        //     gl_FragCoord.y > 9.7 &&
        //     gl_FragCoord.y < 10.6
        //     ) {
        //     color = vec3(100);
        //     return true;
        // } 
        // used to debug old bugs
        // used to debug old bugs
        // used to debug old bugs





        stackPointer--; // pop

        vec2 bvhNodePointer = toVisit[stackPointer] / uDataTextureSize + dataTexturePixelCentralOffset;
     
        bool leaf = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 0.0).w > 0.5 ? true : false;


        if(!leaf) {    

            bool intersectsChild1 = false;
            bool intersectsChild2 = false;

            vec4 childrenIndexesData = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 2.0);
            bool hasChild1 = childrenIndexesData.x > -0.5 ? true : false;
            bool hasChild2 = childrenIndexesData.z > -0.5 ? true : false;

            float child1T = 999999999999999999.0;
            float child2T = 999999999999999999.0;

            // get the data and try an intersection test
            vec2 childNodePointer = childrenIndexesData.xy / uDataTextureSize + dataTexturePixelCentralOffset;
            vec3 childMin = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 0.0).xyz;
            vec3 childMax = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 1.0).xyz;

            intersectsChild1 = intersectAABB(ro, rd, childMin, childMax, child1T);

            {
                // get the data and try an intersection test
                vec2 childNodePointer = (childrenIndexesData.zw / uDataTextureSize) + dataTexturePixelCentralOffset;
                vec3 childMin = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 0.0).xyz;
                vec3 childMax = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 1.0).xyz;
                
                intersectsChild2 = intersectAABB(ro, rd, childMin, childMax, child2T);
            }


            if(intersectsChild1 && child1T > 999999999.0) return false;
            if(intersectsChild2 && child2T > 999999999.0) return false;


        
            if(intersectsChild1 && intersectsChild2) {
                if (child1T < child2T) {
                    if (child2T < mint) {
                        stackPointer++;
                        toVisit[stackPointer - 1] = childrenIndexesData.zw;
                    }
                    if (child1T < mint) {
                        stackPointer++;
                        toVisit[stackPointer - 1] = childrenIndexesData.xy;     // this way child1 will be taken out of the stack before child2
                    }
                } else {
                    if (child1T < mint) {
                        stackPointer++;
                        toVisit[stackPointer - 1] = childrenIndexesData.xy;
                    }
                    if (child2T < mint) {
                        stackPointer++;
                        toVisit[stackPointer - 1] = childrenIndexesData.zw;     // this way child2 will be taken out of the stack before child1
                    }
                }
            } else if (intersectsChild1 && (child1T < mint)) {
                stackPointer++;
                toVisit[stackPointer - 1] = childrenIndexesData.xy;
            } else if (intersectsChild2 && (child2T < mint)) {
                stackPointer++;
                toVisit[stackPointer - 1] = childrenIndexesData.zw;
            }
        }


        if(leaf) {
            // here we don't test the intersection with the aabb, but with the object itself !
            vec2 triangleDataPointer = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 2.0).xy / uDataTextureSize + dataTexturePixelCentralOffset;

            vec3 v0 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 0.0).xyz;
            vec3 v1 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 1.0).xyz;
            vec3 v2 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 2.0).xyz;


            float it = 0.0;
            bool intersects = intersectTriangle(
                ro,
                rd,
                v0,
                v1,
                v2,
                it
            );
         
            if(intersects && it >= 0.0 && it < mint) {
                color = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 3.0).xyz;
                normal = calcTriangleNormal(v0, v1, v2);

                collisionDetected = true;
                mint = it;
            }
        }
    }

    stepsTaken = float(iterationsMade);

    t = mint;

    return collisionDetected;
}`;










































// let shaderpart_bvhIntersection = `

// bool BVHintersect(vec3 ro, vec3 rd, inout float t, inout vec3 color, inout vec3 normal, inout float stepsTaken) {

//     float mint = 9999999999999999.0;
//     // let closestObject;
//     // let closestResult;

//     bool collisionDetected = false;


//     vec2 toVisit [100];
//     int stackPointer = 1; // always one above the last element
//     toVisit[0] = vec2(0.0, 0.0);



//     vec2 pixelOffset = vec2(1.0 / uDataTextureSize, 0.0); 
//     vec2 dataTexturePixelCentralOffset = vec2(1.0 / (uDataTextureSize * 2.0));


//     int maxStackPointer = 0;
//     int iterationsMade = 0;
//     const int maxSteps = 100;   
//     while(stackPointer > 0) {
//         iterationsMade++;
//         if(iterationsMade > 100) {
//             break;
//         }

//         stackPointer--; // pop

//         vec2 bvhNodePointer = toVisit[stackPointer] / uDataTextureSize + dataTexturePixelCentralOffset;
     
//         bool leaf = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 0.0).w > 0.5 ? true : false;


//         if(!leaf) {
//             bool intersectsChild1 = false;
//             bool intersectsChild2 = false;

//             vec4 childrenIndexesData = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 2.0);
//             bool hasChild1 = childrenIndexesData.x > -0.5 ? true : false;
//             bool hasChild2 = childrenIndexesData.z > -0.5 ? true : false;

//             float child1T = 999999999999999999.0;
//             float child2T = 999999999999999999.0;

//             if(hasChild1) {
//                 // get the data and try an intersection test
//                 vec2 childNodePointer = childrenIndexesData.xy / uDataTextureSize + dataTexturePixelCentralOffset;
//                 vec3 childMin = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 0.0).xyz;
//                 vec3 childMax = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 1.0).xyz;

//                 intersectsChild1 = intersectAABB(ro, rd, childMin, childMax, child1T);
//             }

//             if(hasChild2) {
//                 // get the data and try an intersection test
//                 vec2 childNodePointer = (childrenIndexesData.zw / uDataTextureSize) + dataTexturePixelCentralOffset;
//                 vec3 childMin = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 0.0).xyz;
//                 vec3 childMax = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 1.0).xyz;

//                 intersectsChild2 = intersectAABB(ro, rd, childMin, childMax, child2T);
//             }


//             if (!intersectsChild1 && !intersectsChild2) { 
//                 continue;
//             } else if (intersectsChild1 && !intersectsChild2 && (child1T < mint)) {
//                 stackPointer++;
//                 toVisit[stackPointer - 1] = childrenIndexesData.xy;
//             } else if (!intersectsChild1 && intersectsChild2 && (child2T < mint)) {    
//                 stackPointer++;
//                 toVisit[stackPointer - 1] = childrenIndexesData.zw;
//             } else {
//                 if (child1T < child2T) {
//                     if (child2T < mint) {
//                         stackPointer++;
//                         toVisit[stackPointer - 1] = childrenIndexesData.zw;
//                     }
//                     if (child1T < mint) {
//                         stackPointer++;
//                         toVisit[stackPointer - 1] = childrenIndexesData.xy;     // this way child1 will be taken out of the stack before child2
//                     }
//                 } else {
//                     if (child1T < mint) {
//                         stackPointer++;
//                         toVisit[stackPointer - 1] = childrenIndexesData.xy;
//                     }
//                     if (child2T < mint) {
//                         stackPointer++;
//                         toVisit[stackPointer - 1] = childrenIndexesData.zw;     // this way child2 will be taken out of the stack before child1
//                     }
//                 }
//             }
//         }


//         if(leaf) {
//             // here we don't test the intersection with the aabb, but with the object itself !
//             vec2 triangleDataPointer = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 2.0).xy / uDataTextureSize + dataTexturePixelCentralOffset;

//             vec3 v0 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 0.0).xyz;
//             vec3 v1 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 1.0).xyz;
//             vec3 v2 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 2.0).xyz;


//             float it = 0.0;
//             bool intersects = intersectTriangle(
//                 ro,
//                 rd,
//                 v0,
//                 v1,
//                 v2,
//                 it
//             );
         
//             if(intersects && it >= 0.0 && it < mint) {
//                 color = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 3.0).xyz;
//                 normal = calcTriangleNormal(v0, v1, v2);

//                 collisionDetected = true;
//                 mint = it;
//             }
//         }
//     }


//     stepsTaken = float(maxStackPointer);
//     t = mint;
//     return collisionDetected;
// }`;
































// let shaderpart_bvhIntersection = `

// bool BVHintersect(vec3 ro, vec3 rd, inout float t, inout vec3 color, inout vec3 normal, inout float stepsTaken) {
//     float mint = 9999999999999999.0;
//     // let closestObject;
//     // let closestResult;

//     bool collisionDetected = false;


//     vec2 toVisit [100];
//     int stackPointer = 1; // always one above the last element
//     toVisit[0] = vec2(0.0, 0.0);



//     vec2 pixelOffset = vec2(1.0 / uDataTextureSize, 0.0); 
//     vec2 dataTexturePixelCentralOffset = vec2(1.0 / (uDataTextureSize * 2.0));


//     int iterationsMade = 0;
//     const int maxSteps = 100;   
//     while(true) {
//         iterationsMade++;
//         if(iterationsMade > 100) break;
//         if(stackPointer == 0) break; // finished

//         stackPointer--; // pop

//         vec2 bvhNodePointer = toVisit[stackPointer] / uDataTextureSize + dataTexturePixelCentralOffset;
        
//         bool leaf = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 0.0).w > 0.5 ? true : false;


//         if(!leaf) {
//             bool intersectsChild1 = false;
//             bool intersectsChild2 = false;

//             vec4 childrenIndexesData = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 2.0);
//             bool hasChild1 = childrenIndexesData.x > -0.5 ? true : false;
//             bool hasChild2 = childrenIndexesData.z > -0.5 ? true : false;

//             float child1T = 999999999999999999.0;
//             float child2T = 999999999999999999.0;

//             if(hasChild1) {
//                 // get the data and try an intersection test
//                 vec2 childNodePointer = childrenIndexesData.xy / uDataTextureSize + dataTexturePixelCentralOffset;
//                 vec3 childMin = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 0.0).xyz;
//                 vec3 childMax = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 1.0).xyz;

//                 intersectsChild1 = intersectAABB(ro, rd, childMin, childMax, child1T);
//             }

//             if(hasChild2) {
//                 // get the data and try an intersection test
//                 vec2 childNodePointer = (childrenIndexesData.zw / uDataTextureSize) + dataTexturePixelCentralOffset;
//                 vec3 childMin = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 0.0).xyz;
//                 vec3 childMax = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 1.0).xyz;

//                 intersectsChild2 = intersectAABB(ro, rd, childMin, childMax, child2T);
//             }


//             if (!intersectsChild1 && !intersectsChild2) { 
//                 continue;
//             } else if (intersectsChild1 && !intersectsChild2 && (child1T < mint)) {
//                 stackPointer++;
//                 toVisit[stackPointer - 1] = childrenIndexesData.xy;
//             } else if (!intersectsChild1 && intersectsChild2 && (child2T < mint)) {    
//                 stackPointer++;
//                 toVisit[stackPointer - 1] = childrenIndexesData.zw;
//             } else {
//                 if (child1T < child2T) {
//                     if (child2T < mint) {
//                         stackPointer++;
//                         toVisit[stackPointer - 1] = childrenIndexesData.zw;
//                     }
//                     if (child1T < mint) {
//                         stackPointer++;
//                         toVisit[stackPointer - 1] = childrenIndexesData.xy;     // this way child1 will be taken out of the stack before child2
//                     }
//                 } else {
//                     if (child1T < mint) {
//                         stackPointer++;
//                         toVisit[stackPointer - 1] = childrenIndexesData.xy;
//                     }
//                     if (child2T < mint) {
//                         stackPointer++;
//                         toVisit[stackPointer - 1] = childrenIndexesData.zw;     // this way child2 will be taken out of the stack before child1
//                     }
//                 }
//             }
//         }


//         if(leaf) {
//             // here we don't test the intersection with the aabb, but with the object itself !
//             vec2 triangleDataPointer = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 2.0).xy / uDataTextureSize + dataTexturePixelCentralOffset;

//             vec3 v0 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 0.0).xyz;
//             vec3 v1 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 1.0).xyz;
//             vec3 v2 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 2.0).xyz;


//             float it = 0.0;
//             bool intersects = intersectTriangle(
//                 ro,
//                 rd,
//                 v0,
//                 v1,
//                 v2,
//                 it
//             );
            
//             if(intersects && it >= 0.0 && it < mint) {
//                 color = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 3.0).xyz;
//                 normal = calcTriangleNormal(v0, v1, v2);

//                 mint = it;
//                 collisionDetected = true;
//             }
//         }
//     }


//     stepsTaken = float(iterationsMade);
//     t = mint;
//     return collisionDetected;


// }`;