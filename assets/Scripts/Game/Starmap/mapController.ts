
import { _decorator, Component, Label, Node, UITransform, Vec2, EventTouch, macro, log, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MapControl')
export class MapControl extends Component {

    @property({
        type: Node,
        tooltip: 'Target_Node'
    })
    public map: Node = null;

    // @property(Label)
    // public scaleTime: Label = null;

    @property({
        tooltip: 'Image_initial_zoom'
    })
    public defaultScaling: number = 1.1;

    @property({
        tooltip: 'Image_zoom_minimum_scale'
    })
    public minScale: number = 1;

    @property({
        tooltip: 'Image_zoom_maximum_scale'
    })
    public maxScale: number = 3;

    @property({
        tooltip: 'Single-touch_tolerance'
    })
    public moveOffset: number = 2;

    @property({
        tooltip: 'Scroll_Wheel_zoom_ratio'
    })
    public increaseRate: number = 10000;

    public locked: boolean = false; // Operation lock
    private isMoving: boolean = false; // Whether to drag the map
    public singleTouchCb: Function = null; // Click callback function

    protected start() {
        // macro.ENABLE_MULTI_TOUCH = true;

        this.addEvent();
        this.smoothOperate(this.map, new Vec3(0,0,0), new Vec3(this.defaultScaling,this.defaultScaling,this.defaultScaling));
    }

    // Some devices are too sensitive for a single point, and a single point operation will trigger the TOUCH_MOVE callback, where the error value is judged
    private canStartMove(touch: any): boolean {
        let startPos: Vec3 = touch.getStartLocation();
        let nowPos: Vec3 = touch.getLocation();
        return (Math.abs(nowPos.x - startPos.x) > this.moveOffset
            || Math.abs(nowPos.y - startPos.y) > this.moveOffset);

    }

  
    private addEvent() {
        let self = this;
        this.node.on(Node.EventType.TOUCH_MOVE, function (event: any) {
            if (self.locked) return;

            let touches: any[] = event.getTouches(); // Get all touch points
            if (touches.length >= 2) {
                // multi touch
                self.isMoving = true;
                let touch1: any = touches[0];
                let touch2: any = touches[1];
                let delta1: Vec3 = touch1.getDelta();
                let delta2: Vec3 = touch2.getDelta();

                let touchPoint1: Vec3 = self.map.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(touch1.x,touch1.y,0));
                let touchPoint2: Vec3 = self.map.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(touch2.x,touch2.y,0));
                let distance: Vec3 = touchPoint1.subtract(touchPoint2);
                let delta: Vec3 = delta1.subtract(delta2);
                let scale: number = 1;
                if (Math.abs(distance.x) > Math.abs(distance.y)) {
                    scale = (distance.x + delta.x) / distance.x * self.map.scale.x;
                }
                else {
                    scale = (distance.y + delta.y) / distance.y * self.map.scale.y;
                }
                let pos: Vec3 = touchPoint2.add(new Vec3(distance.x / 2, distance.y / 2));
                self.smoothOperate(self.map, pos, new Vec3(scale,scale,scale));
            }
            else if (touches.length === 1) {
                // single touch
                if (self.isMoving || self.canStartMove(touches[0])) {
                    self.isMoving = true;
                    self.dealMove(touches[0].getDelta(), self.map, self.node);
                }
            }
        }, this);

        this.node.on(Node.EventType.TOUCH_END, function (event: any) {
            if (self.locked) return;

            if (event.getTouches().length <= 1) {
                if (!self.isMoving) {
                    let worldPos: Vec3 = event.getLocation();
                    let nodePos: Vec3 = self.map.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(worldPos.x,worldPos.y,0));
                    self.dealSelect(nodePos);
                }
                self.isMoving = false; // Reset the mobile flag when there is only the last touch point in the container
            };
        }, this);

        this.node.on(Node.EventType.TOUCH_CANCEL, function (event: any) {
            if (self.locked) return;

            if (event.getTouches().length <= 1) { // When there is only the last touch point in the container, the mobile flag is restored
                self.isMoving = false;
            }
        }, this);

        this.node.on(Node.EventType.MOUSE_WHEEL, function (event: any) {
            if (self.locked) return;

            let worldPos: Vec3 = event.getLocation();
            let scrollDelta: number = event.getScrollY();
            let scale: number = (self.map.scale.x + (scrollDelta / self.increaseRate));

            let target: Node = self.map;
            let pos: Vec3 = target.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(worldPos.x,worldPos.y,0));
            self.smoothOperate(target, pos, new Vec3(scale,scale,0));
        }, this);
    }

    private smoothOperate(target: Node, pos: Vec3, scale: Vec3) {
        // Zoom in
        if (this.minScale <= scale.x && scale.x <= this.maxScale) {
            // The difference between the current zoom value and the original zoom value
            let deltaScale: number = scale.x - target.scale.x;
            // The difference between the current click coordinate and the zoom value
            let gapPos: Vec3 = pos.multiplyScalar(deltaScale);
            // The current node coordinate position minus the click coordinate and zoom value
            let mapPos: Vec3 = target.position.subtract(gapPos);
            let num =  Math.floor(scale.x * 100) / 100;
            target.scale = new Vec3(num,num,0);
            this.dealScalePos(mapPos, target);
        }
        else {
            scale = scale.clampf(new Vec3(this.minScale,this.minScale,this.minScale),new Vec3(this.maxScale,this.maxScale,this.maxScale));
        }
        // Update label Display
        // this.scaleTime.string = `${Math.floor(scale.x * 100)}%`;
    }

    private dealScalePos(pos: Vec3, target: Node) {
        if (target.scale.x === 1) {
            pos = new Vec3(0, 0, 0);
        }
        else {
            let worldPos: Vec3 = this.node.getComponent(UITransform)?.convertToWorldSpaceAR(pos);
            let nodePos: Vec3 = this.node.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(worldPos.x,worldPos.y,0));
            let edge: any = this.calculateEdge(target, this.node, nodePos);
            if (edge.left > 0) {
                pos.x -= edge.left;
            }
            if (edge.right > 0) {
                pos.x += edge.right;
            }
            if (edge.top > 0) {
                pos.y += edge.top;
            }
            if (edge.bottom > 0) {
                pos.y -= edge.bottom;
            }
        }
        target.position = pos;
    }

    private dealMove(dir: Vec3, map: Node, container: Node) {
        let worldPos: Vec3 = map.getComponent(UITransform)?.convertToWorldSpaceAR(new Vec3(0, 0, 0));
        let nodePos: Vec3 = container.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(worldPos.x,worldPos.y,0));
        nodePos.x += dir.x;
        nodePos.y += dir.y;
        let edge: any = this.calculateEdge(map, container, nodePos);
        let x = map.position.x;
        let y = map.position.y;
        if (edge.left <= 0 && edge.right <= 0) {
             x = map.position.x + dir.x;
            // console.log(num,'>>>++++++')
            // map.x += dir.x;
        }
        if (edge.top <= 0 && edge.bottom <= 0) {
            y = map.position.y + dir.y;
            // map.y += dir.y;
        }
        map.setPosition(x,y,0)
    }

    private dealSelect(nodePos: Vec3) {
        log(`click map on (${nodePos.x}, ${nodePos.y})`);
        // do sth
        if (this.singleTouchCb) this.singleTouchCb(nodePos);
    }

    // Calculate the distance between the four sides of the map and the container, if it is negative, it means it is beyond the map
    public calculateEdge(target: Node, container: Node, nodePos: Vec3): any {
        // distance to the edge when anchor is (0.5, 0.5)
        let horizontalDistance: number = (container.getComponent(UITransform)!.width - target.getComponent(UITransform)!.width * target.scale.x) / 2;
        let verticalDistance: number = (container.getComponent(UITransform)!.height - target.getComponent(UITransform)!.height * target.scale.y) / 2;

        let left: number = horizontalDistance + nodePos.x;
        let right: number = horizontalDistance - nodePos.x;
        let top: number = verticalDistance - nodePos.y;
        let bottom: number = verticalDistance + nodePos.y;

        return { left, right, top, bottom };
    }
}


