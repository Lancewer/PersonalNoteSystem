import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MobileTopNav from './MobileTopNav.vue'

describe('MobileTopNav', () => {
  it('should render hamburger menu button', () => {
    const wrapper = mount(MobileTopNav)
    expect(wrapper.find('[aria-label="打开菜单"]').exists()).toBe(true)
  })

  it('should render brand title', () => {
    const wrapper = mount(MobileTopNav)
    expect(wrapper.find('.brand-title').text()).toBe('笔记')
  })

  it('should render search button', () => {
    const wrapper = mount(MobileTopNav)
    expect(wrapper.find('[aria-label="搜索笔记"]').exists()).toBe(true)
  })

  it('should emit menu-toggle when hamburger clicked', async () => {
    const wrapper = mount(MobileTopNav)
    await wrapper.find('[aria-label="打开菜单"]').trigger('click')
    expect(wrapper.emitted('menu-toggle')).toBeTruthy()
  })

  it('should emit search-open when search clicked', async () => {
    const wrapper = mount(MobileTopNav)
    await wrapper.find('[aria-label="搜索笔记"]').trigger('click')
    expect(wrapper.emitted('search-open')).toBeTruthy()
  })
})
