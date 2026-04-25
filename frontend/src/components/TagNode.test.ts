import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TagNode from './TagNode.vue'
import type { Tag } from '../types'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('TagNode', () => {
  it('should render tag name correctly', () => {
    const tag: Tag = { id: '1', name: 'project', parent_id: null }
    const wrapper = mount(TagNode, {
      props: { tag }
    })
    expect(wrapper.find('.tag-name').text()).toBe('#project')
  })

  it('should not show toggle when tag has no children', () => {
    const tag: Tag = { id: '1', name: 'project', parent_id: null }
    const wrapper = mount(TagNode, {
      props: { tag }
    })
    expect(wrapper.find('.toggle').exists()).toBe(false)
  })

  it('should show toggle when tag has children', () => {
    const tag: Tag = {
      id: '1',
      name: 'project',
      parent_id: null,
      children: [
        { id: '2', name: 'projectA', parent_id: '1' }
      ]
    }
    const wrapper = mount(TagNode, {
      props: { tag }
    })
    expect(wrapper.find('.toggle').exists()).toBe(true)
    expect(wrapper.find('.toggle').text()).toBe('▶')
  })

  it('should expand children when toggle clicked', async () => {
    const tag: Tag = {
      id: '1',
      name: 'project',
      parent_id: null,
      children: [
        { id: '2', name: 'projectA', parent_id: '1' }
      ]
    }
    const wrapper = mount(TagNode, {
      props: { tag }
    })
    await wrapper.find('.toggle').trigger('click')
    expect(wrapper.find('.toggle').text()).toBe('▼')
    expect(wrapper.findAllComponents(TagNode)).toHaveLength(1)
  })

  it('should collapse children when toggle clicked again', async () => {
    const tag: Tag = {
      id: '1',
      name: 'project',
      parent_id: null,
      children: [
        { id: '2', name: 'projectA', parent_id: '1' }
      ]
    }
    const wrapper = mount(TagNode, {
      props: { tag }
    })
    await wrapper.find('.toggle').trigger('click')
    await wrapper.find('.toggle').trigger('click')
    expect(wrapper.find('.toggle').text()).toBe('▶')
    expect(wrapper.findAllComponents(TagNode)).toHaveLength(0)
  })

  it('should emit tag-click when tag row clicked', async () => {
    const tag: Tag = { id: '1', name: 'project', parent_id: null }
    const wrapper = mount(TagNode, {
      props: { tag }
    })
    await wrapper.find('.tag-row').trigger('click')
    expect(wrapper.emitted('tag-click')).toBeTruthy()
    expect(wrapper.emitted('tag-click')![0]).toEqual([tag])
  })

  it('should render nested children recursively (3 levels)', () => {
    const tag: Tag = {
      id: '1',
      name: 'project',
      parent_id: null,
      children: [
        {
          id: '2',
          name: 'projectA',
          parent_id: '1',
          children: [
            { id: '3', name: 'item1', parent_id: '2' }
          ]
        }
      ]
    }
    const wrapper = mount(TagNode, {
      props: { tag }
    })
    // Initially collapsed, expand to see children
    expect(wrapper.find('.toggle').text()).toBe('▶')
  })

  it('should render deeply nested children when expanded (3+ levels)', async () => {
    const tag: Tag = {
      id: '1',
      name: 'project',
      parent_id: null,
      children: [
        {
          id: '2',
          name: 'projectA',
          parent_id: '1',
          children: [
            { id: '3', name: 'item1', parent_id: '2' }
          ]
        }
      ]
    }
    const wrapper = mount(TagNode, {
      props: { tag }
    })
    // Expand first level
    await wrapper.find('.toggle').trigger('click')
    expect(wrapper.findAllComponents(TagNode)).toHaveLength(1)

    // The child TagNode should also have a toggle for its children
    const childNode = wrapper.findAllComponents(TagNode)[0]
    expect(childNode.find('.toggle').text()).toBe('▶')

    // Expand second level
    await childNode.find('.toggle').trigger('click')
    expect(childNode.findAllComponents(TagNode)).toHaveLength(1)

    // The grandchild TagNode should not have a toggle (no children)
    const grandchildNode = childNode.findAllComponents(TagNode)[0]
    expect(grandchildNode.find('.toggle').exists()).toBe(false)
    expect(grandchildNode.find('.tag-name').text()).toBe('#item1')
  })
})
