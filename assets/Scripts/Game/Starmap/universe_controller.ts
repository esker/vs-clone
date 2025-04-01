import { _decorator, Component, Label, Node, Canvas, ImageAsset } from 'cc';
const { ccclass, property } = _decorator;


@ccclass('universe_controller')
export class universe_controller extends Component {

    @property
    public gameTime = 15
  
    @property({type: Label})
    timerLabel : Label = null;
    
    private startTime = 0;
    private min = 0;

    @property(ImageAsset)
    private cursorImage : ImageAsset = null;

    @property(Node)
    public enemyPlanet : Node = null;

    start() {
        const canvas = document.getElementById("GameCanvas");
        canvas.style.cursor = `url("${this.cursorImage.nativeUrl}"), auto`;

        
    }

    update(deltaTime: number) {
        // set game timer
        this.startTime += deltaTime;
        this.timerLabel.string = Math.floor(this.min).toString() + ":" + (this.startTime < 10 ? "0" : "") + Math.floor(this.startTime).toString();
        if (this.startTime > 60) {
            this.startTime = 0;
            this.min++;
        }
        if (this.min === this.gameTime) {
            //end the game
            console.log("GAME OVER");
        }
        
    }

    //this is where we'll begin spawning the obstacles 
    // space rocks 0 - 200
    // asteroids 200 - 400
    //raders 1 400 - 600
    // raders 1 and asteroids 600 - 700
    // raders 1 and 2 700 - 800
    // planning time - 800 - 900
    // Raider boss 900 - 1000 locked in get first piece of dark matter 
    // this allows you to upgrade the units you have in game.
}

