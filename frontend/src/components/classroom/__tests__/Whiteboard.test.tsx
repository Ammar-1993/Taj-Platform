import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import Whiteboard from '../Whiteboard';

const mockGetContext = jest.fn();

const mockSendCursorPosition = jest.fn();
const mockJoinRoom = jest.fn();

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
    state = { sceneState: { index: 0, scenes: [] } };
    phase = 'connected';
    bindHtmlElement = jest.fn();
    callbacks = { on: jest.fn() };
    setScenePath = jest.fn();
    putScenes = jest.fn();
    cleanCurrentScene = jest.fn();
    disconnect = jest.fn().mockResolvedValue(undefined);
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

describe('Whiteboard overlay canvas', () => {
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

  it('uses the real container size for the overlay canvas and maps pointer coordinates 1:1', async () => {
    const ctx = {
      setTransform: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
    };
    mockGetContext.mockReturnValue(ctx as never);
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as never);
    const { container } = render(
      <Whiteboard
        appIdentifier="app"
        roomUuid="room"
        roomToken="token"
        uid="user"
        isTeacher={true}
        bookingId="1"
      />
    );

    const whiteboard = container.querySelector('div[class*="pointer-events-auto"]') as HTMLDivElement;
    const overlay = container.querySelector('canvas') as HTMLCanvasElement;

    await waitFor(() => {
      expect(overlay.width).toBe(800);
      expect(overlay.height).toBe(600);
    });

    Object.defineProperty(whiteboard, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 10, top: 20, width: 400, height: 300 }),
    });

    act(() => {
      whiteboard.dispatchEvent(new PointerEvent('pointerdown', { clientX: 110, clientY: 60, pointerId: 1, bubbles: true }));
      whiteboard.dispatchEvent(new PointerEvent('pointermove', { clientX: 160, clientY: 90, pointerId: 1, bubbles: true }));
    });

    expect(ctx.moveTo).toHaveBeenCalledWith(100, 40);
    expect(ctx.lineTo).toHaveBeenCalledWith(150, 70);
  });
});
