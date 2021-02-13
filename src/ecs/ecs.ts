import { Component, Entity, EntityClass, EntityId } from "./entity"
import { Query, makeKey } from "./query"
import { CleanupFunc, HooksContext, UseStateResult, retire, reset, useEffect, useMemo, useState, createContext } from "./hooks"
import { Vector2D } from "../lib/geometry"

export type SystemFunc = (world: WorldSystem) => void

interface System {
    id: string
    run: SystemFunc
    context: HooksContext
}

export interface World {
    addEntity: (initialComponents: Component[], ...initialTags: string[]) => EntityId
    getEntity: (id: EntityId) => Entity | undefined
    removeEntity: (id: EntityId) => boolean

    addSystem: (group: string, id: string, system: SystemFunc) => void
    removeSystem: (group: string, id: string) => void
    run: (group: string) => void
}

export interface WorldSystem extends World {
    useState: <T>(intialValue: T) => UseStateResult<T>
    useEffect: (callback: () => void, dependencies: any[]) => void
    useQuery: (...componentType: string[]) => Entity[]
}

export interface Position2D extends Component, Vector2D {
    type: "position"
}

export interface Physics2D {
    type: "physics"
    velocity: Vector2D
    acceleration: Vector2D
    maxVelocity: Vector2D
}

export interface Collision {
    collider: Entity
    delta: Vector2D
    normal: Vector2D
}
export interface Collisions {
    type: "collisions"
    collisions: Collision[]
}

class WorldClass implements WorldSystem {
    entities: Map<EntityId, EntityClass>
    systems: Map<string, System[]>
    queries: Map<string, Query>

    currentSystem?: System

    constructor() {
        this.entities = new Map()
        this.systems = new Map()
        this.queries = new Map()

        this.currentSystem = undefined

        this.handleUpdated = this.handleUpdated.bind(this)
    }

    private handleUpdated(entity: EntityClass) {
        for (const query of this.queries.values()) {
            query.updated(entity)
        }
    }

    addEntity(initialComponents: Component[], ...tags: string[]) {
        const entity = new EntityClass(initialComponents, tags, this.handleUpdated)

        for (const query of this.queries.values()) {
            query.added(entity)
        }

        this.entities.set(entity.id, entity)
        return entity.id
    }

    getEntity(id: EntityId) {
        const entity = this.entities.get(id)
        if (entity === undefined) {
            console.warn(`Entity with id ${id} not found [return undefined]`)
        }
        return entity
    }

    removeEntity(id: EntityId) {
        const entity = this.entities.get(id)
        if (entity === undefined) {
            console.warn(`Entity with id ${id} not found [not removing]`)
            return false
        }

        for (const query of this.queries.values()) {
            query.removed(entity)
        }

        this.entities.delete(id)
        return true
    }

    addSystem(group: string, id: string, system: SystemFunc) {
        let g = this.systems.get(group)
        if (!g) {
            g = []
            this.systems.set(group, g)
        }
        g.push({
            id,
            run: system,
            context: createContext()
        })
    }

    removeSystem(group: string, id: string) {
        let g = this.systems.get(group)
        if (g) {
            const index = g.findIndex(s => s.id === id)
            const system = g[index]
            retire(system.context)
            g.splice(index, 1)
        }
    }

    run(group: string) {
        const g = this.systems.get(group)
        if (!g) return
        for (const system of g) {
            // Initialize current system and reset context before running each system
            this.currentSystem = system
            reset(this.context)

            system.run(this)
        }
    }

    useState<T>(initialValue: T): UseStateResult<T>;
    useState<T = undefined>(): UseStateResult<T | undefined>;
    useState<T>(initialValue?: T): UseStateResult<T> {
        return useState(this.context, initialValue)
    }

    useEffect(callback: () => CleanupFunc | void, dependencies?: any[]) {
        useEffect(this.context, callback, dependencies)
    }

    useMemo<T extends (...args: any[]) => any>(factory: T, dependencies: Parameters<T>): ReturnType<T> {
        return useMemo(this.context, factory, dependencies)
    }

    useQuery(...componentTypesOrTags: string[]) {
        let [query, setQuery] = this.useState<Query>()

        this.useEffect(() => {
            const key = makeKey(componentTypesOrTags)

            query = this.queries.get(key)
            if (query) {
                query.register()
            } else {
                query = new Query(componentTypesOrTags, this.entities.values())
                this.queries.set(key, query)
            }

            // Remember query for when useEffect is skipped
            setQuery(query)

            // Cleanup registration when no longer in use
            return () => {
                if (query!.unregister()) {
                    this.queries.delete(key)
                }
            }
        }, componentTypesOrTags)

        return query!.matches
    }

    get context() {
        if (this.currentSystem) {
            return this.currentSystem.context
        }

        throw new Error("Cannot call hooks outside run context")
    }
}

export const createWorld = (): World => {
    return new WorldClass()
}

export const physicsSystem = (world: WorldSystem) => {
    const entities = world.useQuery("position", "physics", "collisions")

    for (const entity of entities) {
        const pos = entity.components.getOne("position") as Position2D
        const move = entity.components.getOne("physics") as Physics2D
        const coll = entity.components.getOne("collisions") as Collisions

        physics(pos, move, coll)
    }
}

export const physics = (pos: Position2D, move: Physics2D, coll: Collisions) => {
    const { x, y } = pos
    const { x: vx, y: vy } = move.velocity
    const { x: ax, y: ay } = move.acceleration

    // Calculate new velocity
    move.velocity.x = Math.min(vx + ax, move.maxVelocity.x)
    move.velocity.y = Math.min(vy + ay, move.maxVelocity.y)

    // Calculate new position
    pos.x = x + vx
    pos.y = y + vy
}
