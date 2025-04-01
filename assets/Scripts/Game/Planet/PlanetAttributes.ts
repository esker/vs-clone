import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlanetAttributes')
export class PlanetAttributes extends Component {
    @property
    attributeName: string = "";
    @property
    modifier: number = 0;
    @property
    info: string = "";
}


