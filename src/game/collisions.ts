import { EntityId } from "../ecs/entity"
import { AABB, Vector2D } from "../lib/geometry"

export interface Hit {
    /**
     * Object that current object collided with
     */
    collider: EntityId
    /**
     * Point of contact between the objects
     */
    position: Vector2D
    /**
     * Overlap between the objects and can be added to colliding object's
     * position to get it back in a non-colliding state
     */
    delta: Vector2D
    /**
     * Surface normal at point of contact
     */
    normal: Vector2D
    /**
     * For segment and sweep intersections this is a fraction from 0 to 1
     * indicating how far along the line the collision occurred
     */
    time: number    
}

export interface Sweep {
    /**
     * Hit object if there was a collision, otherwise undefined
     */
    hit?: Hit
    /**
     * The furthest point the object reached along the sweep path before it hit
     * something
     */
    position: Vector2D
    /**
     * Copy of hit.time offset by epsilon or 1 if the object didn't hit anything
     * during the sweep
     */
    time: number
}

