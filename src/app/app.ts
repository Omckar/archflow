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
      <header class="h-16 px-4 md:px-8 border-b border-white/5 flex items-center justify-between glass z-50">
        <div class="flex items-center gap-3">
          <img src="logo.png" alt="Logo" class="w-8 h-8 md:w-10 md:h-10 rounded-lg shadow-lg object-contain bg-white/5 p-1 border border-white/10">
          <h1 class="text-sm md:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 truncate max-w-[120px] md:max-w-none">
            ArchFlow
          </h1>
        </div>

        <div class="flex items-center gap-2 md:gap-4">
          <!-- Mobile Menu Toggle -->
          <button (click)="leftPanelOpen.set(!leftPanelOpen())" class="md:hidden p-2 text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          @if (design()) {
            <button (click)="toggleSimulation()" 
                    [class]="simulationMode() ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'"
                    class="px-2 md:px-4 py-1.5 md:py-2 rounded-lg border text-[10px] md:text-sm font-semibold transition-all flex items-center gap-1.5 md:gap-2 hover:scale-105 active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="md:w-4 md:h-4"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span class="hidden sm:inline">{{ simulationMode() ? 'Stop' : 'Run' }} Simulation</span>
              <span class="sm:hidden">{{ simulationMode() ? 'Stop' : 'Run' }}</span>
            </button>
            <button (click)="downloadPNG()" 
                    [disabled]="downloading()"
                    [class.opacity-50]="downloading()"
                    class="px-2 md:px-4 py-1.5 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] md:text-sm font-semibold transition-all flex items-center gap-1.5 md:gap-2">
              @if (downloading()) {
                <svg class="animate-spin h-3 w-3 md:h-4 md:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span class="hidden sm:inline">Exporting...</span>
                <span class="sm:hidden">...</span>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="md:w-4 md:h-4"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <span class="hidden sm:inline">Download PNG</span>
                <span class="sm:hidden">PNG</span>
              }
            </button>
          }
        </div>
      </header>

      <main class="flex-1 flex overflow-hidden relative">
        
        <!-- Left Panel (Input) - Responsive Overlay -->
        <aside [class]="leftPanelOpen() ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
               class="absolute md:relative w-[280px] md:w-80 h-full border-r border-white/5 p-6 flex flex-col gap-6 z-[60] bg-[#080808]/95 md:bg-[#080808]/50 backdrop-blur-xl md:backdrop-blur-sm transition-transform duration-300">
          <div class="flex items-center justify-between md:hidden mb-2">
             <span class="text-xs font-bold text-indigo-400 uppercase">Configuration</span>
             <button (click)="leftPanelOpen.set(false)" class="p-1 text-slate-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          
          <app-prompt-input [loading]="aiService.loading()" (generate)="onGenerate($event)"></app-prompt-input>
          
          <div class="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <h4 class="text-xs font-bold text-indigo-400 uppercase mb-2">Instructions</h4>
            <ul class="text-xs text-slate-500 space-y-2 list-disc pl-4">
              <li>Enter system requirements</li>
              <li>AI generates architecture</li>
              <li>Drag nodes to reorganize</li>
              <li>Identify critical bottlenecks</li>
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
            <div class="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50 p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="md:w-16 md:h-16"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <div>
                <h3 class="text-base md:text-lg font-medium text-slate-400">Ready to Visualize</h3>
                <p class="text-xs md:text-sm">Describe your architecture to begin.</p>
              </div>
              <button (click)="leftPanelOpen.set(true)" class="md:hidden px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg font-semibold">
                Open Config
              </button>
            </div>
          }
        </div>

        <!-- Right Panel (Node Details) - Fully Responsive Overlay -->
        <aside [class]="selectedNode() ? 'translate-x-0' : 'translate-x-full'" 
               class="fixed md:absolute right-0 top-0 md:top-auto h-full w-full sm:w-[400px] md:w-96 transition-transform duration-500 overflow-hidden z-[70] bg-[#080808] border-l border-white/5">
          <app-side-panel [node]="selectedNode()" (close)="selectedNode.set(null)"></app-side-panel>
        </aside>

        <!-- Overlay for mobile when sidebar is open -->
        @if (leftPanelOpen() && isMobile()) {
          <div (click)="leftPanelOpen.set(false)" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"></div>
        }

      </main>

      <!-- Bottom Status Bar -->
      <footer class="h-8 px-4 md:px-6 border-t border-white/5 glass flex items-center justify-between text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest z-50">
        <div class="flex gap-2 md:gap-4 overflow-hidden">
          <span class="truncate">Engine: AI-Ready</span>
          <span class="truncate">GPT-4o Mini</span>
        </div>
        <div class="flex gap-4">
          <span>&copy; 2026 Omckar</span>
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
  leftPanelOpen = signal(false);
  
  isMobile = signal(window.innerWidth < 768);
  
  private simInterval: any;

  constructor(public aiService: OpenRouterService) {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 768);
    });
  }

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

  downloading = signal(false);

  async downloadPNG() {
    if (!this.exportArea || this.downloading()) return;
    
    try {
      this.downloading.set(true);
      console.log('Starting Image generation...');
      
      const el = this.exportArea.nativeElement;
      
      // dom-to-image-more is better at handling SVGs
      const options = {
        bgcolor: '#0a0a0a',
        width: el.clientWidth * 2,
        height: el.clientHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: el.clientWidth + 'px',
          height: el.clientHeight + 'px'
        }
      };

      const blob = await domtoimage.toBlob(el, options);
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `archflow-design-${Date.now()}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      this.downloading.set(false);
    } catch (err) {
      console.error('Failed to generate PNG:', err);
      this.downloading.set(false);
      alert('Failed to generate image. Please try again or use a desktop browser.');
    }
  }
}
