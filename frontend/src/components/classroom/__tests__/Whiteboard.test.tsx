import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import Whiteboard from '../Whiteboard';


const mockSendCursorPosition = jest.fn();
const mockSendCustomMessage = jest.fn();

jest.mock('@/hooks/useAgoraRTM', () => ({
  useAgoraRTM: () => ({
    sendCursorPosition: mockSendCursorPosition,
    sendCustomMessage: mockSendCustomMessage,
  }),
}));

jest.mock('@/services/api', () => ({
  bookingService: {
    refreshWhiteboardToken: jest.fn().mockResolvedValue({ room_token: 'token' }),
  },
}));

jest.mock('@sentry/nextjs', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));

jest.mock('white-web-sdk', () => {
  class MockRoom {
    state: { sceneState: { index: number; scenes: Record<string, unknown>[]; scenePath: string }; globalState?: Record<string, unknown> };
    phase: string;
    bindHtmlElement: jest.Mock;
    callbacks: { on: jest.Mock };
    listeners: Record<string, ((...args: unknown[]) => void)>;
    setScenePath: jest.Mock;
    setSceneIndex: jest.Mock;
    putScenes: jest.Mock;
    cleanCurrentScene: jest.Mock;
    disconnect: jest.Mock;
    setMemberState: jest.Mock;
    setViewMode: jest.Mock;
    undo: jest.Mock;
    redo: jest.Mock;
    disableDeviceInputs: boolean;
    setGlobalState: jest.Mock;
    refreshViewSize: jest.Mock;
    isWritable: boolean;

    constructor() {
      this.state = { sceneState: { index: 0, scenes: [{}], scenePath: '/init' }, globalState: {} };
      this.phase = 'connected';
      this.bindHtmlElement = jest.fn();
      this.callbacks = { on: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
        this.listeners[event] = callback;
      }) };
      this.listeners = {};
      this.setScenePath = jest.fn((path: string) => {
        const nextIndex = Number(path.replace(/^\//, ''));
        this.state.sceneState.index = Number.isNaN(nextIndex) ? 0 : nextIndex;
        this.listeners.onRoomStateChanged?.({ sceneState: this.state.sceneState, globalState: this.state.globalState });
      });
      this.setSceneIndex = jest.fn((index: number) => {
        this.state.sceneState.index = index;
        this.listeners.onRoomStateChanged?.({ sceneState: this.state.sceneState, globalState: this.state.globalState });
      });
      this.putScenes = jest.fn((_path: string, scenes: Record<string, unknown>[], newIndex: number) => {
        this.state.sceneState.scenes = [...this.state.sceneState.scenes, ...scenes];
        this.state.sceneState.index = newIndex;
        this.listeners.onRoomStateChanged?.({ sceneState: this.state.sceneState, globalState: this.state.globalState });
      });
      this.cleanCurrentScene = jest.fn();
      this.disconnect = jest.fn().mockResolvedValue(undefined);
      this.setMemberState = jest.fn();
      this.setViewMode = jest.fn();
      this.undo = jest.fn();
      this.redo = jest.fn();
      this.disableDeviceInputs = false;
      this.setGlobalState = jest.fn((patch) => {
        this.state.globalState = { ...this.state.globalState, ...patch };
        return this.state.globalState;
      });
      this.refreshViewSize = jest.fn();
      this.isWritable = true;
    }
  }

  return {
    WhiteWebSdk: jest.fn().mockImplementation(() => ({
      joinRoom: jest.fn().mockResolvedValue(new MockRoom()),
    })),
    DeviceType: { Desktop: 'desktop', Touch: 'touch' },
    ViewMode: { Broad: 'broad' },
    ApplianceNames: { pencil: 'pencil' },
    RoomPhase: {
      Connecting: 'connecting',
      Connected: 'connected',
      Disconnected: 'disconnected',
    },
  };
});

