from __future__ import annotations

import os
import subprocess
import sys
import threading
from pathlib import Path

HOST = os.getenv("VISIONPOS_AGENT_HOST", "127.0.0.1")
PORT = int(os.getenv("VISIONPOS_AGENT_PORT", "8767"))
BASE_DIR = Path(__file__).resolve().parent

try:
    import tkinter as tk
    from tkinter import ttk
except ImportError:
    tk = None


class VisionEngineApp:
    def __init__(self) -> None:
        self.process: subprocess.Popen | None = None
        self._build_ui()

    def _build_ui(self) -> None:
        self.root = tk.Tk()
        self.root.title("VisionPOS Engine")
        self.root.geometry("520x340")
        self.root.resizable(False, False)
        self.root.configure(bg="#0f0a1e")

        try:
            self.root.iconbitmap(default=str(BASE_DIR / "engine.ico"))
        except Exception:
            pass

        container = tk.Frame(self.root, bg="#0f0a1e", padx=24, pady=20)
        container.pack(fill="both", expand=True)

        title = tk.Label(
            container,
            text="VisionPOS Engine",
            font=("Segoe UI", 18, "bold"),
            fg="#c084fc",
            bg="#0f0a1e",
        )
        title.pack(anchor="w")

        subtitle = tk.Label(
            container,
            text="Local computer-vision server for AI checkout",
            font=("Segoe UI", 10),
            fg="#94a3b8",
            bg="#0f0a1e",
        )
        subtitle.pack(anchor="w", pady=(0, 16))

        status_frame = tk.Frame(container, bg="#1a1230", padx=16, pady=12, highlightbackground="#2d1b5e", highlightthickness=1)
        status_frame.pack(fill="x", pady=(0, 12))

        self.status_dot = tk.Label(status_frame, text="●", font=("Segoe UI", 14), fg="#64748b", bg="#1a1230")
        self.status_dot.pack(side="left")

        self.status_label = tk.Label(
            status_frame,
            text="Engine stopped",
            font=("Segoe UI", 11, "bold"),
            fg="#94a3b8",
            bg="#1a1230",
            padx=8,
        )
        self.status_label.pack(side="left")

        detail_frame = tk.Frame(container, bg="#1a1230", padx=16, pady=10, highlightbackground="#2d1b5e", highlightthickness=1)
        detail_frame.pack(fill="x", pady=(0, 12))

        tk.Label(detail_frame, text="Server URL", font=("Segoe UI", 9, "bold"), fg="#64748b", bg="#1a1230").pack(anchor="w")
        self.url_label = tk.Label(
            detail_frame,
            text=f"http://{HOST}:{PORT}",
            font=("Segoe UI", 10),
            fg="#38bdf8",
            bg="#1a1230",
        )
        self.url_label.pack(anchor="w")

        btn_frame = tk.Frame(container, bg="#0f0a1e")
        btn_frame.pack(fill="x", pady=(4, 0))

        self.run_btn = tk.Button(
            btn_frame,
            text="▶  Run Engine",
            font=("Segoe UI", 11, "bold"),
            bg="#7c3aed",
            fg="white",
            activebackground="#6d28d9",
            activeforeground="white",
            relief="flat",
            padx=20,
            pady=8,
            cursor="hand2",
            borderwidth=0,
            command=self._run_engine,
        )
        self.run_btn.pack(side="left", padx=(0, 8))

        self.stop_btn = tk.Button(
            btn_frame,
            text="■  Stop",
            font=("Segoe UI", 11, "bold"),
            bg="#1e293b",
            fg="#94a3b8",
            activebackground="#334155",
            activeforeground="white",
            relief="flat",
            padx=20,
            pady=8,
            cursor="hand2",
            borderwidth=0,
            state="disabled",
            command=self._stop_engine,
        )
        self.stop_btn.pack(side="left", padx=(0, 8))

        self.kill_btn = tk.Button(
            btn_frame,
            text="X  Kill all",
            font=("Segoe UI", 11, "bold"),
            bg="#450a0a",
            fg="#fca5a5",
            activebackground="#7f1d1d",
            activeforeground="white",
            relief="flat",
            padx=20,
            pady=8,
            cursor="hand2",
            borderwidth=0,
            command=self._kill_all,
        )
        self.kill_btn.pack(side="left")

        log_frame = tk.Frame(container, bg="#0f0a1e")
        log_frame.pack(fill="both", expand=True, pady=(12, 0))

        self.log_text = tk.Text(
            log_frame,
            height=5,
            font=("Consolas", 9),
            bg="#0d0a1a",
            fg="#64748b",
            relief="flat",
            borderwidth=0,
            padx=8,
            pady=8,
        )
        self.log_text.pack(fill="both", expand=True)

        scroll = tk.Scrollbar(self.log_text, command=self.log_text.yview)
        scroll.pack(side="right", fill="y")
        self.log_text.configure(yscrollcommand=scroll.set)

        self._log("Engine ready. Click Run Engine to start.")

    def _log(self, msg: str) -> None:
        self.log_text.insert("end", msg + "\n")
        self.log_text.see("end")

    def _set_running(self, running: bool) -> None:
        if running:
            self.status_dot.configure(fg="#22c55e")
            self.status_label.configure(text="Engine running", fg="#22c55e")
            self.run_btn.configure(state="disabled", bg="#334155", fg="#64748b")
            self.stop_btn.configure(state="normal", bg="#dc2626", fg="white", activebackground="#b91c1c")
        else:
            self.status_dot.configure(fg="#64748b")
            self.status_label.configure(text="Engine stopped", fg="#94a3b8")
            self.run_btn.configure(state="normal", bg="#7c3aed", fg="white")
            self.stop_btn.configure(state="disabled", bg="#1e293b", fg="#94a3b8")

    def _run_engine(self) -> None:
        if self.process is not None:
            return

        venv_python = BASE_DIR / ".venv" / "Scripts" / "python.exe"
        python = venv_python if venv_python.exists() else Path(sys.executable)

        def start() -> None:
            self._log("Starting VisionPOS Engine...")
            self._set_running(True)

            try:
                self.process = subprocess.Popen(
                    [
                        str(python),
                        "-m",
                        "uvicorn",
                        "api:app",
                        "--host", HOST,
                        "--port", str(PORT),
                        "--log-level", "info",
                    ],
                    cwd=str(BASE_DIR),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )

                for line in self.process.stdout:
                    self._log(line.rstrip())
            except Exception as e:
                self._log(f"Error: {e}")
            finally:
                self.process = None
                self.root.after(0, lambda: self._set_running(False))
                self._log("Engine stopped.")

        threading.Thread(target=start, daemon=True).start()

    def _stop_engine(self) -> None:
        if self.process is not None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self._log("Engine terminated.")
            self.process = None

    def _kill_all(self) -> None:
        self._stop_engine()
        self._log("Killing any lingering processes on port %d..." % PORT)
        try:
            result = subprocess.run(
                ["netstat", "-ano"], capture_output=True, text=True, creationflags=subprocess.CREATE_NO_WINDOW
            )
            pids = set()
            for line in result.stdout.splitlines():
                if ":%d " % PORT in line or ":%d " % PORT in line.replace("0.0.0.0", "127.0.0.1"):
                    parts = line.strip().split()
                    if parts and parts[-1].isdigit():
                        pids.add(int(parts[-1]))
            for pid in pids:
                try:
                    subprocess.run(["taskkill", "/F", "/PID", str(pid)], capture_output=True, creationflags=subprocess.CREATE_NO_WINDOW)
                    self._log("Killed PID %d" % pid)
                except Exception:
                    pass
        except Exception as e:
            self._log("Kill all error: %s" % e)
        self._log("All processes on port %d cleared." % PORT)
        self.root.after(0, lambda: self._set_running(False))

    def run(self) -> None:
        self.root.mainloop()
        self._stop_engine()


def main() -> None:
    app = VisionEngineApp()
    app.run()


if __name__ == "__main__":
    main()
