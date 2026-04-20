import { Component, Input, Output, EventEmitter, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemDesign, SystemNode, SystemEdge } from '../../models/system-design.model';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full bg-[#0a0a0a] overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 rounded-2xl shadow-2xl"
         #canvasContainer
         (mousedown)="onMouseDown($event)"
         (touchstart)="onTouchStart($event)"
         (wheel)="onWheel($event)">
      
      <svg class="w-full h-full" [attr.viewBox]="viewBox()">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Edges -->
        <g class="edges">
          @for (edge of design?.edges; track edge.id) {
            @let sourceNode = getNode(edge.source);
            @let targetNode = getNode(edge.target);
            @if (sourceNode && targetNode) {
              <line [attr.x1]="sourceNode.x + 110" [attr.y1]="sourceNode.y + 30"
                    [attr.x2]="targetNode.x + 110" [attr.y2]="targetNode.y + 30"
                    stroke="#4f46e5" stroke-width="2" marker-end="url(#arrowhead)"
                    class="opacity-50 transition-all duration-300" />
              @if (edge.label) {
                <text [attr.x]="(sourceNode.x + targetNode.x) / 2 + 110" 
                      [attr.y]="(sourceNode.y + targetNode.y) / 2 + 25"
                      fill="#94a3b8" font-size="10" text-anchor="middle" class="pointer-events-none">
                  {{edge.label}}
                </text>
              }
            }
          }
        </g>

        <!-- Nodes -->
        <g class="nodes">
          @for (node of design?.nodes; track node.id) {
            <g class="node cursor-pointer transition-transform duration-200"
               [class.scale-105]="selectedNodeId() === node.id"
               (mousedown)="onNodeMouseDown($event, node)"
               (touchstart)="onNodeTouchStart($event, node)"
               (mouseenter)="nodeHovered.emit(node)"
               (mouseleave)="nodeHovered.emit(null)"
               (click)="selectNode(node)">
              
              <!-- Node Box -->
              <rect [attr.x]="node.x" [attr.y]="node.y"
                    width="220" height="60" rx="12"
                    [attr.fill]="getNodeFill(node)"
                    [attr.stroke]="activeNodeId === node.id ? '#10b981' : (selectedNodeId() === node.id ? '#6366f1' : 'transparent')"
                    stroke-width="3"
                    [class.active-pulse]="activeNodeId === node.id"
                    class="drop-shadow-lg transition-all duration-500" />
              
              <!-- Active Highlight Ring -->
              @if (activeNodeId === node.id) {
                <rect [attr.x]="node.x - 4" [attr.y]="node.y - 4"
                      width="228" height="68" rx="14"
                      fill="none" stroke="#10b981" stroke-width="2" class="animate-ping opacity-20" />
              }
              
              <!-- Icon/Type Indicator -->
              <circle [attr.cx]="node.x + 25" [attr.cy]="node.y + 30" r="15" fill="rgba(255,255,255,0.1)" />
              <text [attr.x]="node.x + 25" [attr.y]="node.y + 35" 
                    fill="white" font-size="12" font-weight="bold" text-anchor="middle">
                {{node.type.charAt(0).toUpperCase()}}
              </text>

              <!-- Node Label -->
              <text [attr.x]="node.x + 50" [attr.y]="node.y + 35" 
                    fill="white" font-size="11" font-weight="600">
                {{node.label.length > 24 ? (node.label | slice:0:22) + '...' : node.label}}
              </text>

              <!-- Risk Indicator (Simulation Mode) -->
              @if (simulationMode) {
                <circle [attr.cx]="node.x + 145" [attr.cy]="node.y + 15" r="6" 
                        [attr.fill]="getRiskColor(node.details.bottleneckRisk)"
                        filter="url(#glow)">
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              }
            </g>
          }
        </g>
      </svg>

      <!-- Simulation Tooltip -->
      @if (simulationMode && activeNodeId) {
        @let activeNode = getNode(activeNodeId);
        @if (activeNode) {
          <div class="absolute p-3 bg-indigo-600 text-white text-[10px] rounded-lg shadow-2xl border border-white/20 backdrop-blur-md max-w-[200px] pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-300 z-50"
               [style.left.px]="(activeNode.x + 110 + panX()) * zoom()"
               [style.top.px]="(activeNode.y - 10 + panY()) * zoom()">
            <div class="font-bold mb-1 flex items-center gap-1 uppercase tracking-tighter opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
              Processing...
            </div>
            {{ activeNode.details.operationExplanation }}
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45"></div>
          </div>
        }
      }

      <!-- Zoom/Reset Controls -->
      <div class="absolute bottom-6 right-6 flex flex-col gap-2">
        <button (click)="resetView()" class="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .node rect { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3)); }
    .active-pulse {
      animation: pulse-green 2s infinite;
    }
    @keyframes pulse-green {
      0% { filter: drop-shadow(0 0 0 rgba(16, 185, 129, 0)); }
      50% { filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.6)); }
      100% { filter: drop-shadow(0 0 0 rgba(16, 185, 129, 0)); }
    }
  `]
})
export class CanvasComponent {
  @Input() design: SystemDesign | null = null;
  @Input() simulationMode = false;
  @Input() activeNodeId: string | null = null;
  @Output() nodeSelected = new EventEmitter<SystemNode | null>();
  @Output() nodeHovered = new EventEmitter<SystemNode | null>();

  selectedNodeId = signal<string | null>(null);
  
  // Viewport state
  panX = signal(0);
  panY = signal(0);
  zoom = signal(1);
  
  viewBox = () => `${-this.panX()} ${-this.panY()} ${1200 / this.zoom()} ${800 / this.zoom()}`;

  // Dragging state
  private isDragging = false;
  private isDraggingNode = false;
  private draggedNode: SystemNode | null = null;
  private lastMouseX = 0;
  private lastMouseY = 0;

  getNode(id: string) {
    return this.design?.nodes.find(n => n.id === id);
  }

  getNodeFill(node: SystemNode) {
    if (this.simulationMode) {
      const risk = node.details.bottleneckRisk;
      return risk === 'high' ? '#450a0a' : risk === 'medium' ? '#451a03' : '#1e1b4b';
    }
    return '#1a1a1a';
  }

  getRiskColor(risk: string) {
    return risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#10b981';
  }

  selectNode(node: SystemNode) {
    this.selectedNodeId.set(node.id);
    this.nodeSelected.emit(node);
  }

  onMouseDown(event: MouseEvent) {
    if (this.isDraggingNode) return;
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  onNodeMouseDown(event: MouseEvent, node: SystemNode) {
    event.stopPropagation();
    this.isDraggingNode = true;
    this.draggedNode = node;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const dx = (event.clientX - this.lastMouseX) / this.zoom();
    const dy = (event.clientY - this.lastMouseY) / this.zoom();

    if (this.isDragging) {
      this.panX.update(x => x + dx * this.zoom());
      this.panY.update(y => y + dy * this.zoom());
    } else if (this.isDraggingNode && this.draggedNode) {
      this.draggedNode.x += dx;
      this.draggedNode.y += dy;
    }

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  onTouchStart(event: TouchEvent) {
    if (this.isDraggingNode || event.touches.length === 0) return;
    this.isDragging = true;
    this.lastMouseX = event.touches[0].clientX;
    this.lastMouseY = event.touches[0].clientY;
  }

  onNodeTouchStart(event: TouchEvent, node: SystemNode) {
    if (event.touches.length === 0) return;
    event.stopPropagation();
    this.isDraggingNode = true;
    this.draggedNode = node;
    this.lastMouseX = event.touches[0].clientX;
    this.lastMouseY = event.touches[0].clientY;
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  onMouseUp() {
    this.isDragging = false;
    this.isDraggingNode = false;
    this.draggedNode = null;
  }

  @HostListener('window:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (event.touches.length === 0 || (!this.isDragging && !this.isDraggingNode)) return;
    
    // Prevent scrolling when dragging or panning
    if (event.cancelable) {
      event.preventDefault();
    }

    const dx = (event.touches[0].clientX - this.lastMouseX) / this.zoom();
    const dy = (event.touches[0].clientY - this.lastMouseY) / this.zoom();

    if (this.isDragging) {
      this.panX.update(x => x + dx * this.zoom());
      this.panY.update(y => y + dy * this.zoom());
    } else if (this.isDraggingNode && this.draggedNode) {
      this.draggedNode.x += dx;
      this.draggedNode.y += dy;
    }

    this.lastMouseX = event.touches[0].clientX;
    this.lastMouseY = event.touches[0].clientY;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.zoom.update(z => Math.min(Math.max(z * delta, 0.5), 3));
  }

  resetView() {
    this.panX.set(0);
    this.panY.set(0);
    this.zoom.set(1);
    this.selectedNodeId.set(null);
    this.nodeSelected.emit(null);
  }
}
