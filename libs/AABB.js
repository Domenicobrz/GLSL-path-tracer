let aabbIntersectionTestsMade = 0;
class AABB {
    constructor() {
        this.min = new THREE.Vector3(+Infinity, +Infinity, +Infinity);
        this.max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    }

    addVertex(vertex) {
        if(vertex.x < this.min.x) this.min.x = vertex.x;
        if(vertex.y < this.min.y) this.min.y = vertex.y;
        if(vertex.z < this.min.z) this.min.z = vertex.z;
        
        if(vertex.x > this.max.x) this.max.x = vertex.x;
        if(vertex.y > this.max.y) this.max.y = vertex.y;
        if(vertex.z > this.max.z) this.max.z = vertex.z;
    }

    addAABB(aabb) {
        this.addVertex(aabb.min);
        this.addVertex(aabb.max);
    }

    intersect(ray) {
        aabbIntersectionTestsMade++;
        // // r.dir is unit direction vector of ray
        // let dirfrac_x = 1 / ray.d[0];
        // let dirfrac_y = 1 / ray.d[1];
        // // lb is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
        // // r.org is origin of ray
        // let t1 = (this.min[0] - ray.o[0]) * dirfrac_x;
        // let t2 = (this.max[0] - ray.o[0]) * dirfrac_x;
        // let t3 = (this.min[1] - ray.o[1]) * dirfrac_y;
        // let t4 = (this.max[1] - ray.o[1]) * dirfrac_y;

        // let t    = Infinity;
        // let tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
        // let tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

        // // if tmax < 0, ray (line) is intersecting AABB, but the whole AABB is behind us
        // if (tmax < 0) {
        //     t = tmax;
        //     return false;
        // }

        // // if tmin > tmax, ray doesn't intersect AABB
        // if (tmin > tmax) {
        //     t = tmax;
        //     return false;
        // }

        // t = tmin;
        
        // let result = {
        //     t: tmin,
        // };

        // return result;











        // CODICE SBAGLIATO!! SE CAMBI IL RAY ORIGIN PER QUALCHE MOTIVO NON FUNZIONA PIU'
        // CODICE SBAGLIATO!! SE CAMBI IL RAY ORIGIN PER QUALCHE MOTIVO NON FUNZIONA PIU'
        // CODICE SBAGLIATO!! SE CAMBI IL RAY ORIGIN PER QUALCHE MOTIVO NON FUNZIONA PIU'
        // CODICE SBAGLIATO!! SE CAMBI IL RAY ORIGIN PER QUALCHE MOTIVO NON FUNZIONA PIU'
        // CODICE SBAGLIATO!! SE CAMBI IL RAY ORIGIN PER QUALCHE MOTIVO NON FUNZIONA PIU'
        // CODICE SBAGLIATO!! SE CAMBI IL RAY ORIGIN PER QUALCHE MOTIVO NON FUNZIONA PIU'

        let tmin = (this.min.x - ray.o.x) / ray.d.x; 
        let tmax = (this.max.x - ray.o.x) / ray.d.x; 
        
        if (tmin > tmax) {
            // swap(tmin, tmax)
            let temp = tmin;
            tmin = tmax;
            tmax = temp;
        }; 
        
        let tymin = (this.min.y - ray.o.y) / ray.d.y; 
        let tymax = (this.max.y - ray.o.y) / ray.d.y; 
        
        if (tymin > tymax) {
            // swap(tymin, tymax);
            let temp = tymin;
            tymin = tymax;
            tymax = temp;            
        } 
        
        if ((tmin > tymax) || (tymin > tmax)) 
            return false; 
        
        if (tymin > tmin) 
            tmin = tymin; 
        
        if (tymax < tmax) 
            tmax = tymax; 
        
        let tzmin = (this.min.z - ray.o.z) / ray.d.z; 
        let tzmax = (this.max.z - ray.o.z) / ray.d.z; 
        
        if (tzmin > tzmax) {
            // swap(tzmin, tzmax);
            let temp = tzmin;
            tzmin = tzmax;
            tzmax = temp; 
        }
        
        if ((tmin > tzmax) || (tzmin > tmax)) 
            return false; 
        
        if (tzmin > tmin) 
            tmin = tzmin; 
        
        if (tzmax < tmax) 
            tmax = tzmax; 
        
        // careful!! it can be zero, and needs to be distinguished from "false"
        return {
            t: tmin
        };    

    }
}