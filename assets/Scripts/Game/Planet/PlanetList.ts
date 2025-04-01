import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame, Vec3, randomRangeInt, randomRange } from 'cc';
import { PlanetPrefabTemplate } from './PlanetPrefabTemplate';
import { PlanetAttributes } from './PlanetAttributes';
const { ccclass, property } = _decorator;

@ccclass('Planet')
export class Planet {
    @property
    id = 0;
    
    @property
    planetName = "";
    
    @property
    planetAttributeText = "";

    @property(SpriteFrame)
    planetSprite: SpriteFrame = null!;

    @property([PlanetAttributes])
    planetAttributes: PlanetAttributes[] = [];
   
}

@ccclass("PlanetList")
export class PlanetList extends Component {
    @property([Planet])
    planets: Planet[] = [];

    @property(Prefab)
    planetPrefab: Prefab = null!;

    onLoad() {
        // loads a bunch of planets on the map with a random location
        // planets act like new characters with every new planet found in the universe you'll get new starting attributes
        // there shouldn't be too many per level and later on we'll have to check with the amount of planets the player has 
        // already
        let planetSpawnChance = Math.random() * 100;
        if (planetSpawnChance > 90) {
            for (let i = 0; i < this.planets.length; i++) {
                let planet = instantiate(this.planetPrefab);
                let planetData = this.planets[i];
                // ensure the sprite is the correct
                //set random scal
                let randomScale = randomRange(0.05, 0.12);
                planet.setScale(new Vec3(randomScale, randomScale, randomScale));

                // planet prefab is going to have it's own collider but we'll need to ensure it's the correct size
                //TODO: might have to fill this in later if the collider doesn't match the sprite
                
                // but we'll need so set a random location on the map
                let randomXPosition = randomRangeInt(-400, 400);
                let randomYPosition = randomRangeInt(-450, 450);
                planet.setPosition(new Vec3(randomXPosition, randomYPosition, 0));

                this.node.addChild(planet);
                (planet.getComponent("PlanetPrefabTemplate") as PlanetPrefabTemplate)!.init(planetData);
            }
        }  
    }
}


