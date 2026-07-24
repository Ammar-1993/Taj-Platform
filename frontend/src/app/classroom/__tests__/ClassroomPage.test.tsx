import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClassroomPage from '../[id]/page';
import { useAuth } from '@/context/AuthContext';
import { bookingService } from '@/services/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Query Client Setup ───────────────────────────────────────────────────────

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  );
};

// ─── Mock Dependencies ────────────────────────────────────────────────────────

// Capture the router mock so individual tests can assert on it
const mockRouterReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  bookingService: {
    getClassroomAccess: jest.fn(),
    getWhiteboardStatus: jest.fn(),
    refreshClassroomToken: jest.fn(),
    refreshWhiteboardToken: jest.fn(),
    sendHeartbeat: jest.fn().mockResolvedValue({}),
    complete: jest.fn().mockResolvedValue({}),
  },
}));

// تجنّب تحميل Agora/Whiteboard SDK الفعلي في بيئة الاختبار
jest.mock('@/components/classroom/AgoraCall', () => {
  return function MockAgoraCall() {
    return <div data-testid="agora-call-mock" />;
  };
});
jest.mock('@/components/classroom/Whiteboard', () => {
  return function MockWhiteboard() {
    return <div data-testid="whiteboard-mock" />;
  };
});
jest.mock('@/components/classroom/LobbyPreview', () => {
  return function MockLobbyPreview({ onJoinClass }: { onJoinClass: () => void }) {
    return (
      <div data-testid="lobby-preview">
        <span>هل أنت مستعد</span>
        <button onClick={onJoinClass}>دخول</button>
      </div>
    );
  };
});
jest.mock('@/components/classroom/FloatingVideoWidget', () => {
  return function MockFloatingVideoWidget({ children }: { children: React.ReactNode }) {
    return <div data-testid="floating-video-widget">{children}</div>;
  };
});
jest.mock('@/components/ui/ConfirmDialog', () => {
  return function MockConfirmDialog() {
    return null;
  };
});
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

// ─── Test Data ────────────────────────────────────────────────────────────────

const STUDENT_USER = {
  id: 1,
  name: 'طالب تجريبي',
  roles: [{ name: 'student' }],
};

const TEACHER_USER = {
  id: 2,
  name: 'معلم تجريبي',
  roles: [{ name: 'teacher' }],
};

const CLASSROOM_ACCESS_SUCCESS = {
  data: {
    channel_name: 'test_channel_abc',
    uid: 1,
    role: 'host' as const,
    token: 'agora-token-xyz',
    screen_token: null,
    whiteboard: {
      room_uuid: 'whiteboard-room-uuid-001',
      room_token: 'whiteboard-room-token-001',
    },
  },
};