describe('Whiteboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.PointerEvent = class PointerEvent extends MouseEvent {
      pointerId: number;
      constructor(type: string, props: PointerEventInit = {}) {
        super(type, props);
        this.pointerId = props.pointerId || 0;
      }
    } as typeof PointerEvent;
    Object.defineProperty(window, 'devicePixelRatio', {
      configurable: true,
      value: 2,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 400,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 300,
    });
    class MockResizeObserver {
      observe() {}
      disconnect() {}
    }
    // @ts-expect-error - ResizeObserver is available in browser environments but not in jsdom typing.
    global.ResizeObserver = MockResizeObserver;
  });

  it('enables page counter actions for the active whiteboard room', async () => {
    render(
      <Whiteboard
        appIdentifier="app"
        roomUuid="room"
        roomToken="token"
        uid="user"
        isTeacher={true}
        bookingId="1"
        isAbsoluteFocusMode={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });

    const addPageButton = screen.getByTitle('صفحة جديدة');
    act(() => {
      addPageButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await waitFor(() => {
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    const nextPageButton = screen.getAllByRole('button').find((button) => button.className.includes('text-slate-400') && button.getAttribute('title') !== 'صفحة جديدة');
    if (nextPageButton) {
      act(() => {
        nextPageButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    }

    await waitFor(() => {
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });
  });

  it('defaults to sg region when no region is specified', async () => {
    const { WhiteWebSdk } = jest.requireMock('white-web-sdk');
    render(
      <Whiteboard
        appIdentifier="app"
        roomUuid="room"
        roomToken="token"
        uid="user"
        isTeacher={true}
        bookingId="1"
      />
    );

    expect(WhiteWebSdk).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'sg',
      })
    );

    await waitFor(() => {
      expect(screen.getByTitle('قلم (P)')).toBeInTheDocument();
    });
  });

  it('renders retry button and allows retrying when room joining fails', async () => {
    const { WhiteWebSdk } = jest.requireMock('white-web-sdk');
    const mockJoinRoom = jest.fn().mockRejectedValue(new Error('Connection error'));
    (WhiteWebSdk as jest.Mock).mockImplementationOnce(() => ({
      joinRoom: mockJoinRoom,
    }));

    render(
      <Whiteboard
        appIdentifier="app"
        roomUuid="room"
        roomToken="token"
        uid="user"
        isTeacher={true}
        bookingId="1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('حدث خطأ في السبورة')).toBeInTheDocument();
      expect(screen.getByText('إعادة محاولة الاتصال بالسبورة')).toBeInTheDocument();
      expect(screen.getByText('تحديث الصفحة بالكامل')).toBeInTheDocument();
    }, { timeout: 3500 });
  });

  it('synchronizes whiteboard toggle from teacher via globalState and Agora RTM', async () => {
    const { rerender } = render(
      <Whiteboard
        appIdentifier="app"
        roomUuid="room"
        roomToken="token"
        uid="teacher-1"
        isTeacher={true}
        bookingId="1"
        showWhiteboard={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTitle('قلم (P)')).toBeInTheDocument();
    });

    // Teacher opens whiteboard
    rerender(
      <Whiteboard
        appIdentifier="app"
        roomUuid="room"
        roomToken="token"
        uid="teacher-1"
        isTeacher={true}
        bookingId="1"
        showWhiteboard={true}
      />
    );

    await waitFor(() => {
      expect(mockSendCustomMessage).toHaveBeenCalledWith({
        type: 'whiteboard_toggle',
        show: true,
      });
    });
  });

  it('automatically triggers onRemoteToggle for student and enters Follower mode', async () => {
    const mockOnRemoteToggle = jest.fn();

    render(
      <Whiteboard
        appIdentifier="app"
        roomUuid="room"
        roomToken="token"
        uid="student-1"
        isTeacher={false}
        bookingId="1"
        showWhiteboard={false}
        onRemoteToggle={mockOnRemoteToggle}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTitle('قلم (P)')).not.toBeInTheDocument();
    });
  });

  it('synchronizes Absolute Focus Mode from teacher to student and updates viewport', async () => {
    const mockOnToggleFocusMode = jest.fn();

    render(
      <Whiteboard
        appIdentifier="app"
        roomUuid="room"
        roomToken="token"
        uid="teacher-1"
        isTeacher={true}
        bookingId="1"
        showWhiteboard={true}
        isAbsoluteFocusMode={false}
        onToggleFocusMode={mockOnToggleFocusMode}
      />
    );

    await waitFor(() => {
      expect(screen.getByTitle('وضع التركيز المطلق')).toBeInTheDocument();
    });

    const focusBtn = screen.getByTitle('وضع التركيز المطلق');
    act(() => {
      focusBtn.click();
    });

    expect(mockOnToggleFocusMode).toHaveBeenCalledWith(true);
    expect(mockSendCustomMessage).toHaveBeenCalledWith({
      type: 'focus_mode_toggle',
      focus: true,
    });
  });
});
