#!/usr/bin/env python3
"""
STRESS ZOMBIE APOCALYPSE (v4.7) - Professor Project Report & Complete Technical Manual Generator
Builds a publication-grade, illustrated PDF report explaining:
  1. What the game is about (educational motivation, mechanics mapping, target users)
  2. How every subsystem of the game runs (architecture, startup splash, tutorial, 60 FPS loop,
     visibility gate, breech safety interlock, 7.62mm ballistics, power-ups, campaign waves,
     procedural Web Audio, live kill cards, and post-level interactive forensic specimen lab)
  3. Complete Solid Mechanics math derivations, vector Mohr's Circle diagrams, benchmark, and tests.
"""

import math
import os
import pathlib
import sys

from reportlab.graphics.shapes import Circle, Drawing, Line, Polygon, Rect, String
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# FONT REGISTRATION (Embeds Windows TrueType fonts for full Greek + Math)
# ---------------------------------------------------------------------------
BODY_FONT = "Helvetica"
BODY_BOLD = "Helvetica-Bold"
BODY_ITALIC = "Helvetica-Oblique"
BODY_BI = "Helvetica-BoldOblique"
MONO_FONT = "Courier"
MONO_BOLD = "Courier-Bold"


def register_fonts():
    global BODY_FONT, BODY_BOLD, BODY_ITALIC, BODY_BI, MONO_FONT, MONO_BOLD
    win_fonts = pathlib.Path(r"C:\Windows\Fonts")

    segoe_map = {
        "Segoe": win_fonts / "segoeui.ttf",
        "Segoe-Bold": win_fonts / "segoeuib.ttf",
        "Segoe-Italic": win_fonts / "segoeuii.ttf",
        "Segoe-BoldItalic": win_fonts / "segoeuiz.ttf",
    }
    if all(p.exists() for p in segoe_map.values()):
        for name, path in segoe_map.items():
            pdfmetrics.registerFont(TTFont(name, str(path)))
        registerFontFamily(
            "Segoe",
            normal="Segoe",
            bold="Segoe-Bold",
            italic="Segoe-Italic",
            boldItalic="Segoe-BoldItalic",
        )
        BODY_FONT = "Segoe"
        BODY_BOLD = "Segoe-Bold"
        BODY_ITALIC = "Segoe-Italic"
        BODY_BI = "Segoe-BoldItalic"

    cons_map = {
        "Consolas": win_fonts / "consola.ttf",
        "Consolas-Bold": win_fonts / "consolab.ttf",
    }
    if all(p.exists() for p in cons_map.values()):
        for name, path in cons_map.items():
            pdfmetrics.registerFont(TTFont(name, str(path)))
        registerFontFamily(
            "Consolas",
            normal="Consolas",
            bold="Consolas-Bold",
            italic="Consolas",
            boldItalic="Consolas-Bold",
        )
        MONO_FONT = "Consolas"
        MONO_BOLD = "Consolas-Bold"


# ---------------------------------------------------------------------------
# ACADEMIC COLOR PALETTE
# ---------------------------------------------------------------------------
NAVY = colors.HexColor("#0F172A")       # Primary dark header/titles
SLATE = colors.HexColor("#334155")      # Subheadings & secondary text
TEXT = colors.HexColor("#1E293B")       # Body text
MUTED = colors.HexColor("#64748B")      # Captions & footers
BLUE = colors.HexColor("#0284C7")       # Primary cyan-blue accent
BLUE_DARK = colors.HexColor("#0369A1")  # Deep accent
EMERALD = colors.HexColor("#059669")    # Armed / Pass / Rankine highlight
AMBER = colors.HexColor("#D97706")      # Shear / Tresca warning
CRIMSON = colors.HexColor("#DC2626")    # Locked / Critical fault
VIOLET = colors.HexColor("#7C3AED")     # Distortion Energy / Shapeshifter
BG_LIGHT = colors.HexColor("#F8FAFC")   # Table alternating shade
BG_CARD = colors.HexColor("#EFF6FF")    # Callout background
BG_GREEN = colors.HexColor("#ECFDF5")   # Verification highlight
BG_AMBER = colors.HexColor("#FFFBEB")   # Warning/Formula tint
BORDER = colors.HexColor("#CBD5E1")     # Subtle grid border


