import { Component, Node, _decorator } from "cc";
import { EnemyManagerSettings } from "../../Data/GameSettings";
import { XPSpawner } from "../../XP/XPSpawner";
import { Enemy } from "./Enemy";
import { EnemyMovementType } from "./EnemyMovementType";
import { EnemyMover } from "./EnemyMover/EnemyMover";
import { FollowTargetEnemyMover } from "./EnemyMover/FollowTargetEnemyMover";
import { PeriodicFollowTargetEnemyMover } from "./EnemyMover/PeriodicFollowTargetEnemyMover";
import { WaveEnemyMover } from "./EnemyMover/WaveEnemyMover";
import { CircularEnemySpawner } from "./EnemySpawner/CircularEnemySpawner";
import { EnemySpawner } from "./EnemySpawner/EnemySpawner";
import { IndividualEnemySpawner } from "./EnemySpawner/IndividualEnemySpawner";
import { WaveEnemySpawner } from "./EnemySpawner/WaveEnemySpawner";
import { EnemyType } from "./EnemyType";

const { ccclass, property } = _decorator;

@ccclass("EnemyManager")
export class EnemyManager extends Component {
    @property(EnemySpawner) private enemySpawner: EnemySpawner;
    @property(XPSpawner) private xpSpawner: XPSpawner;

    private movementTypeToMover: Map<EnemyMovementType, EnemyMover> = new Map<EnemyMovementType, EnemyMover>();

    private individualEnemySpawner: IndividualEnemySpawner;
    private circularEnemySpawner: CircularEnemySpawner;
    private waveEnemySpawner: WaveEnemySpawner;

    public init(targetNode: Node, settings: EnemyManagerSettings): void {
        this.enemySpawner.init(targetNode);
        this.enemySpawner.EnemyAddedEvent.on(this.onEnemyAdded, this);
        this.enemySpawner.enemyRemovedEvent.on(this.onRemoveEnemy, this);

        this.individualEnemySpawner = new IndividualEnemySpawner(this.enemySpawner, EnemyMovementType.Follow, EnemyType.Basic);
        this.circularEnemySpawner = new CircularEnemySpawner(this.enemySpawner, 30, EnemyMovementType.Follow, EnemyType.Basic);
        this.waveEnemySpawner = new WaveEnemySpawner(this.enemySpawner, settings.waveEnemySpawner);

        this.movementTypeToMover.set(EnemyMovementType.Follow, new FollowTargetEnemyMover(targetNode));
        this.movementTypeToMover.set(EnemyMovementType.Launch, new WaveEnemyMover(targetNode));
        this.movementTypeToMover.set(EnemyMovementType.PeriodicFollow, new PeriodicFollowTargetEnemyMover(targetNode, 5, 5));

        this.xpSpawner.init();
    }

    public gameTick(deltaTime: number): void {
        this.individualEnemySpawner.gameTick(deltaTime);
        this.circularEnemySpawner.gameTick(deltaTime);
        this.waveEnemySpawner.gameTick(deltaTime);

        for (const kvp of this.movementTypeToMover) {
            kvp[1].gameTick(deltaTime);
        }
    }

    private onEnemyDied(enemy: Enemy): void {
        enemy.DeathEvent.off(this.onEnemyDied);
        this.xpSpawner.spawnXp(enemy.node.worldPosition, 1);
    }

    private onEnemyAdded(enemy: Enemy): void {
        enemy.DeathEvent.on(this.onEnemyDied, this);
        this.getEnemyMover(enemy).addEnemy(enemy);
    }

    private onRemoveEnemy(enemy: Enemy): void {
        this.getEnemyMover(enemy).removeEnemy(enemy);
    }

    private getEnemyMover(enemy: Enemy): EnemyMover {
        if (this.movementTypeToMover.has(enemy.MovementType)) {
            return this.movementTypeToMover.get(enemy.MovementType);
        }

        throw new Error("Does not have mover of type " + enemy.MovementType);
    }
}
