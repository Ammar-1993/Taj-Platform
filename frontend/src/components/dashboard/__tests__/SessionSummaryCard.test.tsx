import React from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import { SessionSummaryCard } from '../ai/SessionSummaryCard'
import { SessionSummary } from '@/types'

describe('SessionSummaryCard', () => {
  it('renders pending state while loading or pending', () => {
    render(<SessionSummaryCard summary={null} isLoading={true} />)

    expect(screen.getByText('جاري إعداد الملخص الذكي بواسطة الذكاء الاصطناعي...')).toBeInTheDocument()
  })

  it('renders failed state with retry button', () => {
    const failedSummary: SessionSummary = {
      id: 1,
      status: 'failed',
      content: null,
      key_takeaways: [],
      model_used: null,
      created_at: '2026-10-05T00:00:00Z',
    }

    const onRetryMock = jest.fn()
    render(<SessionSummaryCard summary={failedSummary} onRetry={onRetryMock} />)

    expect(screen.getByText('تعذر توليد الملخص الذكي تلقائياً')).toBeInTheDocument()
    expect(screen.getByText('إعادة المحاولة')).toBeInTheDocument()
  })

  it('renders completed summary content and takeaways', () => {
    const completedSummary: SessionSummary = {
      id: 2,
      status: 'completed',
      content: 'شرح مفصل وممتع لقوانين نيوتن للحركة وتطبيقاتها العملية.',
      key_takeaways: ['القانون الأول: القصور الذاتي', 'القانون الثاني: F=ma', 'القانون الثالث: لكل فعل رد فعل'],
      model_used: 'gpt-4o-mini',
      created_at: '2026-10-05T00:00:00Z',
    }

    render(<SessionSummaryCard summary={completedSummary} />)

    expect(screen.getByText('ملخص الجلسة التعليمية')).toBeInTheDocument()
    expect(screen.getByText('شرح مفصل وممتع لقوانين نيوتن للحركة وتطبيقاتها العملية.')).toBeInTheDocument()
    expect(screen.getByText('القانون الأول: القصور الذاتي')).toBeInTheDocument()
    expect(screen.getByText('القانون الثاني: F=ma')).toBeInTheDocument()
    expect(screen.getByText('القانون الثالث: لكل فعل رد فعل')).toBeInTheDocument()
  })
})