class ReportCanvas(canvas.Canvas):
    """Two-pass canvas adding crisp running headers & Page X of Y footers."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_chrome(total_pages)
            super().showPage()
        super().save()

    def draw_chrome(self, total_pages):
        self.saveState()
        # Letter: 612 x 792 pt; 44 pt left/right -> [44 .. 568]
        if self._pageNumber > 1:
            self.setFont(BODY_BOLD, 7.8)
            self.setFillColor(SLATE)
            self.drawString(44, 760, "STRESS ZOMBIE APOCALYPSE (v4.7) — PROFESSOR PROJECT REPORT")
            self.setFont(BODY_FONT, 7.8)
            self.setFillColor(BLUE_DARK)
            self.drawRightString(568, 760, "Mechanics of Solids • 2D Stress/Strain & Failure Simulation")
            self.setStrokeColor(BLUE)
            self.setLineWidth(1.0)
            self.line(44, 753, 568, 753)

        self.setStrokeColor(BORDER)
        self.setLineWidth(0.6)
        self.line(44, 38, 568, 38)
        self.setFont(BODY_FONT, 7.6)
        self.setFillColor(MUTED)
        self.drawString(44, 27, "Stress Zombie Apocalypse • Interactive Solid Mechanics Platform (HTML5 Canvas / Vanilla JS / Python 3)")
        self.setFont(BODY_BOLD, 7.6)
        self.setFillColor(SLATE)
        self.drawRightString(568, 27, f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()


def inline_code(text):
    return f"<font name='{MONO_BOLD}' color='#0369A1'>{text}</font>"


def draw_arrow(d, x1, y1, x2, y2, stroke_color=NAVY, width=1.4, head=5.0):
    d.add(Line(x1, y1, x2, y2, strokeColor=stroke_color, strokeWidth=width))
    ang = math.atan2(y2 - y1, x2 - x1)
    p1x = x2 - head * math.cos(ang - math.pi / 6)
    p1y = y2 - head * math.sin(ang - math.pi / 6)
    p2x = x2 - head * math.cos(ang + math.pi / 6)
    p2y = y2 - head * math.sin(ang + math.pi / 6)
    d.add(Polygon([x2, y2, p1x, p1y, p2x, p2y], fillColor=stroke_color, strokeColor=stroke_color, strokeWidth=0.4))


def draw_box(d, x, y, w, h, title, lines, fill=BG_LIGHT, stroke=BLUE, title_color=NAVY, title_size=7.8, sub_size=6.6):
    d.add(Rect(x, y, w, h, rx=5, ry=5, fillColor=fill, strokeColor=stroke, strokeWidth=1.15))
    cy_title = y + h - 12
    d.add(String(x + w / 2.0, cy_title, title, fontName=BODY_BOLD, fontSize=title_size, fillColor=title_color, textAnchor="middle"))
    for idx, line in enumerate(lines):
        d.add(
            String(
                x + w / 2.0,
                cy_title - 9.5 - idx * 8.8,
                line,
                fontName=BODY_FONT,
                fontSize=sub_size,
                fillColor=SLATE,
                textAnchor="middle",
            )
        )


# ---------------------------------------------------------------------------
# DIAGRAM 1: SOFTWARE MODULE ARCHITECTURE & USER NAVIGATION FLOW (524 x 176 pt)
# ---------------------------------------------------------------------------
def build_architecture_diagram():
    d = Drawing(524, 176)
    d.add(Rect(0, 0, 524, 176, rx=6, ry=6, fillColor=BG_LIGHT, strokeColor=BORDER, strokeWidth=0.8))

    # Top Section: Software Architecture (y = 114..172)
    d.add(String(12, 163, "A. CLIENT-SERVER MODULE ARCHITECTURE (Zero External Dependencies)", fontName=BODY_BOLD, fontSize=7.8, fillColor=BLUE_DARK))

    draw_box(d, 10, 114, 116, 42, "1. UI & 5 Canvases", ["index.html (823 ln)", "styles.css (2,768 ln)"], fill=colors.white, stroke=BLUE)
    draw_box(d, 144, 114, 126, 42, "2. GameEngine (60 FPS)", ["js/game.js (4,063 ln)", "Waves, Gun Lock, Reports"], fill=BG_CARD, stroke=BLUE_DARK)
    draw_box(d, 288, 114, 120, 42, "3. StressMechanics", ["js/mechanics.js (508 ln)", "Mohr 2θ, Hooke, Laws"], fill=BG_GREEN, stroke=EMERALD)
    draw_box(d, 424, 114, 90, 42, "4. Subsystems", ["hud / zombies / study", "audio.js / run_game.py"], fill=BG_AMBER, stroke=AMBER)

    draw_arrow(d, 126, 135, 144, 135, stroke_color=BLUE_DARK)
    draw_arrow(d, 270, 135, 288, 135, stroke_color=EMERALD)
    draw_arrow(d, 408, 135, 424, 135, stroke_color=AMBER)

    # Divider line
    d.add(Line(10, 105, 514, 105, strokeColor=BORDER, strokeWidth=0.7, strokeDashArray=[3, 3]))

    # Bottom Section: Player State Machine (with ample header gap above overhead arrow)
    d.add(String(12, 94, "B. END-TO-END GAMEPLAY STATE MACHINE", fontName=BODY_BOLD, fontSize=7.8, fillColor=NAVY))

    draw_box(d, 10, 29, 72, 39, "1. Intro Splash", ["10s Animated", "or [SPACE]"], fill=colors.white, stroke=SLATE, title_size=7.2, sub_size=6.3)
    draw_box(d, 96, 29, 70, 39, "2. Welcome", ["Rules + Horror", "Audio Test"], fill=colors.white, stroke=SLATE, title_size=7.2, sub_size=6.3)
    draw_box(d, 180, 29, 72, 39, "3. Tutorial", ["4 Safe Drills", "Before Lvl 1"], fill=BG_GREEN, stroke=EMERALD, title_size=7.2, sub_size=6.3)
    draw_box(d, 266, 29, 72, 39, "4. Level Map", ["10 Sectors +", "Stars & Locks"], fill=BG_CARD, stroke=BLUE_DARK, title_size=7.2, sub_size=6.3)
    draw_box(d, 352, 29, 72, 39, "5. 60 FPS Battle", ["Aim θ -> Burst", "+ Live Card"], fill=BG_AMBER, stroke=CRIMSON, title_size=7.2, sub_size=6.3)
    draw_box(d, 438, 29, 76, 39, "6. Clear Report", ["Every-Zombie", "Lab & Unlock"], fill=BG_CARD, stroke=VIOLET, title_size=7.2, sub_size=6.3)

    draw_arrow(d, 82, 48.5, 96, 48.5, stroke_color=NAVY, head=4.0)
    draw_arrow(d, 166, 48.5, 180, 48.5, stroke_color=EMERALD, head=4.0)
    draw_arrow(d, 252, 48.5, 266, 48.5, stroke_color=BLUE_DARK, head=4.0)
    draw_arrow(d, 338, 48.5, 352, 48.5, stroke_color=CRIMSON, head=4.0)
    draw_arrow(d, 424, 48.5, 438, 48.5, stroke_color=VIOLET, head=4.0)

    # Bypass from Welcome to Level Map (overhead hop cleanly separated from Section B title!)
    d.add(Line(131, 68, 131, 78, strokeColor=BLUE, strokeWidth=1.0))
    d.add(Line(131, 78, 302, 78, strokeColor=BLUE, strokeWidth=1.0))
    draw_arrow(d, 302, 78, 302, 68, stroke_color=BLUE, width=1.0, head=3.8)
    d.add(String(216, 81.5, "Direct Start Campaign [SPACE]", fontName=BODY_FONT, fontSize=6.4, fillColor=BLUE_DARK, textAnchor="middle"))

    # Loop return from Post-Level Report back to Level Map (unlocks next sector)
    d.add(Line(476, 29, 476, 12, strokeColor=EMERALD, strokeWidth=1.1))
    d.add(Line(476, 12, 302, 12, strokeColor=EMERALD, strokeWidth=1.1))
    draw_arrow(d, 302, 12, 302, 29, stroke_color=EMERALD, width=1.1, head=4.0)
    d.add(String(389, 15, "Unlocks Level N+1 & Returns cleanly to Level Map", fontName=BODY_BOLD, fontSize=6.4, fillColor=EMERALD, textAnchor="middle"))

    return d


# ---------------------------------------------------------------------------
# DIAGRAM 2: COMBAT PIPELINE — VISIBILITY GATE TO KILL REPORT (524 x 96 pt)
# ---------------------------------------------------------------------------
def build_combat_pipeline_diagram():
    d = Drawing(524, 96)
    d.add(Rect(0, 0, 524, 96, rx=6, ry=6, fillColor=BG_LIGHT, strokeColor=BORDER, strokeWidth=0.8))
    d.add(String(12, 81, "FRAME-BY-FRAME FIRING AUTHORIZATION & ASSESSMENT PIPELINE", fontName=BODY_BOLD, fontSize=8.0, fillColor=BLUE_DARK))

    draw_box(d, 10, 14, 114, 56, "1. Visibility Gate", ["x ≤ (840 − inset)", "Prevents blind fire", "Status: WAIT"], fill=colors.white, stroke=SLATE, title_size=7.6, sub_size=6.7)
    draw_box(d, 140, 14, 122, 56, "2. Breech Interlock", ["Compare Crank θ vs", "Optimal θp or θs", "Safe only if |Δθ| ≤ 7.5°"], fill=BG_AMBER, stroke=AMBER, title_size=7.6, sub_size=6.7)
    draw_box(d, 278, 14, 118, 56, "3. 7.62mm Burst", ["4 staggered tracers", "Recoil + brass casings", "Cleaves torso along θ"], fill=colors.white, stroke=CRIMSON, title_size=7.6, sub_size=6.7)
    draw_box(d, 412, 14, 102, 56, "4. Forensic Report", ["Live Card (4.5s) +", "Full Stress & Strain", "Autopsy on Clear"], fill=BG_GREEN, stroke=EMERALD, title_size=7.6, sub_size=6.7)

    draw_arrow(d, 124, 42, 140, 42, stroke_color=NAVY)
    draw_arrow(d, 262, 42, 278, 42, stroke_color=CRIMSON)
    draw_arrow(d, 396, 42, 412, 42, stroke_color=EMERALD)
    return d


# ---------------------------------------------------------------------------
# DIAGRAM 3: PHYSICAL ELEMENT (θ) vs MOHR'S CIRCLE (2θ) BENCHMARK (524 x 204 pt)
# ---------------------------------------------------------------------------
def build_mohr_benchmark_diagram():
    d = Drawing(524, 204)
    d.add(Rect(0, 0, 524, 204, rx=6, ry=6, fillColor=BG_LIGHT, strokeColor=BORDER, strokeWidth=0.8))

    # Left panel: Physical rotated element
    d.add(Rect(8, 8, 190, 188, rx=4, ry=4, fillColor=colors.white, strokeColor=BORDER, strokeWidth=0.7))
    d.add(String(103, 182, "Physical Plane Rotation (θp = 22.5°)", fontName=BODY_BOLD, fontSize=8.0, fillColor=NAVY, textAnchor="middle"))

    cx, cy = 96.0, 96.0
    # Dashed reference axes
    d.add(Line(24, cy, 182, cy, strokeColor=BORDER, strokeWidth=0.9, strokeDashArray=[3, 2]))
    d.add(Line(cx, 32, cx, 162, strokeColor=BORDER, strokeWidth=0.9, strokeDashArray=[3, 2]))

    # Rotated square vertices (22.5 deg CCW)
    th = math.radians(22.5)
    c, s = math.cos(th), math.sin(th)
    half = 24.0
    local_corners = [(-half, -half), (half, -half), (half, half), (-half, half)]
    pts = []
    for lx, ly in local_corners:
        rx = cx + lx * c - ly * s
        ry = cy + lx * s + ly * c
        pts.extend([rx, ry])
    d.add(Polygon(pts, fillColor=BG_CARD, strokeColor=BLUE_DARK, strokeWidth=1.8))

    # Principal direction dashed axis
    d.add(Line(cx - 44 * c, cy - 44 * s, cx + 62 * c, cy + 62 * s, strokeColor=EMERALD, strokeWidth=1.2, strokeDashArray=[4, 2]))
    # Angle arc from 0 to 22.5 deg
    arc_pts = [cx + 42 * math.cos(math.radians(a)) for a in range(0, 24, 3)]
    arc_ys = [cy + 42 * math.sin(math.radians(a)) for a in range(0, 24, 3)]
    for i in range(len(arc_pts) - 1):
        d.add(Line(arc_pts[i], arc_ys[i], arc_pts[i + 1], arc_ys[i + 1], strokeColor=AMBER, strokeWidth=1.5))
    d.add(String(144, 102, "θp = 22.5°", fontName=BODY_BOLD, fontSize=7.0, fillColor=AMBER))

    # Outgoing sigma1 = 92.4 MPa tensile arrows on +n / -n faces
    draw_arrow(d, cx + half * c, cy + half * s, cx + (half + 24) * c, cy + (half + 24) * s, stroke_color=EMERALD, width=1.6, head=4.5)
    draw_arrow(d, cx - half * c, cy - half * s, cx - (half + 24) * c, cy - (half + 24) * s, stroke_color=EMERALD, width=1.6, head=4.5)
    d.add(String(cx + (half + 24) * c + 2, cy + (half + 24) * s + 7, "σ1 = 92.4 MPa", fontName=BODY_BOLD, fontSize=6.8, fillColor=EMERALD, textAnchor="middle"))

    # Outgoing sigma2 = 7.6 MPa arrows on perpendicular faces
    draw_arrow(d, cx - half * s, cy + half * c, cx - (half + 14) * s, cy + (half + 14) * c, stroke_color=BLUE, width=1.4, head=4.0)
    draw_arrow(d, cx + half * s, cy - half * c, cx + (half + 14) * s, cy - (half + 14) * c, stroke_color=BLUE, width=1.4, head=4.0)
    d.add(String(cx - (half + 18) * s - 4, cy + (half + 18) * c + 5, "σ2 = 7.6", fontName=BODY_BOLD, fontSize=6.8, fillColor=BLUE_DARK, textAnchor="middle"))

    d.add(String(103, 17, "Zero shear (τ = 0) on principal faces", fontName=BODY_FONT, fontSize=6.8, fillColor=SLATE, textAnchor="middle"))

    # Center bridge arrow (theta -> 2*theta)
    draw_arrow(d, 202, 98, 240, 98, stroke_color=CRIMSON, width=1.8, head=5.5)
    d.add(String(221, 108, "Angle", fontName=BODY_BOLD, fontSize=7.2, fillColor=NAVY, textAnchor="middle"))
    d.add(String(221, 84, "Doubles (2θ)", fontName=BODY_BOLD, fontSize=7.2, fillColor=CRIMSON, textAnchor="middle"))

    # Right panel: Mohr's circle (sx=80, sy=20, txy=30 -> C=50, R=42.43)
    d.add(Rect(244, 8, 272, 188, rx=4, ry=4, fillColor=colors.white, strokeColor=BORDER, strokeWidth=0.7))
    d.add(String(380, 182, "Mohr's Circle Radar: [σx=80, σy=20, τxy=30 MPa]", fontName=BODY_BOLD, fontSize=8.0, fillColor=NAVY, textAnchor="middle"))

    ox, oy = 282.0, 96.0
    sc = 1.50  # pixels per MPa -> C=50 at 357.0, R=42.43 -> 63.6 px
    c_px = ox + 50.0 * sc
    r_px = 42.4264 * sc

    # Axes
    draw_arrow(d, 256, oy, 504, oy, stroke_color=SLATE, width=1.0, head=4.0)
    draw_arrow(d, ox, 24, ox, 168, stroke_color=SLATE, width=1.0, head=4.0)
    d.add(String(506, oy - 3, "σ", fontName=BODY_BOLD, fontSize=8.0, fillColor=SLATE))
    d.add(String(ox + 5, 164, "+τ", fontName=BODY_BOLD, fontSize=7.5, fillColor=SLATE))

    # Circle
    d.add(Circle(c_px, oy, r_px, fillColor=colors.HexColor("#F0FDF4"), strokeColor=EMERALD, strokeWidth=1.8))

    # Diameter line Y(20,-30) -- C -- X(80,30)
    xx, xy = ox + 80.0 * sc, oy + 30.0 * sc
    yx, yy = ox + 20.0 * sc, oy - 30.0 * sc
    d.add(Line(yx, yy, xx, xy, strokeColor=CRIMSON, strokeWidth=1.4))
    d.add(Circle(xx, xy, 3.2, fillColor=CRIMSON, strokeColor=CRIMSON))
    d.add(Circle(yx, yy, 3.2, fillColor=CRIMSON, strokeColor=CRIMSON))
    d.add(String(xx + 5, xy + 3, "X(80, +30)", fontName=BODY_BOLD, fontSize=6.8, fillColor=CRIMSON))
    d.add(String(yx - 4, yy - 11, "Y(20, -30)", fontName=BODY_BOLD, fontSize=6.8, fillColor=CRIMSON, textAnchor="middle"))

    # Center C
    d.add(Circle(c_px, oy, 2.8, fillColor=NAVY, strokeColor=NAVY))
    d.add(String(c_px, oy - 11, "C(50,0)", fontName=BODY_BOLD, fontSize=6.8, fillColor=NAVY, textAnchor="middle"))

    # Principal poles s1=92.43, s2=7.57 & Shear pole at top
    s1_px = ox + 92.4264 * sc
    s2_px = ox + 7.5736 * sc
    d.add(Circle(s1_px, oy, 3.6, fillColor=EMERALD, strokeColor=NAVY))
    d.add(String(s1_px + 6, oy + 5, "σ1=92.4", fontName=BODY_BOLD, fontSize=7.0, fillColor=EMERALD))
    d.add(Circle(s2_px, oy, 3.2, fillColor=BLUE, strokeColor=NAVY))
    d.add(String(s2_px + 4, oy + 6, "σ2=7.6", fontName=BODY_FONT, fontSize=6.5, fillColor=BLUE_DARK))

    # Place top shear label cleanly ABOVE circle stroke (no overlap!)
    d.add(Circle(c_px, oy + r_px, 3.2, fillColor=AMBER, strokeColor=NAVY))
    d.add(String(c_px, oy + r_px + 7, "τmax = 42.4 (θs = 67.5°)", fontName=BODY_BOLD, fontSize=6.8, fillColor=AMBER, textAnchor="middle"))
    d.add(Circle(c_px, oy - r_px, 3.0, fillColor=AMBER, strokeColor=NAVY))

    # 2*theta_p = 45 deg sweep arc from C->X (45 deg) down to C->sigma1 (0 deg)
    arc_r = 25.0
    for a in range(0, 45, 5):
        a1 = math.radians(a)
        a2 = math.radians(a + 5)
        d.add(Line(c_px + arc_r * math.cos(a1), oy + arc_r * math.sin(a1), c_px + arc_r * math.cos(a2), oy + arc_r * math.sin(a2), strokeColor=AMBER, strokeWidth=1.8))
    d.add(Line(c_px, oy, s1_px, oy, strokeColor=EMERALD, strokeWidth=1.8))
    d.add(String(c_px + 33, oy + 10, "2θp=45°", fontName=BODY_BOLD, fontSize=6.8, fillColor=AMBER))
    d.add(String(380, 15, "Clicking anywhere on Mohr Radar maps 2θ back to crank angle θ", fontName=BODY_FONT, fontSize=6.6, fillColor=SLATE, textAnchor="middle"))

    return d


def styled_table(data, col_widths, zebra=True, header_bg=NAVY, pad_v=3.0, pad_h=5):
    t = Table(data, colWidths=col_widths, repeatRows=1)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), pad_v),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad_v),
        ("LEFTPADDING", (0, 0), (-1, -1), pad_h),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad_h),
    ]
    if zebra:
        cmds.append(("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]))
    t.setStyle(TableStyle(cmds))
    return t


def callout_box(html_text, bg=BG_CARD, border=BLUE, width=524):
    style = ParagraphStyle(
        name="CalloutInner",
        fontName=BODY_FONT,
        fontSize=8.4,
        leading=12.0,
        textColor=TEXT,
    )
    t = Table([[Paragraph(html_text, style)]], colWidths=[width])
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 1.1, border),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    return KeepTogether([t])


def build_pdf(filename="Stress_Zombie_Apocalypse_Professor_Report.pdf"):
    register_fonts()

    # Letter width = 612 pt; 44 pt left/right margins -> 524 pt usable width
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=44,
        rightMargin=44,
        topMargin=46,
        bottomMargin=44,
        title="Stress Zombie Apocalypse (v4.7) - Professor Project Report",
        author="Stress Zombie Apocalypse Engineering Education Project",
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("BannerTitle", fontName=BODY_BOLD, fontSize=18, leading=22, textColor=colors.white, spaceAfter=2))
    styles.add(ParagraphStyle("BannerSub", fontName=BODY_BOLD, fontSize=9.5, leading=13, textColor=colors.HexColor("#7DD3FC"), spaceAfter=4))
    styles.add(ParagraphStyle("BannerMeta", fontName=BODY_FONT, fontSize=8.0, leading=11.5, textColor=colors.HexColor("#E2E8F0")))
    styles.add(ParagraphStyle("SecHead", fontName=BODY_BOLD, fontSize=11.2, leading=14.5, textColor=NAVY, spaceBefore=7, spaceAfter=3.5, keepWithNext=True))
    styles.add(ParagraphStyle("SubHead", fontName=BODY_BOLD, fontSize=9.3, leading=12.5, textColor=BLUE_DARK, spaceBefore=6, spaceAfter=2, keepWithNext=True))
    styles.add(ParagraphStyle("Body", fontName=BODY_FONT, fontSize=8.3, leading=11.5, textColor=TEXT, spaceAfter=4))
    styles.add(ParagraphStyle("TH", fontName=BODY_BOLD, fontSize=7.5, leading=9.8, textColor=colors.white))
    styles.add(ParagraphStyle("TD", fontName=BODY_FONT, fontSize=7.4, leading=9.9, textColor=TEXT))
    styles.add(ParagraphStyle("TDBold", fontName=BODY_BOLD, fontSize=7.4, leading=9.9, textColor=NAVY))
    styles.add(ParagraphStyle("TDCenter", fontName=BODY_BOLD, fontSize=7.4, leading=9.9, textColor=EMERALD, alignment=1))
    styles.add(ParagraphStyle("Formula", fontName=MONO_BOLD, fontSize=7.5, leading=10.3, textColor=NAVY))
    styles.add(ParagraphStyle("Caption", fontName=BODY_ITALIC, fontSize=7.2, leading=9.8, textColor=MUTED, alignment=1, spaceBefore=2, spaceAfter=4))

    story = []

    # =========================================================================
    # PAGE 1: ACADEMIC TITLE BANNER, PROJECT PREMISE, PEDAGOGY & TARGET USERS
    # =========================================================================
    banner = Table(
        [
            [Paragraph("STRESS ZOMBIE APOCALYPSE (v4.7)", styles["BannerTitle"])],
            [
                Paragraph(
                    "Interactive 2D Stress/Strain Transformation, Mohr's Circle &amp; Failure Theory Simulation Engine",
                    styles["BannerSub"],
                )
            ],
            [
                Paragraph(
                    "<b>Course Alignment:</b> Mechanics of Solids (Plane Stress &amp; Strain, Mohr's Circle 2θ, Generalized Hooke's Law, Strain Energy &amp; Failure Criteria)<br/>"
                    "<b>Runtime Stack:</b> HTML5 Canvas (5 Canvases) + Vanilla ES6 JavaScript (6 Modules) + Procedural Web Audio + Python 3 HTTP Server<br/>"
                    "<b>Codebase &amp; Verification:</b> 12,047 source lines across 10 files • 11/11 analytical unit tests passing • Zero external dependencies",
                    styles["BannerMeta"],
                )
            ],
        ],
        colWidths=[524],
    )
    banner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NAVY),
                ("TOPPADDING", (0, 0), (-1, 0), 11),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
                ("TOPPADDING", (0, 1), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, 1), 2),
                ("LEFTPADDING", (0, 0), (-1, -1), 13),
                ("RIGHTPADDING", (0, 0), (-1, -1), 13),
                ("LINEBELOW", (0, -1), (-1, -1), 3.0, BLUE),
            ]
        )
    )
    story.append(banner)
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. What the Game Is About: Executive Summary &amp; Problem Statement", styles["SecHead"]))
    story.append(
        Paragraph(
            "<i>Stress Zombie Apocalypse</i> is a browser-based serious engineering game designed to turn abstract 2D continuum mechanics "
            "equations into real-time visual and tactile mastery. In the game scenario, biomechanically altered zombies advance across a "
            "quarantined horror highway toward the player's defense barricade. Each enemy is structurally bound by an internal <b>2D Cauchy plane stress tensor</b> "
            "(normal stresses <b>σ<sub>x</sub></b>, <b>σ<sub>y</sub></b> and shear stress <b>τ<sub>xy</sub></b> in MPa), displayed continuously via a live floating stress cube over its head.",
            styles["Body"],
        )
    )
    story.append(
        Paragraph(
            "Unlike conventional arcade shooters where random firing works, <b>conventional gunfire cannot hurt any enemy off-axis</b>. "
            "The player commands a barricade-mounted <b>7.62mm Heavy Machine Gun</b> equipped with a rotating breech handling crank (angle <b>θ</b> from 0° to 180°). "
            "Its safety interlock physically prevents gunfire unless the player aligns θ with the enemy's true material failure plane—either the "
            "<b>Rankine maximum principal stress plane (θ<sub>p</sub>)</b>, the <b>Tresca maximum in-plane shear plane (θ<sub>s</sub> = θ<sub>p</sub> ± 45°)</b>, "
            "or the <b>von Mises distortion-energy plane</b>.",
            styles["Body"],
        )
    )

    story.append(
        callout_box(
            "<b>Key Pedagogical Breakthrough — Overcoming the 2θ Confusion:</b><br/>"
            "First-time Mechanics of Solids students consistently struggle to connect a physical cut rotation <b>θ</b> with its doubled angle <b>2θ</b> "
            "on Mohr's Circle. Here, rotating the gun breech crank by <b>θ</b> sweeps the live transformed stress vector <b>P(σ<sub>θ</sub>, τ<sub>θ</sub>)</b> "
            "clockwise around Mohr's Circle by exactly <b>2θ</b> (since stress equations depend on cos 2θ and sin 2θ). "
            "Players can even <b>click or drag directly anywhere on Mohr's Circle</b>, and the engine inversely solves the exact physical crank angle θ in real time."
        )
    )
    story.append(Spacer(1, 6))

    story.append(Paragraph("2. Core Educational Features &amp; Classroom Value", styles["SecHead"]))
    features_table = styled_table(
        [
            [Paragraph("Feature Pillar", styles["TH"]), Paragraph("Engineering Mechanism &amp; How Students Learn From It", styles["TH"])],
            [
                Paragraph("<b>Live Breech Crank<br/>Safety Interlock</b>", styles["TDBold"]),
                Paragraph(
                    "Gun only transitions from crimson <b>LOCKED</b> to green <b>ARMED</b> inside ±7.5° of the analytical failure plane. Off-angle "
                    "shots cannot spray bullets randomly; HUD guides students (e.g., <i>TURN [D] -> 22.5°</i>) until bonds yield.",
                    styles["TD"],
                ),
            ],
            [
                Paragraph("<b>Guided Tutorial<br/>Before Level 1</b>", styles["TDBold"]),
                Paragraph(
                    "A non-lethal 4-drill training mission teaches: (1) waiting for on-screen visibility, (2) 2θ shear plane rotation (22.5°), "
                    "(3) switching from brittle σ<sub>1</sub> to ductile τ<sub>max</sub> (67.5°), and (4) using Hydrostatic Pressure [5] to wipe τ = 0.",
                    styles["TD"],
                ),
            ],
            [
                Paragraph("<b>Every-Zombie Kill<br/>Reports &amp; Lab</b>", styles["TDBold"]),
                Paragraph(
                    "Every single kill pops a 4.5s non-blocking Live Telemetry Card AND records a permanent full-tensor Stress &amp; Strain Autopsy "
                    "(Mohr C/R, Hooke's Law ε<sub>x</sub>, ε<sub>y</sub>, ε<sub>z</sub>, γ<sub>xy</sub>, dilatation e, strain energy u<sub>v</sub>/u<sub>d</sub>) inspectable interactively after every wave.",
                    styles["TD"],
                ),
            ],
            [
                Paragraph("<b>Instructor Study Lab<br/>Sandbox</b>", styles["TDBold"]),
                Paragraph(
                    "Accessible anytime without combat: instructors or students adjust sliders for σ<sub>x</sub>, σ<sub>y</sub>, τ<sub>xy</sub>, and θ, load lecture presets "
                    "(or slain zombies), and project step-by-step derivations + deformed strain squares live in class.",
                    styles["TD"],
                ),
            ],
        ],
        [118, 406],
    )
    story.append(features_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("3. Target Users &amp; Syllabus Coverage", styles["SecHead"]))
    users_table = styled_table(
        [
            [Paragraph("Audience Group", styles["TH"]), Paragraph("Syllabus Modules Covered", styles["TH"]), Paragraph("Academic Use Case", styles["TH"])],
            [
                Paragraph("<b>Undergraduate Engineering Students</b><br/>(Mech, Civil, Aero, Materials)", styles["TDBold"]),
                Paragraph("Plane Stress Transformation, Principal Planes, Invariants I<sub>1</sub>/I<sub>2</sub>, Hooke's Law, Rankine/Tresca/von Mises", styles["TD"]),
                Paragraph("Bridges textbook derivations with instant spatial cause-and-effect during guided levels and tutorial drills.", styles["TD"]),
            ],
            [
                Paragraph("<b>Faculty &amp; Teaching Assistants</b>", styles["TDBold"]),
                Paragraph("Mohr's Circle Construction, Hydrostatic/Deviatoric Decomposition, Strain Energy", styles["TD"]),
                Paragraph("Zero-install classroom projector demo via Chrome; inspect every zombie's live Mohr circle and deformed element.", styles["TD"]),
            ],
            [
                Paragraph("<b>Competitive Exam Prep</b><br/>(GATE ME/CE, FE, ESE)", styles["TDBold"]),
                Paragraph("Rapid determination of C, R, θ<sub>p</sub>, θ<sub>s</sub>, and fracture criteria identification", styles["TD"]),
                Paragraph("Builds rapid geometric intuition for clockwise 2θ rotations and normal vs. shear failure recognition.", styles["TD"]),
            ],
        ],
        [134, 178, 212],
    )
    story.append(users_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: ARCHITECTURE, CODEBASE INVENTORY & APPLICATION LIFECYCLE
    # =========================================================================
    story.append(Paragraph("4. System Architecture &amp; Complete Screen Flow", styles["SecHead"]))
    story.append(
        Paragraph(
            "The application separates analytical physics, canvas rendering, procedural audio, and wave state into decoupled ES6 modules. "
            "Zero external NPM packages, WebGL engines, or external image/audio files are used:",
            styles["Body"],
        )
    )
    story.append(KeepTogether([build_architecture_diagram(), Paragraph("Figure 1: Modular Software Architecture (top) and User Navigation Flow from Intro Splash through Forensic Reporting (bottom).", styles["Caption"])]))

    story.append(Paragraph("5. Codebase File-by-File Breakdown (Total: 12,047 Lines)", styles["SecHead"]))
    files_table = styled_table(
        [
            [Paragraph("File", styles["TH"]), Paragraph("Size / Lines", styles["TH"]), Paragraph("Core Symbols", styles["TH"]), Paragraph("Runtime Responsibility", styles["TH"])],
            [Paragraph(inline_code("index.html"), styles["TD"]), Paragraph("823 ln / 41 KB", styles["TD"]), Paragraph("5 Canvases, 6 Modals", styles["TD"]), Paragraph("Battlefield (840×480), crank dial (130×130), Mohr radar (280×280), stress graph (280×110), intro/welcome overlays, tutorial bar, reports &amp; Lab.", styles["TD"])],
            [Paragraph(inline_code("styles.css"), styles["TD"]), Paragraph("2,768 ln / 64 KB", styles["TD"]), Paragraph("HUD &amp; Modal Themes", styles["TD"]), Paragraph("Responsive tactical deck layout, horror splash lighting, floating kill card, level map cards, and energy partitioning bars.", styles["TD"])],
            [Paragraph(inline_code("js/mechanics.js"), styles["TD"]), Paragraph("508 ln / 22 KB", styles["TD"]), Paragraph(inline_code("StressMechanics"), styles["TD"]), Paragraph("Pure analytical solver: transform, Mohr C/R/σ<sub>1</sub>/σ<sub>2</sub>/θ<sub>p</sub>/θ<sub>s</sub>, invariants, Rankine/Tresca/von Mises evaluator, Hooke strains, dilatation &amp; autopsies.", styles["TD"])],
            [Paragraph(inline_code("js/game.js"), styles["TD"]), Paragraph("4,063 ln / 168 KB", styles["TD"]), Paragraph(inline_code("GameEngine"), styles["TD"]), Paragraph("Master orchestrator: 10s intro splash, welcome screen, 4-drill tutorial, 10-sector wave factory, 60 FPS loop, visibility gate, bursts, horror cache &amp; reports.", styles["TD"])],
            [Paragraph(inline_code("js/hud.js"), styles["TD"]), Paragraph("703 ln / 27 KB", styles["TD"]), Paragraph(inline_code("TacticalHUD"), styles["TD"]), Paragraph("Syncs gun crank θ, draws rotating breech lever, renders live 2θ Mohr's Circle with pointer inverse-aiming, and plots σ<sub>θ</sub> / |τ<sub>θ</sub>| curves (0°–180°).", styles["TD"])],
            [Paragraph(inline_code("js/zombies.js"), styles["TD"]), Paragraph("1,119 ln / 41 KB", styles["TD"]), Paragraph(inline_code("Zombie"), styles["TD"]), Paragraph("Entity movement, hydro quench, shapeshifter 240f mutation, boss 3-phase shifts, comic-horror art, θ-plane cleavage animation &amp; floating stress cube.", styles["TD"])],
            [Paragraph(inline_code("js/study.js"), styles["TD"]), Paragraph("462 ln / 20 KB", styles["TD"]), Paragraph(inline_code("StudyLab"), styles["TD"]), Paragraph("Reusable forensic analyzer rendering interactive Mohr's Circle, deformed/undeformed rotated stress-strain square, slain presets &amp; derivations.", styles["TD"])],
            [Paragraph(inline_code("js/audio.js"), styles["TD"]), Paragraph("1,239 ln / 47 KB", styles["TD"]), Paragraph(inline_code("SoundController"), styles["TD"]), Paragraph("Procedural Web Audio synthesizer: 7.62mm bursts, trigger clicks, deflections, Hydro-Jet wash, boss alarms, 74–96 BPM BGM &amp; 4-layer Zombie Roar.", styles["TD"])],
            [Paragraph(inline_code("run_game.py"), styles["TD"]), Paragraph("86 ln / 2.8 KB", styles["TD"]), Paragraph(inline_code("CustomHandler"), styles["TD"]), Paragraph("Multi-threaded HTTP server (port 8000, no-cache headers) detecting LAN IP for instant Chrome play.", styles["TD"])],
            [Paragraph(inline_code("test_mechanics.py"), styles["TD"]), Paragraph("276 ln / 11.7 KB", styles["TD"]), Paragraph(inline_code("TestStressMechanics"), styles["TD"]), Paragraph("Python unittest suite running 11 analytical checks against textbook benchmarks (invariants, strains, energies, criteria).", styles["TD"])],
        ],
        [80, 62, 92, 290],
        pad_v=1.9,
        pad_h=4,
    )
    story.append(files_table)

    story.append(Paragraph("6. Startup &amp; Navigation Flow (Launch -&gt; Campaign Progression)", styles["SecHead"]))
    story.append(
        Paragraph(
            "<b>1. 10-Second Animated Entry Splash:</b> On load, "
            f"{inline_code('initIntroSplash()')} plays a full-viewport canvas showcase for {inline_code('10,000 ms')} featuring 5 animated zombies creeping through grave mist, cratered moon, lightning flashes (1.85s–9.05s), bats, and a faint rotating Mohr crest. Pressing <b>[SPACE]</b>, <b>[ENTER]</b>, <b>[ESC]</b>, or clicking advances immediately.<br/>"
            "<b>2. Streamlined Welcome Screen:</b> Shows the 3-step rules, live 6-bar equalizer Horror Zombie Call test, Quick Guide, Study Lab, <b>PLAY TUTORIAL</b>, and <b>START CAMPAIGN [SPACE]</b>.<br/>"
            "<b>3. Campaign Level Map &amp; Persistence:</b> Stores highest unlocked level, star ratings, and high scores in browser "
            f"{inline_code('localStorage')}. The tutorial stays accessible above Level 1; sectors unlock sequentially as waves are cleared.",
            styles["Body"],
        )
    )

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: TUTORIAL DRILLS, 60 FPS EXECUTION LOOP & CONTROLS
    # =========================================================================
    story.append(Paragraph("7. Guided Pre-Level-1 Tutorial (4 Non-Lethal Drills)", styles["SecHead"]))
    story.append(
        Paragraph(
            "Calling " + inline_code("startTutorial()") + " resets temporary score/streak, starts the gun crank at 45° so the student actively practices rotating θ, "
            "displays the live 4-step coaching bar (" + inline_code("#tutorialCoachBar") + "), and pauses approaching practice zombies safely at x = 270 px so the barricade is never breached:",
            styles["Body"],
        )
    )
    tut_table = styled_table(
        [
            [Paragraph("Drill", styles["TH"]), Paragraph("Target Dummy &amp; Tensor", styles["TH"]), Paragraph("Failure Mode", styles["TH"]), Paragraph("Lesson Taught", styles["TH"])],
            [Paragraph("<b>Drill 1:<br/>Aim &amp; Gate</b>", styles["TDBold"]), Paragraph("Brittle Dummy (60 HP)<br/>[σ<sub>x</sub>=80, σ<sub>y</sub>=0, τ<sub>xy</sub>=0]", styles["TD"]), Paragraph("Cyan • Rankine<br/>Opt θ<sub>p</sub> = 0.0°", styles["TD"]), Paragraph("Wait-for-zombie visibility gate, then turn [A]/[D] from 45° back to 0° (2θ = 0°) until gun turns green <b>ARMED</b>.", styles["TD"])],
            [Paragraph("<b>Drill 2:<br/>Shear 2θ</b>", styles["TDBold"]), Paragraph("Sheared Dummy (80 HP)<br/>[σ<sub>x</sub>=80, σ<sub>y</sub>=20, τ<sub>xy</sub>=30]", styles["TD"]), Paragraph("Cyan • Rankine<br/>Opt θ<sub>p</sub> = 22.5°", styles["TD"]), Paragraph("Non-zero shear tilts the principal failure plane! Students verify physical 22.5° equals Mohr circle 2θ = 45°.", styles["TD"])],
            [Paragraph("<b>Drill 3:<br/>Ductile τ<sub>max</sub></b>", styles["TDBold"]), Paragraph("Ductile Armor (90 HP)<br/>[σ<sub>x</sub>=80, σ<sub>y</sub>=20, τ<sub>xy</sub>=30]", styles["TD"]), Paragraph("Orange • Tresca<br/>Opt θ<sub>s</sub> = 67.5°", styles["TD"]), Paragraph("Identical tensor as Drill 2, but Ductile armor resists tensile σ<sub>1</sub>. Player pivots 45° on crank (90° on Mohr) to peak shear τ<sub>max</sub>.", styles["TD"])],
            [Paragraph("<b>Drill 4:<br/>Hydro [5]</b>", styles["TDBold"]), Paragraph("Quench Target (100 HP)<br/>[σ<sub>x</sub>=90, σ<sub>y</sub>=30, τ<sub>xy</sub>=45]", styles["TD"]), Paragraph("Orange -> [5] Hydro<br/>Quenched θ<sub>p</sub> = 0.0°", styles["TD"]), Paragraph("Pressing [5] Hydro-Jet blasts hydrostatic pressure, setting τ<sub>xy</sub> = 0 and turning orange armor into cyan brittle glass.", styles["TD"])],
        ],
        [72, 134, 96, 222],
    )
    story.append(tut_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("8. How the Game Runs Frame-by-Frame (60 FPS Main Loop)", styles["SecHead"]))
    story.append(
        Paragraph(
            "Every browser animation frame (~16.67 ms), " + inline_code("mainLoop()") + " executes " + inline_code("GameEngine.update()") + " followed by " + inline_code("GameEngine.draw()") + ":",
            styles["Body"],
        )
    )
    loop_steps = styled_table(
        [
            [Paragraph("Step", styles["TH"]), Paragraph("Engine Routine", styles["TH"]), Paragraph("Exact Execution Logic", styles["TH"])],
            [Paragraph("<b>1. Pause Guard</b>", styles["TDBold"]), Paragraph(inline_code("update()"), styles["TD"]), Paragraph("Aborts physics immediately if state ≠ playing or if any modal overlay (Welcome, Map, Guide, Lab, Report, Game Over) is open.", styles["TD"])],
            [Paragraph("<b>2. Time &amp; FX</b>", styles["TDBold"]), Paragraph(inline_code("slowmo / shake"), styles["TD"]), Paragraph("Decays screenShake (×0.88/frame); sets timeSlowFactor = 0.2 if Slow-Mo [1] is active; decrements active power-up timers.", styles["TD"])],
            [Paragraph("<b>3. Wave Spawn</b>", styles["TDBold"]), Paragraph(inline_code("spawnNextZombie()"), styles["TD"]), Paragraph("Releases queued enemies from x ≈ 848–904 px (interval 55 frames if arena empty, 105 frames between staggered spawns; tutorial waits cleanly).", styles["TD"])],
            [Paragraph("<b>4. Zombie Tick</b>", styles["TDBold"]), Paragraph(inline_code("z.update(factor)"), styles["TD"]), Paragraph("Advances left at speed × factor (0.5× if hydro-soaked); ticks Shapeshifter 240-frame phase flip; checks Boss phase thresholds (66%, 33% HP).", styles["TD"])],
            [Paragraph("<b>5. Barricade Check</b>", styles["TDBold"]), Paragraph(inline_code("x <= 130"), styles["TD"]), Paragraph("If Shield [4] active: knocks attacker back to x = 240 with cyan sparks. Otherwise: barricade loses 15% HP, resets streak, and checks Game Over (HP ≤ 0).", styles["TD"])],
            [Paragraph("<b>6. Radar Sync</b>", styles["TDBold"]), Paragraph(inline_code("getPrimaryTarget()"), styles["TD"]), Paragraph("Selects closest visible zombie (x ≤ width − inset) and updates TacticalHUD dial arc, Mohr's circle (2θ), and transformation graph live.", styles["TD"])],
            [Paragraph("<b>7. Burst Queue</b>", styles["TDBold"]), Paragraph(inline_code("isFiringHeld / projectiles"), styles["TD"]), Paragraph("While [SPACE] is held &amp; crank remains armed, auto-fires bursts on cooldown; integrates tracer velocities (44 px/f) and bouncing brass casings (g = +0.36 px/f²).", styles["TD"])],
            [Paragraph("<b>8. Clear Check</b>", styles["TDBold"]), Paragraph(inline_code("levelCleared()"), styles["TD"]), Paragraph("When zombies.length === 0 and queue empty: saves stars/high score, unlocks next sector, and opens the Every-Zombie Forensic Report modal.", styles["TD"])],
            [Paragraph("<b>9. Layered Render</b>", styles["TDBold"]), Paragraph(inline_code("draw()"), styles["TD"]), Paragraph("Blits cached offscreen horror scenery (&lt;0.1 ms), draws mist/bats/rain/lamps, renders steel barricade &amp; turret breech wheel, zombies, aim reticle, tracers, and HUD.", styles["TD"])],
        ],
        [72, 102, 350],
        pad_v=2.5,
    )
    story.append(loop_steps)
    story.append(Spacer(1, 6))

    story.append(Paragraph("9. Complete Player Controls &amp; Inverse Mohr Aiming", styles["SecHead"]))
    ctrl_table = styled_table(
        [
            [Paragraph("Input Method", styles["TH"]), Paragraph("Action &amp; Granularity", styles["TH"]), Paragraph("Mathematical &amp; UX Effect", styles["TH"])],
            [Paragraph("<b>[A] / [←]  &amp;  [D] / [→]</b>", styles["TDBold"]), Paragraph("Rotate Crank ±2° (Hold Shift: ±10°)", styles["TD"]), Paragraph("Changes physical plane orientation θ in [0°, 180°); counter-clockwise +θ follows standard Mechanics convention.", styles["TD"])],
            [Paragraph("<b>Rotary Crank Dial / Slider / Snap</b>", styles["TDBold"]), Paragraph("Drag 360° Wheel or Snap (0°, 22.5°, 45°, 67.5°, 90°, 135°, ±1°, ±5°)", styles["TD"]), Paragraph("Instant keyboard-free alignment on desktop or touch screens; slider synchronizes at 0.5° resolution.", styles["TD"])],
            [Paragraph("<b>Click/Drag Mohr's Circle</b>", styles["TDBold"]), Paragraph("Direct Interactive Radar Aiming", styles["TD"]), Paragraph("Computes pointer angle φ<sub>P</sub> = atan2(dy, dx) around Center C, references φ<sub>X</sub> = atan2(τ<sub>xy</sub>, (σ<sub>x</sub>−σ<sub>y</sub>)/2), and solves θ = ((φ<sub>X</sub> − φ<sub>P</sub>)·180°)/(2π) mod 180°.", styles["TD"])],
            [Paragraph("<b>[SPACE] or FIRE GUN</b>", styles["TDBold"]), Paragraph("Trigger / Hold Auto-Burst", styles["TD"]), Paragraph("Requests burst from Heavy Machine Gun; fires 4 staggered tracer rounds if zombie visible &amp; aligned (|Δθ| ≤ 7.5°), else clicks trigger safety lock.", styles["TD"])],
            [Paragraph("<b>Keys [1] through [5]</b>", styles["TDBold"]), Paragraph("Tactical Engineering Power-Ups", styles["TD"]), Paragraph("Slow-Mo [1], Hint Arc [2], Radar Scan [3], I<sub>1</sub> Shield [4], Hydro-Jet Quench [5] (detailed on Page 4).", styles["TD"])],
        ],
        [124, 152, 248],
        pad_v=2.5,
    )
    story.append(ctrl_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: GUN SAFETY INTERLOCK, BALLISTICS & POWER-UPS
    # =========================================================================
    story.append(Paragraph("10. Gun Visibility Gate, Mechanical Interlock &amp; Machine Gun Ballistics", styles["SecHead"]))
    story.append(
        Paragraph(
            "Version <b>v4.7</b> replaces arcade lasers and cluttered difficulty presets (Easy/Medium/Hard/Nightmare removed) with authentic, "
            "unified physics-gated heavy machine gun mechanics:",
            styles["Body"],
        )
    )
    story.append(KeepTogether([build_combat_pipeline_diagram(), Paragraph("Figure 2: Strict 4-stage firing pipeline ensuring every fired bullet corresponds to an aligned solid mechanics solution.", styles["Caption"])]))

    story.append(
        Paragraph(
            "<b>• Wait-for-Zombie Visibility Gate (" + inline_code("isZombieVisibleOnScreen") + "):</b> Spawned zombies begin just outside the right border (x ≥ 848 px on an 840 px canvas). "
            "Until an enemy's body enters " + inline_code("x ≤ width - max(18, round(0.34 * z.width))") + ", the turret tag reads <b>WAIT</b>, the firing button disables firing with an audible trigger lock click, and no ammo or bursts occur.<br/>"
            "<b>• Turret Breech Handling Crank &amp; Safety Interlock (" + inline_code("drawTurretAndGun") + "):</b> "
            "A circular machined crank wheel on the 7.62mm receiver rotates live with " + inline_code("dialAngle") + ", carrying a dotted green optimal plane line whenever a zombie is visible. "
            "Using " + inline_code("StressMechanics.evaluateAttack()") + ", angular error " + inline_code("angDiff = angleDiff180(θ, θ_opt)") + " governs authorization:<br/>"
            "&nbsp;&nbsp;&nbsp;1. <b>LOCKED (angDiff &gt; 7.5°, or &gt; 8.5° on Titan Boss):</b> Receiver LED glows crimson, handle jitters, trigger clicks harmlessly, streak resets on manual pull, and <b>0 damage</b> is dealt (firing aborts cleanly before any round leaves the chamber).<br/>"
            "&nbsp;&nbsp;&nbsp;2. <b>ARMED (angDiff ≤ 7.5°):</b> Reticle, crank grip, and LED blaze green. Fires a 4-round 7.62mm tracer burst (velocity 44 px/frame, 2-frame stagger) with multi-cone muzzle flash, 6.5–9 px barrel recoil, and spinning brass shell casings bouncing off the asphalt.<br/>"
            "&nbsp;&nbsp;&nbsp;3. <b>CRITICAL HIT (angDiff ≤ 2.5°, or ≤ 3.0° on Boss):</b> Applies a <b>1.5× damage multiplier</b> (up to ~210 dmg), golden tracer trails, heavier camera shake, and a <b>3.0× accuracy score multiplier</b> scaled further by streak bonus " + inline_code("× (1 + 0.1·streak)") + ". On fatal hit, the zombie's torso physically separates and slides along cut angle θ!",
            styles["Body"],
        )
    )

    story.append(Paragraph("11. Tactical Power-Ups [1–5] &amp; Continuum Mechanics Principles", styles["SecHead"]))
    pw_table = styled_table(
        [
            [Paragraph("Key &amp; Name", styles["TH"]), Paragraph("Charges / Timer", styles["TH"]), Paragraph("Battlefield Effect", styles["TH"]), Paragraph("Physical Solid Mechanics Rationale", styles["TH"])],
            [Paragraph("<b>[1] Slow-Mo</b>", styles["TDBold"]), Paragraph("2 per level<br/>300 frames (5s)", styles["TD"]), Paragraph("Scales enemy speed, phase timers &amp; animation to 20% speed.", styles["TD"]), Paragraph("Gives students quiet calculation time to evaluate tan(2θ<sub>p</sub>) = 2τ<sub>xy</sub> / (σ<sub>x</sub>−σ<sub>y</sub>) or inspect the curve chart.", styles["TD"])],
            [Paragraph("<b>[2] Hint Arc</b>", styles["TDBold"]), Paragraph("3 per level<br/>240 frames (4s)", styles["TD"]), Paragraph("Highlights best angle arc &amp; triggers tactical toast guidance.", styles["TD"]), Paragraph("Connects numerical optimal root θ<sub>p</sub> or θ<sub>s</sub> visually back onto the physical 180° cutting protractor.", styles["TD"])],
            [Paragraph("<b>[3] Scanner</b>", styles["TDBold"]), Paragraph("2 per level<br/>360 frames (6s)", styles["TD"]), Paragraph("Triggers radar diagnostic sweep across active targets.", styles["TD"]), Paragraph("Refreshes full tensor inspection across the stress element and Mohr's Circle plot.", styles["TD"])],
            [Paragraph("<b>[4] I<sub>1</sub> Shield</b>", styles["TDBold"]), Paragraph("1 per level<br/>300 frames (5s)", styles["TD"]), Paragraph("Projects curved cyan energy barrier at x = 145 px; bounces attackers back to x = 240 px.", styles["TD"]), Paragraph("Demonstrates the <b>First Stress Invariant</b>: I<sub>1</sub> = σ<sub>x</sub> + σ<sub>y</sub> = σ<sub>1</sub> + σ<sub>2</sub> = Constant regardless of rotation.", styles["TD"])],
            [Paragraph("<b>[5] Hydro-Jet</b>", styles["TDBold"]), Paragraph("2 per level<br/>60f stream / 360f soak", styles["TD"]), Paragraph("Fires high-pressure water torrent hitting visible zombies; pushes back +80 px &amp; halves walk speed for 6s.", styles["TD"]), Paragraph("<b>Hydrostatic Quenching:</b> Omnidirectional fluid pressure wipes deviatoric shear (<b>τ<sub>xy</sub> → 0</b>), converting Ductile &amp; Shapeshifter targets into Brittle Cyan (Mohr's circle shrinks toward isotropic state; principal plane aligns with x/y axes)!", styles["TD"])],
        ],
        [78, 72, 148, 226],
        pad_v=2.8,
    )
    story.append(pw_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: MATHEMATICAL ENGINE & VECTOR MOHR DIAGRAM
    # =========================================================================
    story.append(Paragraph("12. Analytical Solid Mechanics Engine &amp; Vector Mohr's Circle", styles["SecHead"]))
    story.append(
        Paragraph(
            "Every gameplay calculation, HUD vector, transformation graph, strain readout, and kill report is driven deterministically by "
            f"{inline_code('StressMechanics')} ({inline_code('js/mechanics.js')}). Figure 3 illustrates how a physical plane rotation of "
            "<b>θ<sub>p</sub> = 22.5° counter-clockwise</b> corresponds to sweeping <b>2θ<sub>p</sub> = 45° clockwise</b> from reference face X(σ<sub>x</sub>, +τ<sub>xy</sub>) onto principal stress σ<sub>1</sub> on Mohr's Circle:",
            styles["Body"],
        )
    )
    story.append(KeepTogether([build_mohr_benchmark_diagram(), Paragraph("Figure 3: Vector correspondence between Physical Element rotation θp = 22.5° CCW (left) and Mohr's Circle angle 2θp = 45° CW (right) for [80, 20, 30] MPa.", styles["Caption"])]))

    story.append(Paragraph("13. Complete Suite of Implemented Mechanics Equations (14 Core Relations)", styles["SecHead"]))
    eq_table = styled_table(
        [
            [Paragraph("# &amp; Quantity", styles["TH"]), Paragraph("Implemented Formula (js/mechanics.js)", styles["TH"]), Paragraph("Game / Physical Significance", styles["TH"])],
            [Paragraph("<b>1. Normal Stress σ<sub>θ</sub></b>", styles["TDBold"]), Paragraph("σ<sub>θ</sub> = (σ<sub>x</sub>+σ<sub>y</sub>)/2 + ((σ<sub>x</sub>−σ<sub>y</sub>)/2)·cos(2θ) + τ<sub>xy</sub>·sin(2θ)", styles["Formula"]), Paragraph("Tensile/compressive stress driving Rankine brittle cleavage.", styles["TD"])],
            [Paragraph("<b>2. Shear Stress τ<sub>θ</sub></b>", styles["TDBold"]), Paragraph("τ<sub>θ</sub> = −((σ<sub>x</sub>−σ<sub>y</sub>)/2)·sin(2θ) + τ<sub>xy</sub>·cos(2θ)", styles["Formula"]), Paragraph("In-plane sliding traction driving Tresca ductile slip.", styles["TD"])],
            [Paragraph("<b>3. Orthogonal Stress</b>", styles["TDBold"]), Paragraph("σ<sub>90</sub> = σ<sub>x</sub> + σ<sub>y</sub> − σ<sub>θ</sub>,   τ<sub>90</sub> = −τ<sub>θ</sub>", styles["Formula"]), Paragraph("Complementary stress on perpendicular face θ + 90°.", styles["TD"])],
            [Paragraph("<b>4. Mohr Center C</b>", styles["TDBold"]), Paragraph("C = σ<sub>hydro</sub> = (σ<sub>x</sub> + σ<sub>y</sub>) / 2", styles["Formula"]), Paragraph("Mean / hydrostatic center along horizontal σ-axis.", styles["TD"])],
            [Paragraph("<b>5. Mohr Radius R</b>", styles["TDBold"]), Paragraph("R = τ<sub>max</sub> = √[ ((σ<sub>x</sub> − σ<sub>y</sub>)/2)² + τ<sub>xy</sub>² ]", styles["Formula"]), Paragraph("Equals maximum in-plane shear stress and circle radius.", styles["TD"])],
            [Paragraph("<b>6. Principal Stresses</b>", styles["TDBold"]), Paragraph("σ<sub>1</sub> = C + R (at θ<sub>p</sub>),   σ<sub>2</sub> = C − R (at θ<sub>p</sub> + 90°)", styles["Formula"]), Paragraph("Extremal normal stresses with zero shear traction (τ = 0).", styles["TD"])],
            [Paragraph("<b>7. Principal &amp; Shear θ</b>", styles["TDBold"]), Paragraph("θ<sub>p</sub> = ½ atan2(2τ<sub>xy</sub>, σ<sub>x</sub>−σ<sub>y</sub>) (mod 180°);  θ<sub>s</sub> = θ<sub>p</sub> ± 45°", styles["Formula"]), Paragraph("Checked directly via transform(θ<sub>p1</sub>) so σ<sub>1</sub> vs σ<sub>2</sub> never swaps!", styles["TD"])],
            [Paragraph("<b>8. Stress Invariants</b>", styles["TDBold"]), Paragraph("I<sub>1</sub> = σ<sub>x</sub> + σ<sub>y</sub> = σ<sub>1</sub> + σ<sub>2</sub>;   I<sub>2</sub> = σ<sub>x</sub>σ<sub>y</sub> − τ<sub>xy</sub>² = σ<sub>1</sub>σ<sub>2</sub>", styles["Formula"]), Paragraph("Rotationally invariant scalars; I<sub>1</sub> powers Shield [4].", styles["TD"])],
            [Paragraph("<b>9. von Mises Stress</b>", styles["TDBold"]), Paragraph("σ<sub>vm</sub> = √(σ<sub>x</sub>² − σ<sub>x</sub>σ<sub>y</sub> + σ<sub>y</sub>² + 3τ<sub>xy</sub>²) = √(σ<sub>1</sub>² − σ<sub>1</sub>σ<sub>2</sub> + σ<sub>2</sub>²)", styles["Formula"]), Paragraph("Distortion-energy yield metric governing Wave 9 Titan Boss.", styles["TD"])],
            [Paragraph("<b>10. Hooke's Law (3D)</b>", styles["TDBold"]), Paragraph("ε<sub>x</sub> = (σ<sub>x</sub>−νσ<sub>y</sub>)/E,  ε<sub>y</sub> = (σ<sub>y</sub>−νσ<sub>x</sub>)/E,  ε<sub>z</sub> = −ν(σ<sub>x</sub>+σ<sub>y</sub>)/E", styles["Formula"]), Paragraph("Evaluated with steel alloy defaults E = 200 GPa, ν = 0.30 (in με).", styles["TD"])],
            [Paragraph("<b>11. Shear Moduli &amp; γ</b>", styles["TDBold"]), Paragraph("G = E / [2(1+ν)],   K = E / [3(1−2ν)],   γ<sub>xy</sub> = τ<sub>xy</sub> / G", styles["Formula"]), Paragraph("Computes shear modulus (76.92 GPa) and engineering strain (μrad).", styles["TD"])],
            [Paragraph("<b>12. Principal Strains</b>", styles["TDBold"]), Paragraph("ε<sub>1,2</sub> = (ε<sub>x</sub>+ε<sub>y</sub>)/2 ± √[((ε<sub>x</sub>−ε<sub>y</sub>)/2)² + (γ<sub>xy</sub>/2)²],  γ<sub>max</sub> = 2R<sub>ε</sub>", styles["Formula"]), Paragraph("Plotted dynamically on post-level Strain Autopsy matrices.", styles["TD"])],
            [Paragraph("<b>13. Strain Transform</b>", styles["TDBold"]), Paragraph("ε<sub>θ</sub> = avg + diff·cos(2θ) + (γ<sub>xy</sub>/2)·sin(2θ);  γ<sub>θ</sub> = −2diff·sin(2θ) + γ<sub>xy</sub>·cos(2θ)", styles["Formula"]), Paragraph("Drives the green dashed deformed element in Study/Report Labs.", styles["TD"])],
            [Paragraph("<b>14. Dilatation &amp; Energy</b>", styles["TDBold"]), Paragraph("e = ε<sub>x</sub>+ε<sub>y</sub>+ε<sub>z</sub>;  u = ½(σ<sub>x</sub>ε<sub>x</sub>+σ<sub>y</sub>ε<sub>y</sub>+τ<sub>xy</sub>γ<sub>xy</sub>);  u<sub>d</sub> = [(1+ν)/(3E)]σ<sub>vm</sub>²", styles["Formula"]), Paragraph("Partitions total strain energy u (kJ/m³) into volume change u<sub>v</sub> &amp; shape change u<sub>d</sub>.", styles["TD"])],
        ],
        [94, 260, 170],
        pad_v=2.2,
    )
    story.append(eq_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: NUMERICAL BENCHMARK & UNIT TEST SUITE
    # =========================================================================
    story.append(Paragraph("14. Worked Numerical Benchmark (Standard Test Specimen: [80, 20, 30] MPa)", styles["SecHead"]))
    story.append(
        Paragraph(
            "Both the live game engine (" + inline_code("StudyLab") + " Preset #1 &amp; Level 4 Dragger) and " + inline_code("test_mechanics.py") + " benchmark against "
            "this exact plane stress state (E = 200 GPa, ν = 0.30, G = 76,923.08 MPa):",
            styles["Body"],
        )
    )
    bench_table = styled_table(
        [
            [Paragraph("Calculation Step", styles["TH"]), Paragraph("Analytical Substitution", styles["TH"]), Paragraph("Computed Engine Output", styles["TH"])],
            [Paragraph("<b>Mohr Center &amp; Radius</b>", styles["TDBold"]), Paragraph("C = (80 + 20) / 2 = 50.0 MPa;  R = √[((80 − 20)/2)² + 30²] = √(900 + 900)", styles["TD"]), Paragraph("<b>C = 50.0 MPa,  R = τ<sub>max</sub> = 42.43 MPa</b>", styles["TDBold"])],
            [Paragraph("<b>Principal Stresses</b>", styles["TDBold"]), Paragraph("σ<sub>1</sub> = 50 + 42.426;   σ<sub>2</sub> = 50 − 42.426", styles["TD"]), Paragraph("<b>σ<sub>1</sub> = 92.43 MPa,  σ<sub>2</sub> = 7.57 MPa</b>", styles["TDBold"])],
            [Paragraph("<b>Optimal Angles θ<sub>p</sub>, θ<sub>s</sub></b>", styles["TDBold"]), Paragraph("tan(2θ<sub>p</sub>) = 2(30)/(80−20) = 1.0 -> 2θ<sub>p</sub> = 45°;  θ<sub>s</sub> = θ<sub>p</sub> + 45°", styles["TD"]), Paragraph("<b>θ<sub>p</sub> = 22.5° (Brittle),  θ<sub>s</sub> = 67.5° (Ductile)</b>", styles["TDBold"])],
            [Paragraph("<b>Aligned Cut (θ = 22.5°)</b>", styles["TDBold"]), Paragraph("σ<sub>22.5</sub> = 50 + 30 cos(45°) + 30 sin(45°);  τ<sub>22.5</sub> = −30 sin(45°) + 30 cos(45°)", styles["TD"]), Paragraph("<font color='#059669'><b>σ<sub>θ</sub> = 92.4 MPa, τ<sub>θ</sub> = 0.0 MPa (CRIT CLEAVE!)</b></font>", styles["TD"])],
            [Paragraph("<b>Misaligned Cut (θ = 90°)</b>", styles["TDBold"]), Paragraph("σ<sub>90</sub> = 50 + 30 cos(180°) + 30 sin(180°);  τ<sub>90</sub> = −30 sin(180°) + 30 cos(180°)", styles["TD"]), Paragraph("<font color='#DC2626'><b>σ<sub>θ</sub> = 20.0 MPa, τ<sub>θ</sub> = −30.0 MPa (LOCKED / 0 DMG)</b></font>", styles["TD"])],
            [Paragraph("<b>Ductile Shear (θ = 67.5°)</b>", styles["TDBold"]), Paragraph("τ<sub>67.5</sub> = −30 sin(135°) + 30 cos(135°) = −21.21 − 21.21", styles["TD"]), Paragraph("<font color='#D97706'><b>|τ<sub>θ</sub>| = 42.4 MPa (TRESCA SHEAR TEAR)</b></font>", styles["TD"])],
            [Paragraph("<b>von Mises &amp; Invariant I<sub>1</sub></b>", styles["TDBold"]), Paragraph("I<sub>1</sub> = 80 + 20 = σ<sub>θ</sub> + σ<sub>θ+90</sub>;  σ<sub>vm</sub> = √(92.43² − 92.43·7.57 + 7.57²)", styles["TD"]), Paragraph("<b>I<sub>1</sub> = 100.0 MPa,  σ<sub>vm</sub> = 88.88 MPa</b>", styles["TDBold"])],
            [Paragraph("<b>3D Hooke Strains</b>", styles["TDBold"]), Paragraph("ε<sub>x</sub> = (80−0.3·20)/0.2; ε<sub>y</sub> = (20−0.3·80)/0.2; ε<sub>z</sub> = −0.3(100)/0.2; γ<sub>xy</sub> = 30/76.923", styles["TD"]), Paragraph("<b>ε<sub>x</sub>=370 με, ε<sub>y</sub>=−20 με, ε<sub>z</sub>=−150 με, γ<sub>xy</sub>=390 μrad</b>", styles["TD"])],
            [Paragraph("<b>Principal Strain @ 22.5°</b>", styles["TDBold"]), Paragraph("ε<sub>22.5</sub> = 175 + 195 cos(45°) + 195 sin(45°);  γ<sub>22.5</sub> = 0", styles["TD"]), Paragraph("<b>ε<sub>1</sub> = 450.8 με,  γ<sub>θ</sub> = 0.0 μrad</b>", styles["TD"])],
            [Paragraph("<b>Dilatation &amp; Energies</b>", styles["TDBold"]), Paragraph("e = 370 − 20 − 150;  u = ½(80·370 + 20·(−20) + 30·390)×10⁻³", styles["TD"]), Paragraph("<b>e = 200.0 με, u = 20.45 kJ/m³ (u<sub>d</sub> = 17.12 = 83.7%)</b>", styles["TD"])],
        ],
        [106, 224, 194],
        pad_v=2.8,
    )
    story.append(bench_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("15. Automated Verification &amp; Structural Code Audit Results", styles["SecHead"]))
    story.append(
        Paragraph(
            "Both mathematical fidelity and DOM/code integrity are verified automatically via unit tests and static analysis scripts:",
            styles["Body"],
        )
    )
    test_table = styled_table(
        [
            [Paragraph("Verification Test", styles["TH"]), Paragraph("Target Module &amp; Property Verified", styles["TH"]), Paragraph("Observed Result", styles["TH"])],
            [Paragraph("<b>1. First Stress Invariant (I<sub>1</sub>)</b>", styles["TDBold"]), Paragraph("Verifies I<sub>1</sub> = σ<sub>θ</sub> + σ<sub>θ+90</sub> = 100.0 MPa across all 180°", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>2. Mohr Geometry (C, R)</b>", styles["TDBold"]), Paragraph("Matches Center = 50.0 MPa and Radius = 42.43 MPa", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>3. Principal Stresses (σ<sub>1</sub>, σ<sub>2</sub>)</b>", styles["TDBold"]), Paragraph("Matches σ<sub>1</sub> = 92.4 MPa, σ<sub>2</sub> = 7.6 MPa", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>4. Principal &amp; Shear Angles</b>", styles["TDBold"]), Paragraph("Matches θ<sub>p</sub> = 22.5° and θ<sub>s</sub> = 67.5°", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>5. Optimal Hit Transformation</b>", styles["TDBold"]), Paragraph("θ = 22.5° yields σ<sub>θ</sub> = 92.4 MPa and τ<sub>θ</sub> = 0.0 MPa", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>6. Suboptimal Deflection</b>", styles["TDBold"]), Paragraph("θ = 90.0° yields σ<sub>θ</sub> = 20.0 MPa, τ<sub>θ</sub> = −30.0 MPa", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>7. Tresca Shear Condition</b>", styles["TDBold"]), Paragraph("θ = 67.5° yields |τ<sub>θ</sub>| = 42.4 MPa (τ<sub>max</sub>)", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>8. von Mises Criterion</b>", styles["TDBold"]), Paragraph("Tensor form matches principal formula: σ<sub>vm</sub> = 88.9 MPa", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>9. Generalized Hooke's Law</b>", styles["TDBold"]), Paragraph("ε<sub>x</sub>=370 με, ε<sub>y</sub>=−20 με, ε<sub>z</sub>=−150 με, γ<sub>xy</sub>=390 μrad", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>10. Strain Transformation</b>", styles["TDBold"]), Paragraph("ε<sub>θ</sub> = 450.8 με max &amp; γ<sub>θ</sub> = 0.0 μrad at θ<sub>p</sub> = 22.5°", styles["TD"]), Paragraph("PASS", styles["TDCenter"])],
            [Paragraph("<b>11. Dilatation &amp; Energy Density</b>", styles["TDBold"]), Paragraph("e = 200.0 με, u = 20.45 kJ/m³, u<sub>d</sub> = 17.12 kJ/m³ (0.001s runtime)", styles["TD"]), Paragraph("PASS (11/11)", styles["TDCenter"])],
            [Paragraph("<b>12. Static DOM &amp; Server Probe</b>", styles["TDBold"]), Paragraph("148 DOM IDs (0 missing), balanced JS/CSS syntax, HTTP 200 on all 8 v4.7 routes", styles["TD"]), Paragraph("PASS (24/24)", styles["TDCenter"])],
        ],
        [142, 314, 68],
        pad_v=2.2,
    )
    story.append(test_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 7: ENEMY BESTIARY & 10-SECTOR CAMPAIGN + HORROR SCENERY
    # =========================================================================
    story.append(Paragraph("16. Zombie Bestiary &amp; Classical Material Failure Mapping", styles["SecHead"]))
    best_table = styled_table(
        [
            [Paragraph("Enemy Class &amp; Visuals", styles["TH"]), Paragraph("Failure Law &amp; Formula", styles["TH"]), Paragraph("Combat Mechanics, Tolerances &amp; HP", styles["TH"])],
            [Paragraph("<b>1. Brittle Biter</b><br/>Sage skin, brown coat, red striped tie, exposed shin bone, bugging eyes, Cyan glow", styles["TD"]), Paragraph("<b>Rankine Theory</b><br/>(Max Normal Stress)<br/>" + inline_code("σ<sub>1</sub> ≥ σ<sub>Y</sub>"), styles["TD"]), Paragraph("Fails exclusively by tensile cleavage at <b>θ = θ<sub>p</sub></b> (where shear vanishes, τ = 0). Tolerance: ±7.5° (Crit ≤ 2.5°). Base Damage: 110–140 (+50% Crit).", styles["TD"])],
            [Paragraph("<b>2. Ductile Dragger</b><br/>Burnt-orange survivor coat, molten amber eyes, Orange aura", styles["TD"]), Paragraph("<b>Tresca Criterion</b><br/>(Max Shear Stress)<br/>" + inline_code("τ<sub>max</sub> ≥ σ<sub>Y</sub>/2"), styles["TD"]), Paragraph("Resists normal cuts! Yields along 45°-shifted slip planes <b>θ<sub>s</sub> = θ<sub>p</sub> ± 45°</b>. Can also be Hydro-Quenched [5] (τ<sub>xy</sub> → 0) into Brittle Cyan.", styles["TD"])],
            [Paragraph("<b>3. Quantum Shapeshifter</b><br/>Ashen skull, teal/magenta coat, crimson hollow eyes + drool", styles["TD"]), Paragraph("<b>Dynamic Rankine ↔ Tresca</b><br/>Alternating Tensor State", styles["TD"]), Paragraph("Every <b>240 frames</b> (~4s), mutates random [σ<sub>x</sub>, σ<sub>y</sub>, τ<sub>xy</sub>] and swaps phase between Tensile (Cyan/Violet) and Shear (Pink/Orange). Forces rapid crank re-aiming.", styles["TD"])],
            [Paragraph("<b>4. Linked Twins</b><br/>Teal street pair, huge yellow bulb cartoon eyes, Green aura", styles["TD"]), Paragraph("<b>Coupled Plane Cleave</b><br/>" + inline_code("θ = θ<sub>p</sub> (Twin Pair)"), styles["TD"]), Paragraph("Walks offset vertically sharing identical [σ<sub>x</sub>, σ<sub>y</sub>, τ<sub>xy</sub>] and θ<sub>p</sub>. Player locks once on primary twin and bursts both rapidly.", styles["TD"])],
            [Paragraph("<b>5. von Mises Titan Boss</b><br/>Colossal 95×145 px brute, purple-crimson coat, Red aura (600 HP)", styles["TD"]), Paragraph("<b>Distortion Energy</b><br/>" + inline_code("√(σ<sub>θ</sub>² + 3τ<sub>θ</sub>²) ≥ σ<sub>Y</sub>"), styles["TD"]), Paragraph("<b>3-Phase Boss</b> (±8.5° tolerance, 85 dmg/burst): shifts to [90, 30, −45] @ ≤ 66% HP (1.15× spd) &amp; [110, 45, 55] @ ≤ 33% HP (1.35× spd).", styles["TD"])],
        ],
        [136, 118, 270],
        pad_v=2.6,
    )
    story.append(best_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("17. Complete 10-Sector Campaign Progression &amp; Horror Scenery Engine", styles["SecHead"]))
    story.append(
        Paragraph(
            "Level progression is gated sequentially via " + inline_code("maxUnlockedLevel") + " and graded <b>1 to 3 Stars</b> (3 Stars ≥ 80% crit accuracy, 2 Stars ≥ 50%, 1 Star &lt; 50%). "
            "Scenery is pre-rendered onto an offscreen canvas cache (&lt;0.1 ms/frame blit) plus live animated mist, flickering streetlamps, bats, puddles, and embers:",
            styles["Body"],
        )
    )
    camp_table = styled_table(
        [
            [Paragraph("Level &amp; Theme", styles["TH"]), Paragraph("Spawned Wave Enemies &amp; [σ<sub>x</sub>, σ<sub>y</sub>, τ<sub>xy</sub>] MPa", styles["TH"]), Paragraph("Mechanics Learning Objective", styles["TH"])],
            [Paragraph("<b>L1: Straight Pull</b><br/><i>Cemetery Night</i>", styles["TD"]), Paragraph("3 Brittle (90–110 HP): [80,0,0], [100,0,0], [120,0,0]", styles["TD"]), Paragraph("Pure uniaxial tension (τ<sub>xy</sub>=0); target aligns flat at θ = 0°/90°.", styles["TD"])],
            [Paragraph("<b>L2: Two-Way Pull</b><br/><i>Cemetery Night</i>", styles["TD"]), Paragraph("3 Brittle (110–120 HP): [90,30,0], [110,40,0], [80,20,0]", styles["TD"]), Paragraph("Biaxial loading shifts Mohr center C = (σ<sub>x</sub>+σ<sub>y</sub>)/2 without rotating axes.", styles["TD"])],
            [Paragraph("<b>L3: Angled Shear</b><br/><i>Cemetery Night</i>", styles["TD"]), Paragraph("3 Brittle (120–140 HP): [80,20,30], [60,20,40], [90,10,−35]", styles["TD"]), Paragraph("Shear tilts principal axes; teaches 2θ Mohr radar rotation &amp; sign (±τ<sub>xy</sub>).", styles["TD"])],
            [Paragraph("<b>L4: Brittle &amp; Ductile</b><br/><i>Cursed Woods</i>", styles["TD"]), Paragraph("2 Brittle + 2 Ductile: [80,30,25], [80,20,30], [70,10,40], [95,25,−30]", styles["TD"]), Paragraph("Distinguishes Cyan σ<sub>1</sub> cleavage (θ<sub>p</sub>) vs. Orange τ<sub>max</sub> shear slip (θ<sub>s</sub> = θ<sub>p</sub>±45°).", styles["TD"])],
            [Paragraph("<b>L5: Armored Wave</b><br/><i>Cursed Woods</i>", styles["TD"]), Paragraph("3 Ductile + 1 Brittle (140–160 HP): [90,30,45], [85,25,40], [75,20,35], [100,30,−25]", styles["TD"]), Paragraph("Trains [5] Hydro-Jet quenching to collapse deviatoric shear into brittle glass.", styles["TD"])],
            [Paragraph("<b>L6: Color Changers</b><br/><i>Cursed Woods</i>", styles["TD"]), Paragraph("2 Shapeshifters + 1 Brittle (130–160 HP): [75,25,35], [85,15,20], [70,20,−30]", styles["TD"]), Paragraph("Adapts crank ±45° dynamically when tensor mutates every 240 frames.", styles["TD"])],
            [Paragraph("<b>L7: Linked Twins</b><br/><i>Blood Overpass</i>", styles["TD"]), Paragraph("4 Coupled Twins (120 HP pairs): [85,15,30] ×2 &amp; [75,25,−25] ×2", styles["TD"]), Paragraph("Identifies shared stress state on marching pairs for rapid double cleaves.", styles["TD"])],
            [Paragraph("<b>L8: Speed Rush</b><br/><i>Blood Overpass</i>", styles["TD"]), Paragraph("Fast Swarm (0.65–0.72 px/f): Brittle [110,40,35], Ductile [80,20,35], Shift [85,25,−30]", styles["TD"]), Paragraph("Combines [4] I<sub>1</sub> Shield kinetic barrier &amp; rapid targeting under speed pressure.", styles["TD"])],
            [Paragraph("<b>L9: Titan Boss</b><br/><i>Blood Overpass</i>", styles["TD"]), Paragraph("VON MISES TITAN COLOSSUS (600 HP): Starts [110,25,45], mutates 3 phases", styles["TD"]), Paragraph("Sustained burst fire tracking distortion energy &amp; mid-battle phase shifts.", styles["TD"])],
            [Paragraph("<b>L10+: Endless Mode</b><br/><i>Blood Overpass</i>", styles["TD"]), Paragraph("4 + level randomized mixed enemies; scaling speed &amp; HP (120 + 15·lvl)", styles["TD"]), Paragraph("Unlimited endurance survival leaderboard after conquering Campaign L1–L9.", styles["TD"])],
        ],
        [98, 224, 202],
        pad_v=2.2,
    )
    story.append(camp_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 8: ASSESSMENT REPORTS, STUDY LAB, AUDIO ENGINE & LAUNCH GUIDE
    # =========================================================================
    story.append(Paragraph("18. Three-Tier Continuous Assessment &amp; Every-Zombie Report System", styles["SecHead"]))
    story.append(
        Paragraph(
            "Unlike games that hide physics after combat ends, every single eliminated zombie produces immediate telemetry AND a full forensic record:",
            styles["Body"],
        )
    )
    rep_table = styled_table(
        [
            [Paragraph("Assessment Layer", styles["TH"]), Paragraph("UI Component / Class", styles["TH"]), Paragraph("Exact Data &amp; Interactive Controls Provided", styles["TH"])],
            [Paragraph("<b>1. Live Non-Blocking<br/>Kill Card (In-Combat)</b>", styles["TDBold"]), Paragraph(inline_code("#liveKillCard") + "<br/>" + inline_code("showLiveKillReport()"), styles["TD"]), Paragraph("Appears top-right for 4.5s on EVERY kill without pausing waves. Prints Kill #, Score (+CRIT badge), Cut angle θ, Mohr 2θ, σ<sub>θ</sub>, τ<sub>θ</sub>, failure criterion title, and exact optimal angle θ<sub>opt</sub>.", styles["TD"])],
            [Paragraph("<b>2. Post-Level Every-Zombie<br/>Forensic Inspector</b>", styles["TDBold"]), Paragraph(inline_code("#reportModal") + " + " + inline_code("#reportLabWrapper"), styles["TD"]), Paragraph("<b>Always visible</b> on level clear (and linked from Game Over whenever kills &gt; 0): includes Summary Grid (Accuracy, Crits, Misfires, Streak), <b>All-Slain Zombie Kill Report Table</b> with per-row <i>VIEW</i> buttons, specimen selector tabs, Exploration Slider θ (0°–180° + <i>MY CUT</i> reset), dual Mohr + Deformed Element canvases, Energy Partition bar (u<sub>v</sub> vs u<sub>d</sub>), and 6-step derivations.", styles["TD"])],
            [Paragraph("<b>3. Standalone Study Lab<br/>&amp; Codex Sandbox</b>", styles["TDBold"]), Paragraph(inline_code("#studyModal") + "<br/>" + inline_code("class StudyLab"), styles["TD"]), Paragraph("Non-combat faculty/student laboratory with free sliders for σ<sub>x</sub>, σ<sub>y</sub>, τ<sub>xy</sub> (−100..100 MPa) &amp; θ, 4 classic presets (Worked Example #1, Pure Shear, Uniaxial, Hydrostatic), and import buttons for recently defeated zombies.", styles["TD"])],
        ],
        [106, 114, 304],
        pad_v=2.8,
    )
    story.append(rep_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("19. Procedural Web Audio Architecture (Zero Audio Assets)", styles["SecHead"]))
    story.append(
        Paragraph(
            "All sound effects and adaptive music in " + inline_code("SoundController") + " (" + inline_code("js/audio.js") + ", 1,239 lines) "
            "are synthesized mathematically in the browser via the Web Audio API (oscillators, filtered noise buffers, wave-shaper distortion, feedback echoes):",
            styles["Body"],
        )
    )
    audio_table = styled_table(
        [
            [Paragraph("Audio Subsystem", styles["TH"]), Paragraph("Synthesis Architecture &amp; Behavioral Triggers", styles["TH"])],
            [Paragraph("<b>7.62mm Machine Gun Bursts &amp; Locks</b>", styles["TDBold"]), Paragraph("4 staggered transient noise cracks (0.044s gap) + low-end punch + brass shell ping on valid burst; mechanical dry trigger click (" + inline_code("playTriggerLock") + ") when fired off-angle or before zombie enters screen.", styles["TD"])],
            [Paragraph("<b>Tactical Proximity &amp; Power-Up SFX</b>", styles["TDBold"]), Paragraph("Rotary crank emits pitch-modulated ticks proportional to alignment proximity; distinct Hydro-Jet water deluge wash, Invariant Shield chime, Boss alarm siren, and streak combo fanfares.", styles["TD"])],
            [Paragraph("<b>Dynamic Dual-Mode Horror BGM &amp; Roar</b>", styles["TDBold"]), Paragraph("Real-time step sequencer switching smoothly between <b>Ambient</b> (74 BPM heartbeat/clock dread on menus) and <b>Combat</b> (84–96 BPM sub-bass &amp; stings), plus a 4-layer Welcome Zombie Roar synthesizer.", styles["TD"])],
        ],
        [146, 378],
        pad_v=2.6,
    )
    story.append(audio_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("20. How to Run, Test &amp; Share with Faculty or Students", styles["SecHead"]))
    story.append(
        callout_box(
            "<b>1. Local Instant Run (Recommended for Demo):</b> Execute " + inline_code("python run_game.py") + " in the project folder. "
            "It starts a no-cache Python HTTP server on port 8000, auto-opens <b>http://localhost:8000/</b> in Chrome, and prints the shareable local Wi-Fi URL (" + inline_code("http://&lt;LAN-IP&gt;:8000/") + ") for classmates on the same network.<br/>"
            "<b>2. Run Automated Mechanics Verification:</b> Execute " + inline_code("python test_mechanics.py") + " to verify all <b>11/11</b> stress/strain/energy calculations cleanly.<br/>"
            "<b>3. Public Chrome Link (Permanent Cloud Hosting):</b> Because the project is 100% static client-side HTML/CSS/JS with relative paths, uploading the folder to <b>Netlify Drop</b> or <b>GitHub Pages</b> produces an instant HTTPS URL playable globally in any browser.",
            bg=BG_GREEN,
            border=EMERALD,
        )
    )

    doc.build(story, canvasmaker=ReportCanvas)
    size = os.path.getsize(filename)
    print(f"[*] Generated professor project report PDF: {filename} ({size} bytes)")


if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "Stress_Zombie_Apocalypse_Professor_Report.pdf"
    build_pdf(out_file)
