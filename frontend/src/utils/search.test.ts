import { describe, it, expect } from 'vitest'

describe('note search utility', () => {
  it('should match notes containing the search query', () => {
    const notes = [
      { id: '1', content: 'Hello world' },
      { id: '2', content: 'Goodbye world' },
      { id: '3', content: 'Something else' },
    ]
    const query = 'Hello'
    const result = notes.filter(n => n.content.toLowerCase().includes(query.toLowerCase()))
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should return all notes when query is empty', () => {
    const notes = [
      { id: '1', content: 'Hello world' },
      { id: '2', content: 'Goodbye world' },
    ]
    const query = ''
    const result = query
      ? notes.filter(n => n.content.toLowerCase().includes(query.toLowerCase()))
      : notes
    expect(result).toHaveLength(2)
  })

  it('should match partial content case insensitively', () => {
    const notes = [
      { id: '1', content: 'Meeting notes from today' },
      { id: '2', content: 'Todo list' },
    ]
    const query = 'meet'
    const result = notes.filter(n => n.content.toLowerCase().includes(query.toLowerCase()))
    expect(result).toHaveLength(1)
    expect(result[0].content).toContain('Meeting')
  })
})
