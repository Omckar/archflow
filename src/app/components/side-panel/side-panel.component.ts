import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemNode } from '../../models/system-design.model';

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full bg-[#111111] border-l border-white/10 p-6 flex flex-col gap-6 overflow-y-auto animate-in slide-in-from-right duration-300">
      @if (node) {
        <div class="flex flex-col gap-1">
          <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest">{{node.type}}</span>
          <h2 class="text-2xl font-bold text-white">{{node.label}}</h2>
        </div>

        <div class="space-y-6">
          <section>
            <h3 class="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              Description
            </h3>
            <p class="text-slate-300 leading-relaxed text-sm">
              {{node.details.description}}
            </p>
          </section>

          <section>
            <h3 class="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Operation Logic
            </h3>
            <p class="text-slate-300 text-sm leading-relaxed">
              {{node.details.operationExplanation}}
            </p>
          </section>

          <section>
            <h3 class="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
              Scaling Strategy
            </h3>
            <p class="text-slate-300 text-sm italic">
              {{node.details.scaling}}
            </p>
          </section>

          <section>
            <h3 class="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10h10V2z"/><path d="M22 12H12v10h10V12z"/><path d="M12 12H2v10h10V12z"/><path d="M22 2H12v10h10V2z"/></svg>
              Technology Stack
            </h3>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {{node.details.technology}}
            </span>
          </section>

          <section>
            <h3 class="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Bottleneck Risk
            </h3>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500" 
                     [style.width.%]="getRiskPercent(node.details.bottleneckRisk)"
                     [style.backgroundColor]="getRiskColor(node.details.bottleneckRisk)">
                </div>
              </div>
              <span class="text-xs uppercase font-bold" [style.color]="getRiskColor(node.details.bottleneckRisk)">
                {{node.details.bottleneckRisk}}
              </span>
            </div>
          </section>
        </div>

        <button (click)="close.emit()" 
                class="mt-auto w-full py-3 border border-white/10 hover:bg-white/5 text-slate-400 rounded-xl transition-colors text-sm font-medium">
          Close Details
        </button>
      } @else {
        <div class="h-full flex flex-col items-center justify-center text-center opacity-40">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-4"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/><path d="m8 9 3 3-3 3"/></svg>
          <p class="text-sm">Select a component to view details</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `]
})
export class SidePanelComponent {
  @Input() node: SystemNode | null = null;
  @Output() close = new EventEmitter<void>();

  getRiskPercent(risk: string) {
    return risk === 'high' ? 90 : risk === 'medium' ? 50 : 20;
  }

  getRiskColor(risk: string) {
    return risk === 'high' ? '#ef4444' : risk === 'medium' ? '#f59e0b' : '#10b981';
  }
}
