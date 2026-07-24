import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import Whiteboard from '../Whiteboard';


const mockSendCursorPosition = jest.fn();

jest.mock('@/hooks/useAgoraRTM', () => ({
  useAgoraRTM: () => ({ sendCursorPosition: mockSendCursorPosition }),
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
    state: { sceneState: { index: number; scenes: Record<string, unknown>[] } };
    phase: string;
    bindHtmlElement: jest.Mock;
    callbacks: { on: jest.Mock };
    listeners: Record<string, ((...args: unknown[]) => void)>;
    setScenePath: jest.Mock;
    putScenes: jest.Mock;
    cleanCurrentScene: jest.Mock;
    disconnect: jest.Mock;
    setMemberState: jest.Mock;
    setViewMode: jest.Mock;
    undo: jest.Mock;
    redo: jest.Mock;
    disableDeviceInputs: boolean;

    constructor() {
      this.state = { sceneState: { index: 0, scenes: [{}] } };
      this.phase = 'connected';
      this.bindHtmlElement = jest.fn();
      this.callbacks = { on: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
        this.listeners[event] = callback;
      }) };
      this.listeners = {};
      this.setScenePath = jest.fn((path: string) => {
        const nextIndex = Number(path.replace(/^\//, ''));
        this.state.sceneState.index = Number.isNaN(nextIndex) ? 0 : nextIndex;
        this.listeners.onRoomStateChanged?.({ sceneState: this.state.sceneState });
      });
      this.putScenes = jest.fn((_path: string, scenes: Record<string, unknown>[], newIndex: number) => {
        this.state.sceneState.scenes = [...this.state.sceneState.scenes, ...scenes];
        this.state.sceneState.index = newIndex;
        this.listeners.onRoomStateChanged?.({ sceneState: this.state.sceneState });
      });
      this.cleanCurrentScene = jest.fn();
      this.disconnect = jest.fn().mockResolvedValue(undefined);
      this.setMemberState = jest.fn();
      this.setViewMode = jest.fn();
      this.undo = jest.fn();
      this.redo = jest.fn();
      this.disableDeviceInputs = false;
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

});