const CLASSROOM_ACCESS_PENDING_WHITEBOARD = {
  data: {
    channel_name: 'test_channel_abc',
    uid: 1,
    role: 'host' as const,
    token: 'agora-token-xyz',
    screen_token: null,
    whiteboard: null, // السبورة في طور التهيئة
  },
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ClassroomPage', () => {
  // إعادة تعيين الـ mocks بعد كل اختبار
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    // Mock navigator.mediaDevices to reject with NotAllowedError to auto-join
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockImplementation(() => {
          const err = new Error('Not allowed');
          err.name = 'NotAllowedError';
          return Promise.reject(err);
        }),
      },
      writable: true,
      configurable: true,
    });
  });

  // ─── 1. Loading State Tests ────────────────────────────────────────────────

  describe('حالة التحميل (Loading State)', () => {
    it('يجب أن تعرض شاشة التحميل أثناء انتظار بيانات المصادقة', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true, // Auth لا تزال قيد التحميل
      });
      (bookingService.getClassroomAccess as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      expect(screen.getByText(/جاري تجهيز الفصل الافتراضي/i)).toBeInTheDocument();
    });

    it('يجب أن تعرض شاشة التحميل أثناء جلب بيانات الغرفة', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: STUDENT_USER,
        loading: false,
      });
      // وعد معلّق — الطلب لم ينته بعد
      (bookingService.getClassroomAccess as jest.Mock).mockReturnValue(new Promise(() => {}));

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      expect(screen.getByText(/جاري تجهيز الفصل الافتراضي/i)).toBeInTheDocument();
    });
  });

  // ─── 2. Error State Tests ──────────────────────────────────────────────────

  describe('حالة الخطأ (Error State)', () => {
    it('يجب أن يعرض رسالة الخطأ عند فشل جلب بيانات الغرفة', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: STUDENT_USER,
        loading: false,
      });
      (bookingService.getClassroomAccess as jest.Mock).mockRejectedValue(
        new Error('Unauthorized')
      );

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(
          screen.getByText(/فشل الاتصال بالغرفة الافتراضية/i)
        ).toBeInTheDocument();
      });
    });

    it('يجب أن يعرض زر "العودة للوحة التحكم" في حالة الخطأ', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: STUDENT_USER,
        loading: false,
      });
      (bookingService.getClassroomAccess as jest.Mock).mockRejectedValue(new Error('403'));

      renderWithClient(<ClassroomPage params={{ id: '456' }} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /العودة للوحة التحكم/i })).toBeInTheDocument();
      });
    });
  });

  // ─── 3. Auth Redirect Tests ────────────────────────────────────────────────

  describe('إعادة التوجيه (Auth Redirect)', () => {
    it('يجب أن يُعيد توجيه المستخدم غير المُسجّل إلى صفحة الدخول', async () => {
      // Reset the shared mock before this test
      mockRouterReplace.mockReset();

      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false, // Auth انتهت، لكن لا يوجد مستخدم
      });

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith('/login');
      });
    });
  });

  // ─── 4. Lobby State Tests ─────────────────────────────────────────────────

  describe('غرفة الانتظار (Lobby)', () => {
    it('يجب أن تعرض الـ Lobby بعد جلب البيانات بنجاح', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: STUDENT_USER,
        loading: false,
      });
      (bookingService.getClassroomAccess as jest.Mock).mockResolvedValue(
        CLASSROOM_ACCESS_SUCCESS
      );

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByTestId('lobby-preview')).toBeInTheDocument();
        expect(screen.getByText(/هل أنت مستعد/i)).toBeInTheDocument();
      });
    });

    it('يجب ألا تعرض Agora أو Whiteboard قبل الانضمام للمكالمة', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: STUDENT_USER,
        loading: false,
      });
      (bookingService.getClassroomAccess as jest.Mock).mockResolvedValue(
        CLASSROOM_ACCESS_SUCCESS
      );

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByTestId('lobby-preview')).toBeInTheDocument();
      });

      // لا يجب أن يظهر Agora قبل الانضمام
      expect(screen.queryByTestId('agora-call-mock')).not.toBeInTheDocument();
    });
  });

  // ─── 5. Whiteboard Pending State Tests ────────────────────────────────────

  describe('حالة السبورة المعلّقة (Whiteboard Pending)', () => {
    it('يجب أن تبدأ بالـ polling لحالة السبورة عندما تكون في طور التهيئة', async () => {
      jest.useFakeTimers();

      (useAuth as jest.Mock).mockReturnValue({
        user: STUDENT_USER,
        loading: false,
      });
      (bookingService.getClassroomAccess as jest.Mock).mockResolvedValue(
        CLASSROOM_ACCESS_PENDING_WHITEBOARD
      );
      (bookingService.getWhiteboardStatus as jest.Mock).mockResolvedValue({
        status: 'pending',
        whiteboard: null,
      });

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      // انتظر انتهاء الجلب الأولي
      await waitFor(() => {
        expect(screen.getByTestId('lobby-preview')).toBeInTheDocument();
      });

      // تقدم الزمن لبدء الـ polling
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(bookingService.getWhiteboardStatus).toHaveBeenCalledWith(123);
      });

      jest.useRealTimers();
    });

    it('يجب أن يتوقف الـ polling عندما تصبح السبورة جاهزة', async () => {
      jest.useFakeTimers();

      (useAuth as jest.Mock).mockReturnValue({
        user: STUDENT_USER,
        loading: false,
      });
      (bookingService.getClassroomAccess as jest.Mock).mockResolvedValue(
        CLASSROOM_ACCESS_PENDING_WHITEBOARD
      );
      // يُعيد "جاهز" في المحاولة الأولى للـ polling
      (bookingService.getWhiteboardStatus as jest.Mock).mockResolvedValue({
        status: 'ready',
        whiteboard: {
          room_uuid: 'polled-uuid',
          room_token: 'polled-token',
        },
      });

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(screen.getByTestId('lobby-preview')).toBeInTheDocument();
      });

      // تقدم لأول polling
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Flush microtasks to allow the promise to resolve and state to update
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      // بعد استلام البيانات، لا يجب استدعاء API مرة أخرى
      expect(bookingService.getWhiteboardStatus).toHaveBeenCalledTimes(1);

      // تقدم مرة أخرى — يجب ألا يُستدعى polling إضافي
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // لا تزيد عن استدعاء واحد
      expect(bookingService.getWhiteboardStatus).toHaveBeenCalledTimes(1);
    });
  });

  // ─── 6. Call View Tests ───────────────────────────────────────────────────

  describe('نافذة المكالمة (Call View)', () => {
    it('يجب أن يعرض AgoraCall عند الانضمام للمكالمة من الـ Lobby', async () => {
      const user = userEvent.setup();

      (useAuth as jest.Mock).mockReturnValue({
        user: STUDENT_USER,
        loading: false,
      });
      (bookingService.getClassroomAccess as jest.Mock).mockResolvedValue(
        CLASSROOM_ACCESS_SUCCESS
      );

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      // انتظر ظهور الـ Lobby
      await waitFor(() => {
        expect(screen.getByTestId('lobby-preview')).toBeInTheDocument();
      });

      // انقر على زر الدخول
      await user.click(screen.getByRole('button', { name: /دخول/i }));

      await waitFor(() => {
        expect(screen.getByTestId('agora-call-mock')).toBeInTheDocument();
      });
    });
  });

  // ─── 7. Teacher-specific Tests ───────────────────────────────────────────

  describe('صلاحيات المعلم', () => {
    it('يجب أن يجلب screen_token للمعلم', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: TEACHER_USER,
        loading: false,
      });
      (bookingService.getClassroomAccess as jest.Mock).mockResolvedValue({
        data: {
          ...CLASSROOM_ACCESS_SUCCESS.data,
          role: 'host',
          screen_token: 'screen-token-for-teacher',
        },
      });

      renderWithClient(<ClassroomPage params={{ id: '123' }} />);

      await waitFor(() => {
        expect(bookingService.getClassroomAccess).toHaveBeenCalledWith(123);
      });

      // التحقق من جلب بيانات المعلم بنجاح
      await waitFor(() => {
        expect(screen.getByTestId('lobby-preview')).toBeInTheDocument();
      });
    });
  });
});
