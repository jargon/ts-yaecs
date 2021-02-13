import "mocha"
import { expect } from "chai"
import { createWorld } from "../src/ecs/ecs"

describe("ecs.ts", () => {
    describe("#createWorld", () => {
        it("it should return a world", () => {
            expect(createWorld()).to.not.be.undefined.and.not.be.null
        })
    })
    describe("#addEntity", () => {
        describe("when adding entity to a world", () => {
            it("that world should contain an entity with returned id", () => {
                const world = createWorld()
                const id = world.addEntity([])
                const entity = world.getEntity(id)
                expect(entity).to.not.be.undefined
            })
        })
        describe("when adding entity with a tag to a world", () => {
            it("that world should contain an entity with that tag", () => {
                const world = createWorld()
                const id = world.addEntity([], "mytag")
                const entity = world.getEntity(id)
                expect(entity).is.not.undefined
                expect(entity?.hasTag("mytag")).to.be.true
            })
        })
        describe("when adding entity with multiple tags to a world", () => {
            it("that world should contain an entity with those tags", () => {
                const world = createWorld()
                const id = world.addEntity([], "tag1", "tag2", "tag3")
                const entity = world.getEntity(id)
                expect(entity).is.not.undefined
                expect(entity?.allTags()).to.have.members(["tag1", "tag2", "tag3"])
            })
        })
        describe("when adding entity with a component to a world", () => {
            it("that world should contain an entity with that component type", () => {
                const world = createWorld()
                const id = world.addEntity([{ type: "mycomponent" }])
                const entity = world.getEntity(id)
                expect(entity).is.not.undefined
                expect(entity?.components.has("mycomponent")).to.be.true
            })
        })
        describe("when adding entity with multiple components to a world", () => {
            it("that world should contain an entity with those component types", () => {
                const world = createWorld()
                const id = world.addEntity([{ type: "comp1" }, { type: "comp2" }, { type: "comp3" }])
                const entity = world.getEntity(id)
                expect(entity).to.not.be.undefined
                expect(entity?.components.all().map(c => c.type)).to.have.members(["comp1", "comp2", "comp3"])
            })
        })
    })
})
