#!/usr/bin/env python3
"""
Network Failure Detection App (Tkinter GUI)
-------------------------------------------
Enter the links between servers, click "Analyze", and the app:
  * draws the network,
  * highlights critical servers (articulation points) in red,
  * shows which parts get disconnected if you select a critical
import math server.

Run:  python critical_servers_app.py
Only the Python standard library is required (Tkinter ships with Python).
"""

import random
import sys
import tkinter as tk
from collections import defaultdict
from tkinter import filedialog, messagebox, ttk

sys.setrecursionlimit(100000)

PART_COLORS = ["#4C9BE8", "#F2A93B", "#5CB85C", "#B07CC6", "#E8708A", "#3FBFBF"]
CRIT_COLOR = "#D9534F"
OK_COLOR = "#8FB8DE"

DEMO = """# Sample company network
Gateway Router1
Router1 Web
Router1 App
Web App
Router1 Router2
Router2 DB
Router2 Backup
DB Backup
Router2 Mail
Mail Printer
"""


# --------------------------------------------------------------------------
# Graph logic
# --------------------------------------------------------------------------
class Network:
    def __init__(self):
        self.adj = defaultdict(set)

    @classmethod
    def from_text(cls, text):
        net = cls()
        for raw in text.splitlines():
            line = raw.split("#")[0].strip()
            if not line:
                continue
            parts = line.replace(",", " ").split()
            if len(parts) == 1:
                net.adj[parts[0]]
            elif len(parts) == 2:
                a, b = parts
                if a == b:
                    net.adj[a]
                else:
                    net.adj[a].add(b)
                    net.adj[b].add(a)
            else:
                raise ValueError(f"Bad line (need two server names): '{raw.strip()}'")
        return net

    @property
    def servers(self):
        return sorted(self.adj)

    @property
    def links(self):
        return sorted({tuple(sorted((a, b))) for a in self.adj for b in self.adj[a]})

    def critical_servers(self):
        """Articulation points via Tarjan's DFS, O(V + E)."""
        disc, low, critical = {}, {}, set()
        timer = [0]

        def dfs(u, parent):
            disc[u] = low[u] = timer[0]
            timer[0] += 1
            children = 0
            for v in self.adj[u]:
                if v == parent:
                    continue
                if v in disc:
                    low[u] = min(low[u], disc[v])
                else:
                    children += 1
                    dfs(v, u)
                    low[u] = min(low[u], low[v])
                    if parent is not None and low[v] >= disc[u]:
                        critical.add(u)
            if parent is None and children > 1:
                critical.add(u)

        for s in self.servers:
            if s not in disc:
                dfs(s, None)
        return critical

    def components_without(self, removed):
        seen, comps = {removed}, []
        for s in self.servers:
            if s in seen:
                continue
            stack, comp = [s], []
            seen.add(s)
            while stack:
                x = stack.pop()
                comp.append(x)
                for y in self.adj[x]:
                    if y not in seen:
                        seen.add(y)
                        stack.append(y)
            comps.append(sorted(comp))
        return comps


def spring_layout(net, iterations=250, seed=7):
    """Small force-directed layout; returns {server: (x, y)} in 0..1 range."""
    rnd = random.Random(seed)
    nodes = net.servers
    n = len(nodes)
    pos = {s: [0.5 + 0.4 * math.cos(2 * math.pi * i / n),
               0.5 + 0.4 * math.sin(2 * math.pi * i / n)] for i, s in enumerate(nodes)}
    for s in nodes:
        pos[s][0] += rnd.uniform(-0.02, 0.02)
        pos[s][1] += rnd.uniform(-0.02, 0.02)  
    k = math.sqrt(1.0 / max(n, 1))
    temp = 0.1
    for _ in range(iterations):
        disp = {s: [0.0, 0.0] for s in nodes}
        for i, a in enumerate(nodes):
            for b in nodes[i + 1:]:
                dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
                d = math.hypot(dx, dy) or 0.001
                f = k * k / d
                disp[a][0] += dx / d * f
                disp[a][1] += dy / d * f
                disp[b][0] -= dx / d * f
                disp[b][1] -= dy / d * f
        for a, b in net.links:
            dx, dy = pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]
            d = math.hypot(dx, dy) or 0.001
            f = d * d / k
            disp[a][0] -= dx / d * f
            disp[a][1] -= dy / d * f
            disp[b][0] += dx / d * f
            disp[b][1] += dy / d * f
        for s in nodes:
            dx, dy = disp[s]
            d = math.hypot(dx, dy) or 0.001
            pos[s][0] += dx / d * min(d, temp)
            pos[s][1] += dy / d * min(d, temp)
        temp *= 0.98
    xs = [p[0] for p in pos.values()]
    ys = [p[1] for p in pos.values()]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    return {s: ((p[0] - minx) / ((maxx - minx) or 1),
                (p[1] - miny) / ((maxy - miny) or 1)) for s, p in pos.items()}


