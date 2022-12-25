var width = 500;
var height = 600;
var groundHeight = 100;
var skyHeight = height - groundHeight;
var pipewidth = 80;//pipe width
var pipeGap = width - pipewidth - 100;//distance between two pipes
var birdLeft = 100;//Initial bird distance left
var birdIntSpeed = 8;
var birdDownRate = 0.4;
var groundSpeed = 4;
/*---------------------------*/
var pipes = [];
var pipePairGap = 180;//Distance between upper and lower pipes
var minPipeShow = 40;//Pipe leakage height
/*---------------------------*/
var stopAnimate = false;//Whether to stop the animation
var begin = false;//whether to start
var die = false;//dead or not
var score = 0;//Fraction
var hiScore = score;
var pipeIndex = 0;//record the number of tubes
var assets = {};


var renderer = new PIXI.Renderer({ x: 150, y: 150, width: width, height: height });
document.body.appendChild(renderer.view);

const stage = new PIXI.Container();
stage.interactive = true;
stage.buttonMode = true;
stage.on('mousedown', gameBegin);
stage.on('tap', gameBegin);

const backgroundMusic = PIXI.sound.Sound.from('../assets/audio/bgm.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.25;

init();

async function init(){
    await PIXI.Assets.load('../assets/images/spritesheet.json', onAssetsLoaded);
}
function onAssetsLoaded () {
    
    assets.bg = PIXI.Sprite.from("bg1.png");
	assets.bg.position.x = 0;
	assets.bg.position.y = 0;
	assets.bg.width = 500;
	assets.bg.height = 600;

	assets.pipeGroup = new PIXI.Container();
	var base_texture = PIXI.Texture.from("base.png");
	assets.fg = new PIXI.TilingSprite(base_texture, width, groundHeight);
	assets.fg.position.x = 0;
	assets.fg.position.y = skyHeight;

    var bird_texture_array = [
		PIXI.Texture.from("redbird-downflap.png"),
		PIXI.Texture.from("redbird-midflap.png"),
		PIXI.Texture.from("redbird-upflap.png")
	]
    assets.bird = new PIXI.AnimatedSprite(bird_texture_array);
	assets.bird.animationSpeed = 0.1;
	assets.bird.play();
	assets.bird.anchor.x = 0.5;
	assets.bird.anchor.y = 0.5;
	assets.bird.width  = 60;
	assets.bird.height = 48;
	assets.bird.speedY = birdIntSpeed;
	assets.bird.rate = birdDownRate;
	assets.bird.position.x = birdLeft;
	assets.bird.position.y = 200;

	assets.score = new PIXI.Text(String(score), {fill:'white'});
	assets.score.position.x = 250;
	assets.score.position.y = 20;    

	assets.hand = PIXI.Sprite.from("click.png");
	assets.hand.width = 60;
	assets.hand.height = 70;
	assets.hand.position.x = 115;
	assets.hand.position.y = 225;
	assets.hand.visible = true;

	assets.dialog = setDialog();
	for (key in assets) {
		stage.addChild(assets[key]);
	}

	animate();
}

function gameBegin() {
	if(!begin){
		backgroundMusic.play();
		begin = true;
		assets.hand.visible = false;
		assets.score.text = '0';
		addNewPile(); //Add the first pipe
	}
	assets.bird.speedY = birdIntSpeed;
}

function animate() {
	if(stopAnimate){
		return;
	}
	requestAnimationFrame(animate);
	assets.fg.tilePosition.x -= groundSpeed;
	var bird = assets.bird;
	if(begin){
			bird.position.y -= bird.speedY;
			bird.speedY -= bird.rate;
			if(bird.speedY > -3){
				if(bird.rotation < -Math.PI/8){
					bird.rotation = -Math.PI/8
				}
				else{
					bird.rotation -= Math.PI/180;
				}
			}
			else{
				if(bird.rotation > Math.PI/2){
					bird.rotation = Math.PI/2
				}
				else{
					bird.rotation += Math.PI/120;
				}
				
			}
	}
		
	if(die){
		
		bird.position.y += 10;
		bird.rotation += Math.PI/4;
		
		if(bird.rotation > Math.PI/2 && bird.position.y > skyHeight - bird.height/2){
			showDialog()
			stopAnimate = true;
		}
	}
	else{
	   if((bird.position.y + bird.height/2) > skyHeight){
	   		hit()
	   }
	   
	   for (var i = 0; i < pipes.length; i++){	
			pipes[i].pipe.position.x -= 4;
			pipes[i].pipe2.position.x -= 4;
			
			if(i == pipes.length - 1 && pipes[i].pipe.position.x <= pipeGap){
				addNewPile()
			}
			
			if(pipes[i].pipe.position.x == birdLeft){

				PIXI.sound.Sound.from({
					url: '../assets/audio/point.wav',
					autoPlay: true,
				});
				pass()
			}
			
			if(pipes[i].pipe.position.x + pipewidth/2 >=birdLeft - bird.width/2 && pipes[i].pipe.position.x - pipewidth/2 <=birdLeft + bird.width/2){
				if((bird.position.y-bird.height/2) < pipes[i].upper || (bird.position.y + bird.height/2) > pipes[i].lower){
					hit()
				}
			}
		}
	}
    renderer.render(stage);
}

function setDialog() {
	var dialogScore = new PIXI.Text(String(score));
	dialogScore.position.x = -12;
	dialogScore.position.y = -73;
	dialogScore.accessible = true;
	
	var dialogHiScore = new PIXI.Text(hiScore);
	dialogHiScore.position.x=-12;
	dialogHiScore.position.y=-40;
	
	var restartBtn = PIXI.Sprite.from("playagain.png");
	restartBtn.position.x = -50;
	restartBtn.position.y= 35;
	restartBtn.width = 99;
	restartBtn.height = 28;
	restartBtn.interactive = true;
	restartBtn.buttonMode = true;
	restartBtn.cursor = 'pointer';
	restartBtn.on('click', reStart);
	restartBtn.on('tap', reStart);
	var dialog = PIXI.Sprite.from("popup.png")
	dialog.visible = false;
	dialog.width = 300;
	dialog.height = 200;
	dialog.anchor.x = 0.5;
	dialog.anchor.y = 0.5;
	dialog.position.x = width/2;
	dialog.position.y = height/2;
		
	dialog.addChildAt(dialogScore, 0);
	dialog.addChildAt(dialogHiScore, 1);
	dialog.addChildAt(restartBtn, 2);
	return dialog;
}

function reStart() {
	begin = false;
	die = false;
	assets.hand.visible = true;
	stopAnimate = false;
	assets.bird.rotation = 0;
	assets.dialog.visible = false;
	pipeIndex = 0;//record the number of pipes
	score = 0;
	assets.pipeGroup.children = []
	pipes = [];
	assets.bird.position.x = birdLeft;
	assets.bird.position.y = 200;
	animate();
}

function hit(){
	die = true;
	PIXI.sound.Sound.from({
		url: '../assets/audio/hit.wav',
		autoPlay: true,
	});
}

function pass(){
	score ++;
	assets.score.text = score;
}

function addNewPile(){
	var pipe = PIXI.Sprite.from("pipe-green.png");
	var pipe2 = PIXI.Sprite.from("pipe-green.png");
	var pilePair = {};
	
	pipe.width = pipe2.width = pipewidth;
	pipe.height = pipe2.height = 500;
	pipe.anchor.x = pipe2.anchor.x = 0.5;
	pipe.anchor.y = pipe2.anchor.y = 0.5;
	pipe.rotation = Math.PI;
	
	/*=========================get the upper and lower bounds of the pipe=========================*/
	pipe.position.max = skyHeight - minPipeShow - pipePairGap - pipe.height/2;
	pipe.position.min = -(pipe.height/2 -minPipeShow);
	
	pipe.position.y = Math.floor(Math.random()*(pipe.position.max-pipe.position.min+1)+pipe.position.min)
	
	pipe2.position.y = pipe.height + pipe.position.y + pipePairGap;
	/*==================================================================================================== */
	pipe.position.x = pipe2.position.x = 600;
	
	pilePair.upper = pipe.position.y + pipe.height/2;
	pilePair.lower = pilePair.upper + pipePairGap;
	pilePair.pipe = pipe;
	pilePair.pipe2 = pipe2;
	
	assets.pipeGroup.addChild(pipe);
	assets.pipeGroup.addChild(pipe2);
	/*---------------------------*/
	pipeIndex++;
	if(pipeIndex > 3){
		pipes.shift();
	}
	
	pipes.push(pilePair);
	/*---------------------------*/
}
function showDialog(){

	backgroundMusic.stop();

	var storeHi = localStorage.getItem('ppbird_hiscore');
	
	if(storeHi > hiScore){
		hiScore = storeHi;
	}
	
	if(score > hiScore){
		hiScore = score;
		localStorage.setItem('ppbird_hiscore', hiScore);
	}
	
	assets.dialog.getChildAt(0).text = String(score);
	assets.dialog.getChildAt(1).text = hiScore;
	assets.dialog.visible = true;
}
