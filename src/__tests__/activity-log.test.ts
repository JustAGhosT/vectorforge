import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useActivityLog } from '../hooks/use-activity-log'

describe('useActivityLog', () => {
  it('should add an entry and return an id', () => {
    const { result } = renderHook(() => useActivityLog())
    
    let entryId: string
    act(() => {
      entryId = result.current.addEntry({
        title: 'Test Entry',
        description: 'Test description',
        type: 'upload',
        status: 'pending',
      })
    })

    expect(entryId!).toBeDefined()
    expect(result.current.entries.length).toBe(1)
    expect(result.current.entries[0].title).toBe('Test Entry')
    expect(result.current.entries[0].status).toBe('pending')
  })

  it('should update an existing entry by id', () => {
    const { result } = renderHook(() => useActivityLog())
    
    let entryId: string
    act(() => {
      entryId = result.current.addEntry({
        title: 'Processing',
        description: 'Starting conversion...',
        type: 'conversion',
        status: 'pending',
      })
    })

    expect(result.current.entries[0].status).toBe('pending')

    act(() => {
      result.current.updateEntry(entryId!, {
        title: 'Complete',
        description: 'Conversion finished',
        status: 'success',
      })
    })

    expect(result.current.entries.length).toBe(1)
    expect(result.current.entries[0].title).toBe('Complete')
    expect(result.current.entries[0].description).toBe('Conversion finished')
    expect(result.current.entries[0].status).toBe('success')
  })

  it('should update pending entry to error status', () => {
    const { result } = renderHook(() => useActivityLog())
    
    let entryId: string
    act(() => {
      entryId = result.current.addEntry({
        title: 'AI Analysis started',
        description: 'Analyzing...',
        type: 'ai-analysis',
        status: 'pending',
      })
    })

    act(() => {
      result.current.updateEntry(entryId!, {
        title: 'AI Analysis failed',
        description: 'Connection error',
        status: 'error',
        details: { error: 'Network timeout' },
      })
    })

    expect(result.current.entries[0].status).toBe('error')
    expect(result.current.entries[0].title).toBe('AI Analysis failed')
    expect(result.current.entries[0].details).toEqual({ error: 'Network timeout' })
  })

  it('should preserve timestamp when updating entry', () => {
    const { result } = renderHook(() => useActivityLog())
    
    let entryId: string
    act(() => {
      entryId = result.current.addEntry({
        title: 'Test',
        description: 'Test',
        type: 'upload',
        status: 'pending',
      })
    })

    const originalTimestamp = result.current.entries[0].timestamp

    act(() => {
      result.current.updateEntry(entryId!, {
        status: 'success',
      })
    })

    expect(result.current.entries[0].timestamp).toBe(originalTimestamp)
  })

  it('should clear all entries', () => {
    const { result } = renderHook(() => useActivityLog())
    
    act(() => {
      result.current.addEntry({
        title: 'Entry 1',
        description: 'Test',
        type: 'upload',
      })
      result.current.addEntry({
        title: 'Entry 2',
        description: 'Test',
        type: 'conversion',
      })
    })

    expect(result.current.entries.length).toBe(2)

    act(() => {
      result.current.clearEntries()
    })

    expect(result.current.entries.length).toBe(0)
  })

  it('should add new entries at the beginning', () => {
    const { result } = renderHook(() => useActivityLog())
    
    act(() => {
      result.current.addEntry({
        title: 'First Entry',
        description: 'Added first',
        type: 'upload',
      })
    })

    act(() => {
      result.current.addEntry({
        title: 'Second Entry',
        description: 'Added second',
        type: 'conversion',
      })
    })

    expect(result.current.entries[0].title).toBe('Second Entry')
    expect(result.current.entries[1].title).toBe('First Entry')
  })
})
