function createMeshes(objects) {
    for(let j = 0; j < 15; j++) {
        for(let i = 0; i < 300; i++) {
            let a11 = (i / 300)     * Math.PI * 14;
            let a12 = (i / 300)     * Math.PI * 2 + j * 0.1;
            let a21 = ((i+1) / 300) * Math.PI * 14;
            let a22 = ((i+1) / 300) * Math.PI * 2 + j * 0.1;

            let r1 = 0; //Math.sin(i / 300 * Math.PI * 8)     * 0.8;
            let r2 = 0; //Math.sin((i+1) / 300 * Math.PI * 8) * 0.8;

            let v1 = new THREE.Vector3(0, 1 + r1, 0);
            v1.applyAxisAngle(new THREE.Vector3(0,0,1), a11);
            v1.add(new THREE.Vector3(-5,0,0));
            v1.applyAxisAngle(new THREE.Vector3(0,1,0), a12);
            v1.applyAxisAngle(new THREE.Vector3(1,0,0), -0.35);
            v1.add(new THREE.Vector3(0, j * 0.1 , 18));


            let v2 = new THREE.Vector3(0, 1 + r2, 0);
            v2.applyAxisAngle(new THREE.Vector3(0,0,1), a21);
            v2.add(new THREE.Vector3(-5,0,0));
            v2.applyAxisAngle(new THREE.Vector3(0,1,0), a22);
            v2.applyAxisAngle(new THREE.Vector3(1,0,0), -0.35);
            v2.add(new THREE.Vector3(0, j * 0.1, 18));

            // let r = 0.03 + Math.sin(j * 0.3) * 0.15;
            let r = 0.1;
            if(j % 3 === 0) {
                r = 0.3;
            }

            let object  = new Line(v1, v2, r);
            if(j % 3 === 0) {
                object.setColor(0.2 * 1, 0.5 * 1, 1 * 1);     
            }

            objects.push(object);
        }
    }
}