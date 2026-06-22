import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ClassroomPage from '../[id]/page';
import { useAuth } from '@/context/AuthContext';
import { bookingService } from '@/services/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  bookingService: {
    getClassroomAccess: jest.fn(),
    getWhiteboardStatus: jest.fn(),
  },
}));

// Mock Agora Call & Whiteboard to avoid loading real SDKs in tests
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

describe('ClassroomPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, role: 'student' },
      loading: false,
    });
  });

  it('renders loading state initially', () => {
    (bookingService.getClassroomAccess as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<ClassroomPage params={{ id: '123' }} />);
    expect(screen.getByText(/جاري تجهيز الفصل الافتراضي/i)).toBeInTheDocument();
  });

  it('shows error if access fails', async () => {
    (bookingService.getClassroomAccess as jest.Mock).mockRejectedValue(new Error('Unauthorized'));
    render(<ClassroomPage params={{ id: '123' }} />);
    await waitFor(() => {
      expect(screen.getByText(/فشل الاتصال بالغرفة الافتراضية/i)).toBeInTheDocument();
    });
  });

  it('shows lobby after successful data fetch', async () => {
    (bookingService.getClassroomAccess as jest.Mock).mockResolvedValue({
      data: {
        channel_name: 'test_channel',
        uid: 1,
        role: 'audience',
        token: 'test_token',
      }
    });

    render(<ClassroomPage params={{ id: '123' }} />);

    await waitFor(() => {
      expect(screen.getByText(/هل أنت مستعد/i)).toBeInTheDocument();
    });
  });
});
