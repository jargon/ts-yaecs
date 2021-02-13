import { AABB, Shape } from "./geometry"

const DEFAULT_MAX_OBJECTS = 10
const DEFAULT_MAX_LEVELS = 5

enum Quadrant {
    TopLeft = 0,
    TopRight = 1,
    BottomLeft = 2,
    BottomRight = 3
}

export interface Config {
    readonly maxObjects?: number
    readonly maxLevels?: number
}

interface QuadBase {
    readonly level: number
    readonly bounds: AABB
    readonly shapes: Shape[]
}

interface QuadBranch extends QuadBase {
    readonly leaf: false
    readonly children: QuadNode[]
}

interface QuadLeaf extends QuadBase {
    readonly leaf: true
}

export type QuadNode = QuadBranch | QuadLeaf

export interface QuadTree {
    readonly config: Config
    readonly root: QuadNode
}

const quadrant = (shape: Shape, bounds: AABB): Quadrant | undefined => {
    const midX = bounds.min.x + (bounds.max.x - bounds.min.x)*0.5
    const midY = bounds.min.y + (bounds.max.y - bounds.min.y)*0.5

    const top = shape.bounds.max.y < midY
    const bottom = shape.bounds.min.y > midY
    const left = shape.bounds.max.x < midX
    const right = shape.bounds.min.x > midX

    if (left) {
        if (top) return Quadrant.TopLeft
        else if (bottom) return Quadrant.BottomLeft
    } else if (right) {
        if (top) return Quadrant.TopRight
        else if (bottom) return Quadrant.BottomRight
    }

    return undefined
}

const createLeaf = (level: number, bounds: AABB): QuadLeaf => ({
    leaf: true,
    level,
    bounds,
    shapes: []
})

const split = (level: number, bounds: AABB): QuadLeaf[] => {
    const midX = bounds.min.x + (bounds.max.x - bounds.min.x)*0.5
    const midY = bounds.min.y + (bounds.max.y - bounds.min.y)*0.5
    
    const topLeftBounds: AABB = {
        min: { x: bounds.min.x, y: bounds.min.y + midY },
        max: { x: bounds.min.x + midX, y: bounds.max.y }
    }

    const topRightBounds: AABB = {
        min: { x: bounds.min.x + midX, y: bounds.min.y + midY },
        max: { x: bounds.max.x, y: bounds.max.y }
    }

    const bottomLeftBounds: AABB = {
        min: { x: bounds.min.x, y: bounds.min.y },
        max: { x: bounds.min.x + midX, y: bounds.min.y + midY }
    }

    const bottomRightBounds: AABB = {
        min: { x: bounds.min.x + midX, y: bounds.min.y },
        max: { x: bounds.max.x, y: bounds.min.y + midY }
    }

    const result = []
    result[Quadrant.TopLeft] = createLeaf(level, topLeftBounds)
    result[Quadrant.TopRight] = createLeaf(level, topRightBounds)
    result[Quadrant.BottomLeft] = createLeaf(level, bottomLeftBounds)
    result[Quadrant.BottomRight] = createLeaf(level, bottomRightBounds)
    return result
}

const insertInNode = (shape: Shape, node: QuadNode, config: Config): QuadNode => {
    const { level, bounds, shapes } = node
    const { maxObjects = DEFAULT_MAX_OBJECTS, maxLevels = DEFAULT_MAX_LEVELS } = config

    // Compiler does not discriminate the union without explicitly comparing to true / false?!?
    if (node.leaf === true) {
        shapes.push(shape)

        if (shapes.length > maxObjects && level < maxLevels) {
            const nextLevel = level + 1

            const splitNode: QuadBranch = {
                ...node,
                leaf: false,
                shapes: [],
                children: split(nextLevel, bounds)
            }

            for (const shape of shapes) {
                insertInNode(shape, splitNode, config)
            }

            return splitNode
        }
    } else {
        const quad = quadrant(shape, bounds)

        if (quad === undefined) {
            // Shape does not fit inside a quadrant
            shapes.push(shape)
        } else {
            // Recursively call insert on child node and update child node in case it was split
            node.children[quad] = insertInNode(shape, node.children[quad], config)
        }
    }

    return node
}

const retrieveFromNode = (shape: Shape, node: QuadNode, config: Config): Shape[] => {
    const quad = quadrant(shape, node.bounds)
    let collisions: Shape[] = []

    if (quad !== undefined && node.leaf === false) {
        collisions = retrieveFromNode(shape, node.children[quad], config)
    }

    return collisions.concat(node.shapes)
}

export const create = (bounds: AABB, config?: Config): QuadTree => ({ config: config || {}, root: createLeaf(1, bounds) })
export const insert = (tree: QuadTree, shape: Shape) => insertInNode(shape, tree.root, tree.config)
export const insertCurried = (tree: QuadTree) => (shape: Shape) => insertInNode(shape, tree.root, tree.config)
export const retrieve = (tree: QuadTree, shape: Shape) => retrieveFromNode(shape, tree.root, tree.config)
export const retrieveCurried = (tree: QuadTree) => (shape: Shape) => retrieveFromNode(shape, tree.root, tree.config)
