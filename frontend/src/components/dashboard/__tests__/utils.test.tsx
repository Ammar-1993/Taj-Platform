import { render, screen } from '@testing-library/react'
import { getStatusBadge } from '../utils'

describe('getStatusBadge', () => {
  it('renders scheduled status badge', () => {
    render(getStatusBadge('scheduled'))

    const badge = screen.getByText('مجدول')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
  })

  it('renders in_progress status badge with animation', () => {
    render(getStatusBadge('in_progress'))

    const badge = screen.getByText('جارية الآن')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-700', 'animate-pulse')
  })

  it('renders completed status badge', () => {
    render(getStatusBadge('completed'))

    const badge = screen.getByText('مكتمل')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-emerald-100', 'text-emerald-700')
  })

  it('renders cancelled status badge', () => {
    render(getStatusBadge('cancelled'))

    const badge = screen.getByText('ملغي')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100', 'text-red-700')
  })

  it('renders refunded status badge', () => {
    render(getStatusBadge('refunded'))

    const badge = screen.getByText('مسترجع')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-700')
  })

  it('renders unknown status badge with default styling', () => {
    render(getStatusBadge('unknown'))

    const badge = screen.getByText('unknown')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
  })

  it('includes status indicator dot for all statuses', () => {
    const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'refunded', 'unknown']

    statuses.forEach(status => {
      const { container } = render(getStatusBadge(status))
      const dot = container.querySelector('span.w-1\\.5.h-1\\.5')
      expect(dot).toBeInTheDocument()
    })
  })
})