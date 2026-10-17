import { render, screen } from '@testing-library/react'
import StatusBadge from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('renders scheduled status badge', () => {
    render(<StatusBadge status="scheduled" />)

    const badge = screen.getByText('مجدول')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
  })

  it('renders in_progress status badge with animation', () => {
    render(<StatusBadge status="in_progress" />)

    const badge = screen.getByText('جارية الآن')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-700', 'animate-subtle-pulse')
  })

  it('renders completed status badge', () => {
    render(<StatusBadge status="completed" />)

    const badge = screen.getByText('مكتمل')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-emerald-100', 'text-emerald-700')
  })

  it('renders cancelled status badge', () => {
    render(<StatusBadge status="cancelled" />)

    const badge = screen.getByText('ملغي')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100', 'text-red-700')
  })

  it('renders refunded status badge', () => {
    render(<StatusBadge status="refunded" />)

    const badge = screen.getByText('مسترجع')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-700')
  })

  it('renders abandoned status badge', () => {
    render(<StatusBadge status="abandoned" />)

    const badge = screen.getByText('مهجورة')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-slate-100', 'text-slate-700')
  })

  it('renders unknown status badge with default styling', () => {
    render(<StatusBadge status="unknown" />)

    const badge = screen.getByText('unknown')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
  })

  it('includes status indicator dot or icon for all statuses', () => {
    const dotStatuses = ['scheduled', 'in_progress', 'cancelled', 'refunded', 'abandoned', 'unknown']

    dotStatuses.forEach(status => {
      const { container } = render(<StatusBadge status={status} />)
      const dot = container.querySelector('span.w-1\\.5.h-1\\.5')
      expect(dot).toBeInTheDocument()
    })

    const { container: completedContainer } = render(<StatusBadge status="completed" />)
    expect(completedContainer.querySelector('svg')).toBeInTheDocument()
  })
})