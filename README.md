# Focus-app

A clean, aesthetic, and distraction-free Pomodoro & Focus Mood web application built with vanilla HTML5, CSS3, and JavaScript.

---

## ✨ Features

- **🌿 Ambient Focus Moods**:
  - Switch between 5 atmospheric color themes: *Forest Zen*, *Rainy Cafe*, *Warm Sunset*, *Midnight Deep*, and *Minimal Dark*.
  - Synchronizes browser theme colors and smooth backdrop glows.

- **⏱️ Flexible Focus Timer**:
  - Standard Pomodoro presets: Deep Focus (25m), Short Break (5m), and Long Break (15m).
  - **Custom Timer Settings**: Set any custom duration (1–180 minutes) with one-click presets.
  - **Quick Adjusters**: Tap `[-5m]`, `[-1m]`, `[+1m]`, or `[+5m]` to fine-tune time on the fly.
  - Interactive SVG progress ring with gentle audio completion chime.

- **📋 To-Do Task Manager**:
  - Add, complete, and delete focus tasks.
  - **🎯 Target Focus**: Star any task to display it directly on the timer countdown as your active mission.
  - Filter tasks by *All*, *Active*, or *Done*, with live completion progress bar.

- **📊 Daywise Activity & Streak Tracker**:
  - **7-Day Visual Mini Bar Chart**: Dynamic bars showing daily focus minutes across the week.
  - **Streak Counter**: Tracks consecutive active focus days (`🔥 X Day Streak`).
  - **Daywise History**: Expandable log showing breakdown of sessions and minutes by date.

- **🎵 Procedural Ambient Soundscapes (100% Offline)**:
  - Procedural sound generator built with Web Audio API.
  - Sound options: *Brown Noise*, *Pink Noise*, *Rain Drops*, and *432Hz Zen Drone*.
  - Completely offline with 0 external sound files or internet connection required.

- **📱 Mobile Responsive & Touch-Optimized**:
  - Optimized for mobile viewports, thumb-friendly touch targets, and full-screen distraction-free mode.

- **💾 100% LocalStorage Persistence**:
  - Tasks, custom durations, selected mood, daywise statistics, and streak count are automatically saved on your device.

---

## 🚀 Getting Started

No dependencies required! Simply clone and open in any modern browser:

```bash
git clone https://github.com/joy24-student/Focus-app.git
cd Focus-app
```

### Run Locally

Using Python's built-in web server:

```bash
python -m http.server 8080
```

Then visit:
**`http://localhost:8080`**

---

## 🛠️ Built With

- **HTML5** — Semantic layout & SVG circular progress
- **CSS3** — Custom properties, dynamic palettes, glassmorphism & responsive CSS Grid/Flexbox
- **JavaScript (ES6+)** — Web Audio API synthesis, timer state machine, and localStorage management
