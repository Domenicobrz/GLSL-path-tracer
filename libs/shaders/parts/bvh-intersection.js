let shaderpart_bvhIntersection = `

bool BVHintersect(vec3 ro, vec3 rd, inout float t, inout vec3 color) {
    float mint = 9999999999999999.0;
    // let closestObject;
    // let closestResult;

    bool weHitSomething = false;


    vec2 toVisit [100];
    int stackPointer = 1; // always one above the last element
    toVisit[0] = vec2(0.0, 0.0);



    vec2 pixelOffset = vec2(1.0 / uDataTextureSize, 0.0); 
    vec2 dataTexturePixelCentralOffset = vec2(1.0 / (uDataTextureSize * 2.0));



    const int maxSteps = 500;   
    for(int i = 0; i < maxSteps; i++) {
        if(stackPointer == 0) break; // finished

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

            if(hasChild1) {
                // get the data and try an intersection test
                vec2 childNodePointer = childrenIndexesData.xy / uDataTextureSize + dataTexturePixelCentralOffset;
                vec3 childMin = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 0.0).xyz;
                vec3 childMax = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 1.0).xyz;

                intersectsChild1 = intersectAABB(ro, rd, childMin, childMax, child1T);
            }

            if(hasChild2) {
                // get the data and try an intersection test
                vec2 childNodePointer = (childrenIndexesData.zw / uDataTextureSize) + dataTexturePixelCentralOffset;
                vec3 childMin = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 0.0).xyz;
                vec3 childMax = texture2D(bvhDataTexture, childNodePointer + pixelOffset * 1.0).xyz;

                intersectsChild2 = intersectAABB(ro, rd, childMin, childMax, child2T);
            }


            if (!intersectsChild1 && !intersectsChild2) { 
                continue;
            } else if (intersectsChild1 && !intersectsChild2 && (child1T < mint)) {
                stackPointer++;
                toVisit[stackPointer - 1] = childrenIndexesData.xy;
            } else if (!intersectsChild1 && intersectsChild2 && (child2T < mint)) {    
                stackPointer++;
                toVisit[stackPointer - 1] = childrenIndexesData.zw;
            } else {
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
            }
        }


        if(leaf) {
            bool intersects = false; 

            // here we don't test the intersection with the aabb, but with the object itself !
            vec2 triangleDataPointer = texture2D(bvhDataTexture, bvhNodePointer + pixelOffset * 2.0).xy / uDataTextureSize + dataTexturePixelCentralOffset;

            vec3 v0 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 0.0).xyz;
            vec3 v1 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 1.0).xyz;
            vec3 v2 = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 2.0).xyz;


            float res = intersectTriangle(
                ro,
                rd,
                v0,
                v1,
                v2
            );
            
            if(res > -0.5 && res < mint) {
                color = texture2D(trianglesDataTexture, triangleDataPointer + pixelOffset * 3.0).xyz;

                mint = res;
                weHitSomething = true;
            }
        }
    }

    return weHitSomething;











    // while (toVisit.length !== 0) {
    //     let node = toVisit.pop();
    //     // this.stats.intersectionCalls++;

    //     if (!node.leaf) {
    //         let res1 = false;
    //         let res2 = false;
    //         if(node.child1) res1 = node.child1.aabb.intersect(ray);
    //         if(node.child2) res2 = node.child2.aabb.intersect(ray);

    //         // USE FALSE AND NOT THE CONTRACTED IF FORM -- ZERO WOULD TEST AS FALSE!! (and we might need to check for a value of 0 instead of false)
    //         if(res1 === false && res2 === false) {
    //             continue;
    //         } else if (res1 !== false && res2 === false && (res1.t < mint)) {
    //             toVisit.push(node.child1);
    //         } else if (res1 === false && res2 !== false && (res2.t < mint)) {
    //             toVisit.push(node.child2);
    //         } else {
    //             if (res1.t < res2.t) {
    //                 if (res2.t < mint) toVisit.push(node.child2);
    //                 if (res1.t < mint) toVisit.push(node.child1);   // will be the first one of the two popped from the array 
    //             } else {
    //                 if (res1.t < mint) toVisit.push(node.child1);
    //                 if (res2.t < mint) toVisit.push(node.child2);   // will be the first one of the two popped from the array
    //             }
    //         }
    //     }

    //     if (node.leaf) {
    //         let res = false;

    //         // here we don't test the intersection with the aabb, but with the object itself !
    //         res = node.intersect(ray);

    //         if(res !== false && res.t < mint) {
    //             mint = res.t;
    //             closestObject = node;
    //             closestResult = res;
    //         } 
    //     }
    // }

    // // this.stats.averageIntersectionCalls = this.stats.intersectionCalls / this.stats.intersectionTests;

    // if(closestResult) 
    //     return { t: closestResult.t, normal: closestResult.normal, object: closestObject };
    // else
    //     return false;
}`;