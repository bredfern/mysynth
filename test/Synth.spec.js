import { mount } from '@vue/test-utils'
import Synth from '@/components/Synth.vue'

describe('Synth', () => {
  test('is a Vue instance', () => {
    const wrapper = mount(Synth)
    expect(wrapper.isVueInstance()).toBeTruthy()
  })
})
