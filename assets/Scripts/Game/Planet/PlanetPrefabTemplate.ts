import { _decorator, Component, Node, Sprite, Label, CircleCollider2D } from 'cc';
import { Planet } from './PlanetList';
import { PlanetAttributes } from './PlanetAttributes';
const { ccclass, property } = _decorator;

@ccclass
export class PlanetPrefabTemplate extends Component {
    @property
    public id = 0;
    @property(Sprite)
    public icon: Sprite = null!;
    @property(Label)
    public planetName: Label = null!;
    @property(Label)
    public planetAttributeText: Label = null!;
    @property([PlanetAttributes])
    public planetAttributes: PlanetAttributes[] = [];


    // data: {id,iconSF,itemName,itemPrice}
    init(data: Planet) {
        this.id = data.id;
        this.icon.spriteFrame = data.planetSprite;
        this.planetName.string = data.planetName;
        this.planetAttributeText.string = data.planetAttributeText;
        this.planetAttributes = data.planetAttributes
    }
}