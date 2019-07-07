function createMeshes(objects) {
    for(let j = 0; j < 450; j++) {

        let lx1 = Utils.rand() * 5 - 5 * 0.5; 
        let ly1 = Utils.rand() * 5 - 5 * 0.5;
        let lz1 = 10 + (Utils.rand() * 2.0 - 1.0) * 1.0;

        let r = 0.05;
        let z = Utils.rand() * 8;
        
        let lx2 = lx1 + (Utils.rand() * 2 - 1) * 0.5;
        let ly2 = ly1 + (Utils.rand() * 2 - 1) * 0.5;
        let lz2 = lz1 + z;

        let object  = new Line(
            new THREE.Vector3(lx1, ly1, lz1), 
            new THREE.Vector3(lx2, ly2, lz2), 
            r);
        
        let res = Utils.hslToRgb(Utils.rand() * 1 + 0, 1, 0.7);
        // object.setColor(res[0], res[1], res[2]);        
        object.setColor(1,1,1);        

        if(Utils.rand() > 0.65) {
            let grayValue = Math.pow(Math.random(), 1.0);
            object.setColor(0.15 * 2, 0.4 * 2, 1 * 2);        
        }

        objects.push(object);
    }
}