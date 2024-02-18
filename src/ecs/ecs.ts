import { partition } from "../lib/util"
import { Component, Entity, EntityClass, EntityId, eq as entityEq } from "./entity"
import { Query, makeKey } from "./query"
import { CleanupFunc, HooksContext, UseStateResult, retire, reset, useEffect, useMemo, useState, createContext, Reference, useRef } from "./hooks"

export type SystemFunc<TContext> = (world: WorldSystem<TContext>) => void

interface System<TContext> {
    id: string
    run: SystemFunc<TContext>
    context: HooksContext
}

export interface DeltaCollection<T> {
    enter: T[]
    still: T[]
    exit: T[]
}

export interface World<TContext = void> {
    addEntity: (initialComponents: Component[], ...initialTags: string[]) => EntityId
    loadEntity: (id: EntityId, components: Component[], tags: string[]) => void
    getEntity: (id: EntityId) => Entity | undefined
    removeEntity: (id: EntityId) => boolean

    addSystem: (group: string, id: string, system: SystemFunc<TContext>) => void
    removeSystem: (group: string, id: string) => void
    run: (group: string) => void

    readonly context: TContext
}

export interface WorldSystem<TContext> extends World<TContext> {
    useState<T>(initialValue: T): UseStateResult<T>;
    useState<T = undefined>(): UseStateResult<T | undefined>;
    useState<T>(intialValue?: T): UseStateResult<T | undefined>
    
    useRef<T>(initialValue: T): Reference<T>;
    useRef<T = undefined>(): Reference<T | undefined>;
    useRef<T>(initialValue?: T): Reference<T | undefined>
    
    useEffect: (callback: () => void, dependencies: any[]) => void
    useQuery: (...componentTypesOrTags: string[]) => Entity[]
    useDeltaQuery: (...componentTypesOrTags: string[]) => DeltaCollection<Entity>
}

class WorldClass<TContext> implements WorldSystem<TContext> {
    entities: Map<EntityId, EntityClass>
    systems: Map<string, System<TContext>[]>
    queries: Map<string, Query>

    worldContext: TContext
    currentSystem?: System<TContext>

    constructor(context?: TContext) {
        this.entities = new Map()
        this.systems = new Map()
        this.queries = new Map()

        if (typeof context !== "undefined") this.worldContext = context
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

    loadEntity(id: EntityId, components: Component[], tags: string[]) {
        const entity = new EntityClass(components, tags, this.handleUpdated, id)

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

    addSystem(group: string, id: string, system: SystemFunc<TContext>) {
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
            reset(this.systemContext)

            system.run(this)
        }
    }

    useState<T>(initialValue: T): UseStateResult<T>;
    useState<T = undefined>(): UseStateResult<T | undefined>;
    useState<T>(initialValue?: T): UseStateResult<T | undefined> {
        return useState(this.systemContext, initialValue)
    }

//    useRef<T>(initialValue: T): Reference<T>;
//    useRef<T = undefined>(): Reference<T | undefined>;
    useRef<T>(initialValue?: T): Reference<T | undefined> {
        return useRef(this.systemContext, initialValue)
    }

    useEffect(callback: () => CleanupFunc | void, dependencies?: any[]) {
        useEffect(this.systemContext, callback, dependencies)
    }

    useMemo<T extends (...args: any[]) => any>(factory: T, dependencies: Parameters<T>): ReturnType<T> {
        return useMemo(this.systemContext, factory, dependencies)
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

    useDeltaQuery(...componentTypesOrTags: string[]) {
        let [query, setQuery] = this.useState<Query>()
        const [prevMatches, setPrevMatches] = this.useState<Entity[]>([])

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

        const matches = query!.matches
        const [enter, still, exit] = partition(matches, prevMatches, entityEq)
        setPrevMatches(matches)
        
        return { enter, still, exit }
    }

    get context() {
        return this.worldContext
    }
    get systemContext() {
        if (this.currentSystem) {
            return this.currentSystem.context
        }

        throw new Error("Cannot call hooks outside run context")
    }
}

export function createWorld(): World<void>
export function createWorld<TContext>(context: TContext): World<TContext>
export function createWorld<TContext = void>(context?: TContext): World<TContext> {
    return new WorldClass(context)
}
