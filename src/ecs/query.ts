import { EntityClass } from "./entity"

export class Query {
    private componentTypesOrTags: string[]
    private entities: EntityClass[]
    private refCount: number

    constructor(componentTypesOrTags: string[], allEntities: Iterable<EntityClass>) {
        this.componentTypesOrTags = componentTypesOrTags
        this.entities = []
        this.refCount = 1

        for (const entity of allEntities) {
            if (entity.matches(componentTypesOrTags)) {
                this.entities.push(entity)
            }
        }
    }

    get matches() {
        return this.entities
    }

    added(entity: EntityClass) {
        const matches = entity.matches(this.componentTypesOrTags)

        if (matches) {
            this.entities.push(entity)
        }
    }

    updated(entity: EntityClass) {
        const index = this.entities.findIndex(e => e.id === entity.id)
        const matches = entity.matches(this.componentTypesOrTags)

        if (matches && index < 0) {
            this.entities.push(entity)
        } else if (!matches && index >= 0) {
            this.entities.splice(index, 1)
        }
    }

    removed(entity: EntityClass) {
        const index = this.entities.findIndex(e => e.id === entity.id)

        if (index >= 0) {
            this.entities.splice(index, 1)
        }
    }

    register() {
        this.refCount++
    }

    unregister() {
        this.refCount--
        return this.refCount <= 0
    }
}

export const makeKey = (componentTypesOrTags: string[]) => componentTypesOrTags.sort().join(",")
