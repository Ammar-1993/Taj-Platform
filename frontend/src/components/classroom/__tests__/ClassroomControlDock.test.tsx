import React from "react";
import { render, fireEvent } from "@testing-library/react";
import {
  ClassroomControlDock,
  ClassroomControlDockProps,
} from "../ClassroomControlDock";

const createDefaultProps = (
  overrides: Partial<ClassroomControlDockProps> = {}
): ClassroomControlDockProps => ({
  isUiHidden: false,
  userRole: "host",
  isTeacher: false,
  micStatus: "granted",
  cameraStatus: "granted",
  isMicEnabled: true,
  isCameraEnabled: true,
  hasWhiteboardData: true,
  whiteboardPending: false,
  showWhiteboard: false,
  isSharing: false,
  onToggleMic: jest.fn(),
  onToggleCamera: jest.fn(),
  onDeniedClick: jest.fn(),
  onToggleWhiteboard: jest.fn(),
  onToggleScreenShare: jest.fn(),
  onEndOrLeave: jest.fn(),
  ...overrides,
});

describe("ClassroomControlDock", () => {
  it("renders mic, camera, whiteboard, and leave buttons for host student", () => {
    const props = createDefaultProps();
    const { container } = render(<ClassroomControlDock {...props} />);

    expect(container.querySelector("#dock-btn-mic")).toBeInTheDocument();
    expect(container.querySelector("#dock-btn-camera")).toBeInTheDocument();
    expect(container.querySelector("#dock-btn-whiteboard")).toBeInTheDocument();
    expect(container.querySelector("#dock-btn-screenshare")).not.toBeInTheDocument();
    expect(container.querySelector("#dock-btn-end")).toBeInTheDocument();
  });

  it("renders screen-share button for teacher", () => {
    const props = createDefaultProps({ isTeacher: true });
    const { container } = render(<ClassroomControlDock {...props} />);

    const screenBtn = container.querySelector("#dock-btn-screenshare");
    expect(screenBtn).toBeInTheDocument();
    fireEvent.click(screenBtn!);
    expect(props.onToggleScreenShare).toHaveBeenCalledTimes(1);
  });

  it("calls onDeniedClick when mic or camera is in denied status", () => {
    const props = createDefaultProps({
      micStatus: "denied",
      cameraStatus: "denied",
    });
    const { container } = render(<ClassroomControlDock {...props} />);

    fireEvent.click(container.querySelector("#dock-btn-mic")!);
    expect(props.onDeniedClick).toHaveBeenCalledWith("mic");

    fireEvent.click(container.querySelector("#dock-btn-camera")!);
    expect(props.onDeniedClick).toHaveBeenCalledWith("camera");
  });

  it("disables whiteboard button when whiteboard data is not ready", () => {
    const props = createDefaultProps({
      hasWhiteboardData: false,
      whiteboardPending: true,
    });
    const { container } = render(<ClassroomControlDock {...props} />);

    const wbBtn = container.querySelector("#dock-btn-whiteboard") as HTMLButtonElement;
    expect(wbBtn).toBeDisabled();
    fireEvent.click(wbBtn);
    expect(props.onToggleWhiteboard).not.toHaveBeenCalled();
  });
});
