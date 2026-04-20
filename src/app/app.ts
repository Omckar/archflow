import { Component, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenRouterService } from './services/openrouter.service';
import { SystemDesign, SystemNode } from './models/system-design.model';
import { PromptInputComponent } from './components/prompt-input/prompt-input.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { SidePanelComponent } from './components/side-panel/side-panel.component';
// @ts-ignore
import domtoimage from 'dom-to-image-more';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    PromptInputComponent,
    CanvasComponent,
    SidePanelComponent
  ],
  template: `
    <div class="h-screen w-screen flex flex-col bg-[#050505] text-slate-200 overflow-hidden font-sans">
      
      <!-- Top Bar -->
      <header class="h-16 px-8 border-b border-white/5 flex items-center justify-between glass z-50">
        <div class="flex items-center gap-3">
          <img src="logo.png" alt="Logo" class="w-10 h-10 rounded-lg shadow-lg object-contain bg-white/5 p-1 border border-white/10">
          <h1 class="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            ArchFlow - Live System Design Simulator
          </h1>
        </div>

        <div class="flex items-center gap-4">
          @if (design()) {
            <button (click)="toggleSimulation()" 
                    [class]="simulationMode() ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'"
                    class="px-4 py-2 rounded-lg border text-sm font-semibold transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {{ simulationMode() ? 'Stop Simulation' : 'Run Simulation' }}
            </button>
            <button (click)="downloadPNG()" 
                    class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-all flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              Download PNG
            </button>
          }
        </div>
      </header>

      <main class="flex-1 flex overflow-hidden">
        
        <!-- Left Panel (Input) -->
        <aside class="w-80 border-r border-white/5 p-6 flex flex-col gap-6 z-40 bg-[#080808]/50 backdrop-blur-sm">
          <app-prompt-input [loading]="aiService.loading()" (generate)="onGenerate($event)"></app-prompt-input>
          
          <div class="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <h4 class="text-xs font-bold text-indigo-400 uppercase mb-2">Instructions</h4>
            <ul class="text-xs text-slate-500 space-y-2 list-disc pl-4">
              <li>Enter a system name or detailed requirements</li>
              <li>Claude-3.5 will generate a scalable architecture</li>
              <li>Drag nodes to reorganize your diagram</li>
              <li>Run simulation to find critical bottlenecks</li>
            </ul>
          </div>

          @if (aiService.error()) {
            <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {{ aiService.error() }}
            </div>
          }
        </aside>

        <!-- Main Canvas Area -->
        <div class="flex-1 relative canvas-container" #exportArea>
          @if (design()) {
            <app-canvas [design]="design()" 
                        [simulationMode]="simulationMode()"
                        [activeNodeId]="activeNodeId()"
                        (nodeSelected)="onNodeSelected($event)"
                        (nodeHovered)="onNodeHovered($event)">
            </app-canvas>
          } @else {
            <div class="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <div class="text-center">
                <h3 class="text-lg font-medium text-slate-400">Ready to Visualize</h3>
                <p class="text-sm">Describe your architecture on the left to begin.</p>
              </div>
            </div>
          }
        </div>

        <!-- Right Panel (Node Details) -->
        <aside [class]="selectedNode() ? 'w-96' : 'w-0'" class="transition-all duration-500 overflow-hidden z-40 bg-[#080808]">
          <app-side-panel [node]="selectedNode()" (close)="selectedNode.set(null)"></app-side-panel>
        </aside>

      </main>

      <!-- Bottom Status Bar -->
      <footer class="h-8 px-6 border-t border-white/5 glass flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest z-50">
        <div class="flex gap-4">
          <span>Simulation Engine: AI-Ready</span>
          <span>Model: GPT-4o Mini</span>
        </div>
        <div class="flex gap-4">
          <span>&copy; 2026 Omckar Badekaar</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class App {
  @ViewChild('exportArea') exportArea!: ElementRef;

  design = signal<SystemDesign | null>(null);
  selectedNode = signal<SystemNode | null>(null);
  simulationMode = signal(false);
  activeNodeId = signal<string | null>(null);
  isPaused = signal(false);
  
  private simInterval: any;

  constructor(public aiService: OpenRouterService) {}

  async onGenerate(prompt: string) {
    this.stopSimulation();
    this.design.set(null);
    this.selectedNode.set(null);
    
    const result = await this.aiService.generateSystemDesign(prompt);
    if (result) {
      this.design.set(result);
    }
  }

  onNodeSelected(node: SystemNode | null) {
    this.selectedNode.set(node);
  }

  onNodeHovered(node: SystemNode | null) {
    if (this.simulationMode()) {
      this.isPaused.set(node !== null);
    }
  }

  toggleSimulation() {
    if (this.simulationMode()) {
      this.stopSimulation();
    } else {
      this.startSimulation();
    }
  }

  startSimulation() {
    const nodes = this.design()?.nodes;
    if (!nodes || nodes.length === 0) return;

    this.simulationMode.set(true);
    this.isPaused.set(false);
    
    // Attempt to find a start node (Load Balancer or Gateway)
    const startNode = nodes.find(n => 
      n.label.toLowerCase().includes('balancer') || 
      n.label.toLowerCase().includes('gateway') || 
      n.label.toLowerCase().includes('user')
    ) || nodes[0];

    this.activeNodeId.set(startNode.id);
    
    this.simInterval = setInterval(() => {
      if (this.isPaused()) return;

      const currentId = this.activeNodeId();
      const edges = this.design()?.edges.filter(e => e.source === currentId) || [];
      
      if (edges.length > 0) {
        // Pick a random next edge to simulate flow
        const nextEdge = edges[Math.floor(Math.random() * edges.length)];
        this.activeNodeId.set(nextEdge.target);
      } else {
        // Restart from start if we hit a leaf node
        this.activeNodeId.set(startNode.id);
      }
    }, 2000);
  }

  stopSimulation() {
    this.simulationMode.set(false);
    this.activeNodeId.set(null);
    this.isPaused.set(false);
    if (this.simInterval) {
      clearInterval(this.simInterval);
    }
  }

  async downloadPNG() {
    if (!this.exportArea) return;
    
    try {
      console.log('Starting Image generation...');
      
      const options = {
        bgcolor: '#0a0a0a',
        width: this.exportArea.nativeElement.clientWidth * 2,
        height: this.exportArea.nativeElement.clientHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: this.exportArea.nativeElement.clientWidth + 'px',
          height: this.exportArea.nativeElement.clientHeight + 'px'
        }
      };

      const dataUrl = await domtoimage.toPng(this.exportArea.nativeElement, options);
      
      const link = document.createElement('a');
      link.download = `system-design-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate PNG:', err);
      alert('Failed to generate image. Try using Chrome or Edge.');
    }
  }
}