# --------------------------------------------------------------------------
# GUI
# --------------------------------------------------------------------------
class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Network Failure Detection - Critical Server Finder")
        self.geometry("1100x680")
        self.minsize(900, 560)

        self.net = None
        self.critical = set()
        self.layout = {}
        self.selected = None          # critical server selected for impact view
        self.part_of = {}             # server -> part index when a server is selected

        self._build_ui()
        self.input_text.insert("1.0", DEMO)
        self.analyze()

    # ---- UI construction ----
    def _build_ui(self):
        left = ttk.Frame(self, padding=8)
        left.pack(side="left", fill="y")
        right = ttk.Frame(self, padding=8)
        right.pack(side="left", fill="both", expand=True)

        ttk.Label(left, text="Links (one per line: ServerA ServerB)",
                  font=("Segoe UI", 10, "bold")).pack(anchor="w")
        self.input_text = tk.Text(left, width=30, height=16, font=("Consolas", 10))
        self.input_text.pack(fill="x", pady=(4, 6))

        row = ttk.Frame(left)
        row.pack(fill="x")
        ttk.Button(row, text="Analyze", command=self.analyze).pack(side="left", expand=True, fill="x")
        ttk.Button(row, text="Load file", command=self.load_file).pack(side="left", expand=True, fill="x", padx=4)
        ttk.Button(row, text="Demo", command=self.load_demo).pack(side="left", expand=True, fill="x")
        ttk.Button(row, text="Clear", command=lambda: self.input_text.delete("1.0", "end")
                   ).pack(side="left", expand=True, fill="x", padx=(4, 0))

        ttk.Separator(left).pack(fill="x", pady=8)
        self.summary = ttk.Label(left, text="", justify="left")
        self.summary.pack(anchor="w")

        ttk.Label(left, text="Critical servers (click to see impact)",
                  font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(8, 2))
        self.listbox = tk.Listbox(left, height=6, exportselection=False, font=("Segoe UI", 10))
        self.listbox.pack(fill="x")
        self.listbox.bind("<<ListboxSelect>>", self.on_list_select)

        ttk.Label(left, text="Impact if selected server fails",
                  font=("Segoe UI", 10, "bold")).pack(anchor="w", pady=(8, 2))
        self.impact = tk.Text(left, width=30, height=8, state="disabled", font=("Segoe UI", 9))
        self.impact.pack(fill="both", expand=True)

        self.canvas = tk.Canvas(right, bg="white", highlightthickness=1, highlightbackground="#ccc")
        self.canvas.pack(fill="both", expand=True)
        self.canvas.bind("<Configure>", lambda e: self.draw())
        self.canvas.bind("<Button-1>", self.on_canvas_click)

        legend = ttk.Frame(right)
        legend.pack(fill="x", pady=(6, 0))
        self._legend_item(legend, CRIT_COLOR, "Critical server")
        self._legend_item(legend, OK_COLOR, "Safe server")
        ttk.Label(legend, text="   Tip: click a red node to see how the network splits").pack(side="left")

    def _legend_item(self, parent, color, text):
        c = tk.Canvas(parent, width=14, height=14, highlightthickness=0)
        c.create_oval(2, 2, 12, 12, fill=color, outline="")
        c.pack(side="left")
        ttk.Label(parent, text=text).pack(side="left", padx=(2, 12))

    # ---- actions ----
    def load_demo(self):
        self.input_text.delete("1.0", "end")
        self.input_text.insert("1.0", DEMO)
        self.analyze()

    def load_file(self):
        path = filedialog.askopenfilename(filetypes=[("Text files", "*.txt *.csv"), ("All files", "*.*")])
        if not path:
            return
        with open(path) as f:
            self.input_text.delete("1.0", "end")
            self.input_text.insert("1.0", f.read())
        self.analyze()

    def analyze(self):
        try:
            net = Network.from_text(self.input_text.get("1.0", "end"))
        except ValueError as e:
            messagebox.showerror("Input error", str(e))
            return
        self.net = net
        self.selected = None
        self.part_of = {}
        self.listbox.delete(0, "end")
        self._set_impact("")
        if not net.servers:
            self.critical = set()
            self.summary.config(text="Network is empty.")
            self.draw()
            return
        self.critical = net.critical_servers()
        self.layout = spring_layout(net)
        for s in sorted(self.critical):
            self.listbox.insert("end", s)
        msg = f"Servers: {len(net.servers)}   Links: {len(net.links)}\n"
        if self.critical:
            msg += f"Critical servers: {len(self.critical)}"
        else:
            msg += "No single point of failure."
        self.summary.config(text=msg)
        self.draw()

    def select_server(self, name):
        if name not in self.critical:
            return
        self.selected = name
        comps = self.net.components_without(name)
        self.part_of = {s: i for i, comp in enumerate(comps) for s in comp}
        lines = [f"If {name} fails, the network splits into {len(comps)} parts:\n"]
        for i, comp in enumerate(comps, 1):
            lines.append(f"Part {i}: {', '.join(comp)}")
        self._set_impact("\n".join(lines))
        # sync list selection
        items = self.listbox.get(0, "end")
        if name in items:
            self.listbox.selection_clear(0, "end")
            self.listbox.selection_set(items.index(name))
        self.draw()

    def on_list_select(self, _):
        sel = self.listbox.curselection()
        if sel:
            self.select_server(self.listbox.get(sel[0]))

    def on_canvas_click(self, event):
        for name, (cx, cy) in self._pixel_pos().items():
            if math.hypot(event.x - cx, event.y - cy) <= 20:
                if name in self.critical:
                    self.select_server(name)
                return
        self.selected = None
        self.part_of = {}
        self.listbox.selection_clear(0, "end")
        self._set_impact("")
        self.draw()

    def _set_impact(self, text):
        self.impact.config(state="normal")
        self.impact.delete("1.0", "end")
        self.impact.insert("1.0", text)
        self.impact.config(state="disabled")

    # ---- drawing ----
    def _pixel_pos(self):
        w, h = self.canvas.winfo_width(), self.canvas.winfo_height()
        m = 50
        return {s: (m + x * max(w - 2 * m, 1), m + y * max(h - 2 * m, 1))
                for s, (x, y) in self.layout.items()}

    def draw(self):
        c = self.canvas
        c.delete("all")
        if not self.net or not self.net.servers:
            return
        pos = self._pixel_pos()
        for a, b in self.net.links:
            faded = self.selected in (a, b)
            c.create_line(*pos[a], *pos[b], fill="#e5e5e5" if faded else "#999",
                          width=2, dash=(4, 3) if faded else None)
        for s in self.net.servers:
            x, y = pos[s]
            if s == self.selected:
                fill, outline = "#ffffff", CRIT_COLOR
            elif self.selected is not None:
                fill, outline = PART_COLORS[self.part_of[s] % len(PART_COLORS)], "#444"
            elif s in self.critical:
                fill, outline = CRIT_COLOR, "#8a2b28"
            else:
                fill, outline = OK_COLOR, "#4a7aa8"
            if s == self.selected:
                c.create_oval(x - 20, y - 20, x + 20, y + 20, fill=fill, outline=outline, width=3, dash=(3, 2))
                c.create_text(x, y, text="X", fill=CRIT_COLOR, font=("Segoe UI", 12, "bold"))
            else:
                c.create_oval(x - 18, y - 18, x + 18, y + 18, fill=fill, outline=outline, width=2)
            c.create_text(x, y + 30, text=s, font=("Segoe UI", 9, "bold"), fill="#222")


if __name__ == "__main__":
    App().mainloop()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        