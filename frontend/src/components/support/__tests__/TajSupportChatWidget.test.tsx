import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TajSupportChatWidget } from '../TajSupportChatWidget'
import { supportService } from '@/services/api/supportService'

// Mock the support service
jest.mock('@/services/api/supportService', () => ({
  supportService: {
    sendMessage: jest.fn(),
    streamMessage: jest.fn(),
  },
}))

describe('TajSupportChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  it('renders the floating action button (FAB)', () => {
    render(<TajSupportChatWidget />)

    expect(screen.getByRole('button', { name: /فتح المساعد الذكي للدعم الفني/i })).toBeInTheDocument()
    expect(screen.getByText('مساعد تاج الذكي')).toBeInTheDocument()
  })

  it('opens chat window on FAB click and displays initial welcome message', () => {
    render(<TajSupportChatWidget />)

    const fab = screen.getByRole('button', { name: /فتح المساعد الذكي للدعم الفني/i })
    fireEvent.click(fab)

    expect(screen.getByText('متصل الآن • جاهز لمساعدتك')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/اكتب سؤالك هنا/i)).toBeInTheDocument()
    expect(screen.getByText(/كيف أبدأ بحجز أول حصة؟/)).toBeInTheDocument()
  })

  it('sends user message and renders AI assistant reply via synchronous fallback', async () => {
    ;(supportService.streamMessage as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    ;(supportService.sendMessage as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      data: {
        reply: 'لحجز أول حصة، يمكنك اختيار المادة والمعلم وتحديد موعد مناسب.',
        needs_human_support: false,
        support_options: null,
        suggested_questions: ['ما هي وسائل الدفع؟'],
      },
    })

    render(<TajSupportChatWidget />)

    // Open chat
    fireEvent.click(screen.getByRole('button', { name: /فتح المساعد الذكي للدعم الفني/i }))

    const input = screen.getByPlaceholderText(/اكتب سؤالك هنا/i)
    fireEvent.change(input, { target: { value: 'كيف أحجز حصة؟' } })

    const sendBtn = screen.getByRole('button', { name: /إرسال السؤال/i })
    fireEvent.click(sendBtn)

    expect(screen.getByText('كيف أحجز حصة؟')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('لحجز أول حصة، يمكنك اختيار المادة والمعلم وتحديد موعد مناسب.')).toBeInTheDocument()
    })
  })

  it('streams assistant response in real-time via streamMessage (SSE)', async () => {
    ;(supportService.streamMessage as jest.Mock).mockImplementationOnce((payload, callbacks) => {
      callbacks.onToken('أهلاً ')
      callbacks.onToken('بك في منصة تاج التعليمية!')
      callbacks.onDone({
        reply: 'أهلاً بك في منصة تاج التعليمية!',
        needs_human_support: false,
        support_options: null,
        suggested_questions: ['كيف أبدأ أول حصة؟'],
      })
      return Promise.resolve()
    })

    render(<TajSupportChatWidget />)

    // Open chat
    fireEvent.click(screen.getByRole('button', { name: /فتح المساعد الذكي للدعم الفني/i }))

    const input = screen.getByPlaceholderText(/اكتب سؤالك هنا/i)
    fireEvent.change(input, { target: { value: 'مرحبا' } })

    const sendBtn = screen.getByRole('button', { name: /إرسال السؤال/i })
    fireEvent.click(sendBtn)

    expect(screen.getByText('مرحبا')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('أهلاً بك في منصة تاج التعليمية!')).toBeInTheDocument()
      expect(screen.getByText(/كيف أبدأ أول حصة؟/)).toBeInTheDocument()
    })
  })

  it('displays both WhatsApp (+967774344625) and support ticket options when human assistance is needed', async () => {
    ;(supportService.streamMessage as jest.Mock).mockImplementationOnce((payload, callbacks) => {
      callbacks.onToken('نأسف لحدوث هذا الأمر. يرجى التواصل مع فريق الدعم للمتابعة.')
      callbacks.onDone({
        reply: 'نأسف لحدوث هذا الأمر. يرجى التواصل مع فريق الدعم للمتابعة.',
        needs_human_support: true,
        support_options: {
          whatsapp: {
            phone: '+967774344625',
            link: 'https://wa.me/967774344625?text=test',
            label: 'التحدث مع موظف الدعم عبر واتساب (+967774344625)',
          },
          ticket: {
            link: '/dashboard/support',
            label: 'فتح تذكرة دعم فني',
          },
        },
        suggested_questions: [],
      })
      return Promise.resolve()
    })

    render(<TajSupportChatWidget />)

    // Open chat
    fireEvent.click(screen.getByRole('button', { name: /فتح المساعد الذكي للدعم الفني/i }))

    const input = screen.getByPlaceholderText(/اكتب سؤالك هنا/i)
    fireEvent.change(input, { target: { value: 'أريد رفع شكوى رسمية واسترداد نقدي معقد' } })

    const sendBtn = screen.getByRole('button', { name: /إرسال السؤال/i })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      // 1. WhatsApp Button & Phone
      expect(screen.getByText('التحدث مع الدعم عبر واتساب')).toBeInTheDocument()
      expect(screen.getByText('+967774344625')).toBeInTheDocument()

      // 2. Ticket Option
      expect(screen.getByText('فتح تذكرة دعم فني')).toBeInTheDocument()
    })
  })
})

