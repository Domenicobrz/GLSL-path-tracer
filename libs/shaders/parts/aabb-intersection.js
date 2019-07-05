let shaderpart_aabbIntersection = `

// bool intersectAABB(vec3 ro, vec3 rd, vec3 min, vec3 max, inout float t) {
bool intersectAABB(vec3 ro, vec3 rd, vec3 _min, vec3 _max, inout float t) {

    // float tmin = (min.x - ro.x) / rd.x; 
    // float tmax = (max.x - ro.x) / rd.x; 
    
    // if (tmin > tmax) {
    //     // swap(tmin, tmax)
    //     float temp = tmin;
    //     tmin = tmax;
    //     tmax = temp;
    // }; 
    
    // float tymin = (min.y - ro.y) / rd.y; 
    // float tymax = (max.y - ro.y) / rd.y; 
    
    // if (tymin > tymax) {
    //     // swap(tymin, tymax);
    //     float temp = tymin;
    //     tymin = tymax;
    //     tymax = temp;            
    // } 
    
    // if ((tmin > tymax) || (tymin > tmax)) 
    //     return false; 
    
    // if (tymin > tmin) 
    //     tmin = tymin; 
    
    // if (tymax < tmax) 
    //     tmax = tymax; 
    
    // float tzmin = (min.z - ro.z) / rd.z; 
    // float tzmax = (max.z - ro.z) / rd.z; 
    
    // if (tzmin > tzmax) {
    //     // swap(tzmin, tzmax);
    //     float temp = tzmin;
    //     tzmin = tzmax;
    //     tzmax = temp; 
    // }
    
    // if ((tmin > tzmax) || (tzmin > tmax)) 
    //     return false; 
    
    // if (tzmin > tmin) 
    //     tmin = tzmin; 
    
    // if (tzmax < tmax) 
    //     tmax = tzmax; 
    


    // t = tmin;
    // return true;









    vec3 invdir = 1.0 / rd;

	vec3 f = (_max - ro) * invdir;
	vec3 n = (_min - ro) * invdir;

	vec3 tmax = max(f, n);
	vec3 tmin = min(f, n);

	float t1 = min(tmax.x, min(tmax.y, tmax.z));
	float t0 = max(tmin.x, max(tmin.y, tmin.z));

    float res = (t1 >= t0) ? (t0 > 0.f ? t0 : t1) : -1.0; 
    t = res;

	return t >= 0.0;








    // in certi casi sembra non funzionare.... gd
    // vec3 invDir = 1.0 / rd;
    // vec3 tbot = invDir * (_min - ro);
    // vec3 ttop = invDir * (_max - ro);
    // vec3 tmin = min(ttop, tbot);
    // vec3 tmax = max(ttop, tbot);
    // vec2 tt = max(tmin.xx, tmin.yz);
    // float t0 = max(tt.x, tt.y);
    // tt = min(tmax.xx, tmax.yz);
    // float t1 = min(tt.x, tt.y);
    // t = t0;

    // return t1 > max(t0, 0.0);
}`;