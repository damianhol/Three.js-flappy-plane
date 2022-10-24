import { Group, Vector3 } from '../../libs/three137/three.module.js';
import { GLTFLoader } from '../../libs/three137/GLTFLoader.js';

class Obstacles{
    constructor(game){
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
		this.game = game;
		this.scene = game.scene;
        this.loadStar();
		this.loadBomb();
		this.tmpPos = new Vector3();
    }

    loadStar(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}plane/`);
        this.ready = false;
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'star.glb',
			// called when the resource is loaded
			gltf => {
				// first child of gltf scene is star or bomb
                this.star = gltf.scene.children[0];

                this.star.name = 'star';
				//only if bombs and stars exist they will be inicialized
				if (this.bomb !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

                this.loadingBar.update('star', xhr.loaded, xhr.total );
			
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}	

    loadBomb(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}plane/`);
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'bomb.glb',
			// called when the resource is loaded
			gltf => {

                this.bomb = gltf.scene.children[0];

                if (this.star !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

				this.loadingBar.update('bomb', xhr.loaded, xhr.total );
				
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}

	// initialize(){
    //     // prepares servar columns of objects
	// 	this.obstacle = [];

	// 	// 3js Group() === object3d, it's puropse is t make working with groups of objects more obvious in the code
	// 	const obstacle = new Group();

	// 	// first we add star, it will be at (0, 0, 0) in relation to the group object
	// 	obstacle.add(this.star);

	// 	//we rotate(90 degrees) the bomb and position it
	// 	this.bomb.rotation.x = -Math.PI * 0.5;
	// 	this.bomb.position.y = 7.5;
	// 	obstacle.add(this.bomb);


	// 	// we determine to rotate next bomb or not
	// 	let rotate = true;

	// 	for(let y = 5; y >- 8; y -= 2.5){
	// 		rotate = !rotate;
	// 		// we skip y = 0 cause star is y = 0
	// 		if (y == 0) continue;
	// 		// clone the bomb
	// 		const bomb = this.bomb.clone();
	// 		bomb.rotation.x = (rotate) ? -Math.PI * 0.5 : 0;
	// 		bomb.position.y = y;
	// 		obstacle.add(bomb);
	// 		//when loop finishes it containes 7 objects, 6 bombs and a star
	// 	}
	// 	// adding 7 objects to obstacle array
	// 	this.obstacles.push(obstacle);
	// 	// adding it to 3js scene
	// 	this.scene.add(obstacle);

	// 	//we want serveral of such rows so we create 2nd for loop

	// 	for (let i = 0; i < 3; i++){
	// 		const obstacle1 = obstacle.clone();

	// 		this.scene.add(obstacle1);
	// 		this.obstacles.push(obstacle1);
	// 	}
		
	// 	this.reset();
	// 	// set ready flag to true
	// 	this.ready = true;

    // }

	initialize(){
        this.obstacles = [];
        
        const obstacle = new Group();
        
        obstacle.add(this.star);
        
        this.bomb.rotation.x = -Math.PI*0.5;
        this.bomb.position.y = 7.5;
        obstacle.add(this.bomb);

        let rotate=true;

        for(let y=7.5; y>-8; y-=2.5){
            rotate = !rotate;
            if (y==0) continue;
            const bomb = this.bomb.clone();
            bomb.rotation.x = (rotate) ? -Math.PI*0.5 : 0;
            bomb.position.y = y;
            obstacle.add(bomb);
        
        }
        this.obstacles.push(obstacle);

        this.scene.add(obstacle);

        for(let i=0; i<3; i++){
            
            const obstacle1 = obstacle.clone();
            
            this.scene.add(obstacle1);
            this.obstacles.push(obstacle1);

        }

        this.reset();

		this.ready = true;
	}

    reset(){
        this.obstacleSpawn = { pos: 20, offset: 5 };
		// call respawnObstacle() for each obstacle group
		this.obstacles.forEach( obstacle => this.respawnObstacle(obstacle));
    }

    respawnObstacle( obstacle ){
        this.obstacleSpawn.pos += 30;
		// value in a range -1 to 1 * obstacle.Spawn.offet = values from -offset to offset
		const offset = (Math.random() * 2 -1) * this.obstacleSpawn.offset;
		// increase offset value each time this method is called
		this.obstacleSpawn.offset += 0.2;
		//position obstacle (x, y, z)
		obstacle.position.set(0, offset, this.obstacleSpawn.pos);
		//first child is the star and we rotate it randomly on y axis
		obstacle.children[0].rotation.y = Math.random() * Math.PI * 2;
		//all object3d instances gave userrdata object used to store custom data
		obstacle.userData.hit = false;
		// we iterate through all children of obstacle and set them visible
			obstacle.children.forEach(child => {
				child.visible = true;
			})
	}

	update(pos){
        //the only obstacle group the plane could collide with
		let collisionObstacle;

		this.obstacles.forEach( obstacle => {
			//star
			obstacle.children[0].rotateY(0, 0.1);
			//relative z position of obstacle & plane by substracting plane's position from the obstacle position
			const relativePosZ = obstacle.position.z - pos.z;
			//we chceck if the absolute calue of this is less than 2
			if (Math.abs(relativePosZ) < 2 && !obstacle.userData.hit){
				collisionObstacle = obstacle;
			}
			//if the obstacle is 20m behind the plane
			if (relativePosZ < -20){
				//if so we can respawn it ahead of the plane
				this.respawnObstacle(obstacle);


			}


		});

		//checking for collision
		//checking if collisionObstacle has been defined in the  previous section of code
		if (collisionObstacle !== undefined){
			const planePos = this.game.plane.position;

			// some method of an array returns true or false basen on fuction that tests each element of the array
			collisionObstacle.children.some(child => {
				child.getWorldPosition(this.tmpPos);
				const dist = this.tmpPos.distanceToSquared(planePos);
				if (dist < 5) {
					collisionObstacle.userData.hit = true;
					this.hit(child);
					return true;
				}
			})

		}

    }

	hit(obj){

		if (obj.name == 'star'){
			this.game.incScore();
		}else{
			this.game.decLives();
		}

		obj.visible = false;
	}
}

export { Obstacles };