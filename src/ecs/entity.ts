let nextId = 0

export const entity = () => nextId++

export type EntityId = number

export interface Component {
    type: string
}

export interface Entity {
    hasTag(tag: string): boolean
    allTags(): string[]
    addTag(tag: string): void
    removeTag(tag: string): void

    readonly components: Components
}

export interface Components {
    has(componentType: string): boolean
    
    all(): Component[]
    getOne(componentType: string): Component | undefined
    getAll(componentType: string): Component[]

    addOne(component: Component): void
    addAll(components: Component[]): void
    
    removeOne(componentType: string): void
    removeAll(componentType: string): void
}

export type ChangeHandler = (entity: EntityClass) => void

export class EntityClass implements Entity, Components {
    readonly id: EntityId
    private ownComponents: Component[]
    private tags: string[]

    private onChange: ChangeHandler

    constructor(components: Component[], tags: string[], onChange: ChangeHandler) {
        this.id = nextId++
        this.ownComponents = components
        this.tags = tags

        this.onChange = onChange
    }

    get components() {
        return this
    }

    hasTag(tag: string) {
        return this.tags.some(t => t === tag)
    }

    allTags() {
        return [...this.tags]
    }

    addTag(tag: string) {
        if (this.hasTag(tag)) {
            console.warn(`Entity with id ${this.id} already has tag ${tag} [ignore add]`)
            return
        }

        this.tags.push(tag)
        this.onChange(this)
    }

    removeTag(tag: string) {
        const index = this.tags.findIndex(t => t === tag)
        this.tags.splice(index, 1)
        this.onChange(this)
    }

    has(componentType: string) {
        return this.ownComponents.some(c => c.type === componentType)
    }

    all() {
        return [...this.ownComponents]
    }

    getOne(componentType: string) {
        return this.ownComponents.find(c => c.type === componentType)
    }

    getAll(componentType: string) {
        return this.ownComponents.filter(c => c.type === componentType)
    }

    addOne(component: Component) {
        this.ownComponents.push(component)
        this.onChange(this)
    }

    addAll(components: Component[]) {
        this.ownComponents.concat(components)
        this.onChange(this)
    }

    removeOne(componentType: string) {
        const index = this.ownComponents.findIndex(c => c.type === componentType)
        this.ownComponents.splice(index, 1)
        this.onChange(this)
    }

    removeAll(componentType: string) {
        this.ownComponents = this.ownComponents.filter(c => c.type !== componentType)
        this.onChange(this)
    }

    matches(query: Iterable<string>) {
        const componentTypesOrTags = new Set(this.ownComponents.map(c => c.type))
        this.tags.forEach(t => componentTypesOrTags.add(t))

        for (const requirement of query) {
            if (!componentTypesOrTags.has(requirement)) return false
        }

        return true
    }
}
