import { Fragment } from 'vue'

export function renderSlotFragments(children) {
  if (!children) return []
  return children.flatMap(child => {
    if (child.type === Fragment) return renderSlotFragments(child.children)

    return [child]
  })
}
