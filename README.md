# Live System Design Simulator

A modern, interactive system design tool powered by Angular and Claude-3.5-Sonnet.

## Features
- **AI-Powered Generation**: Describe your system and get a detailed architecture.
- **Interactive Canvas**: Drag nodes, zoom in/out, and pan to explore the design.
- **Node Intelligence**: Detailed views for each component including scaling strategies and tech stack.
- **Risk Simulation**: Identify bottleneck risks in your architecture.
- **PDF Export**: Download your diagram as a high-quality PDF.

## Tech Stack
- **Frontend**: Angular 18+ (Standalone Components)
- **Styling**: TailwindCSS 4.0 (Modern Dark UI)
- **AI Integration**: OpenRouter API (Claude 3.5 Sonnet)
- **Visualization**: SVG-based Interactive Canvas
- **Export**: html2canvas + jsPDF

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Application**:
   ```bash
   npm start
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:4200`

## How to use
1. Enter a prompt like "Design a real-time chat application" in the left panel.
2. Click **Generate Structure**.
3. View the generated diagram on the canvas.
4. Click any node to see its details in the right panel.
5. Click **Run Simulation** to see potential bottlenecks (High/Medium/Low risk).
6. Click **Download PDF** to export your design.
