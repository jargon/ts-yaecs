export interface Component {
    type: string
}

export const component = (type: string, props: object) => Object.assign({ type }, props)
