class AdbNotFoundError(Exception):
    """Raised when the adb binary is missing from PATH."""


class AdbCommandError(Exception):
    """Raised when adb returns a non-zero exit code."""

    def __init__(self, command: str, stderr: str) -> None:
        self.command = command
        self.stderr = stderr
        super().__init__(f"ADB command failed: {command} — {stderr.strip()}")
