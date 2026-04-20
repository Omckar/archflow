import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SystemDesign } from '../models/system-design.model';
import { OPENROUTER_API_KEY } from '../app.key';

@Injectable({
  providedIn: 'root',
})
export class OpenRouterService {
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey = OPENROUTER_API_KEY;

  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  async generateSystemDesign(prompt: string): Promise<SystemDesign | null> {
    this.loading.set(true);
    this.error.set(null);

    const systemPrompt = `
      You are a senior system design architect.
      Generate a system design for the following request: "${prompt}".
      
      Respond ONLY with a valid JSON object matching this TypeScript interface:
      
      interface NodeDetails {
        description: string;
        scaling: string;
        technology: string;
        operationExplanation: string;
        bottleneckRisk: 'low' | 'medium' | 'high';
      }

      interface SystemNode {
        id: string;
        label: string;
        type: string;
        x: number;
        y: number;
        details: NodeDetails;
      }

      interface SystemEdge {
        id: string;
        source: string;
        target: string;
        label?: string;
      }

      interface SystemDesign {
        nodes: SystemNode[];
        edges: SystemEdge[];
      }

      Guidelines:
      1. Provide at least 5-10 nodes for a comprehensive design.
      2. Ensure nodes have reasonable (x, y) coordinates for a layout (e.g., between 100-800).
      3. Use appropriate labels (e.g., Load Balancer, API Gateway, Redis Cache, Database).
    `;

    try {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:4200',
        'X-Title': 'ArchFlow - Live System Design Simulator'
      });

      const body = {
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: systemPrompt }],
      };

      const response: any = await firstValueFrom(this.http.post(this.apiUrl, body, { headers }));
      
      if (response?.choices?.[0]?.message?.content) {
        const content = response.choices[0].message.content;
        // Clean markdown if present
        const jsonStr = content.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as SystemDesign;
      }
      
      throw new Error('Invalid response from AI');
    } catch (err: any) {
      console.error('Full Error Object:', err);
      let msg = err.message || 'Failed to generate design';
      if (err.status === 404) msg = 'API Endpoint not found (404). Please check the URL or Model name.';
      this.error.set(msg);
      return null;
    } finally {
      this.loading.set(false);
    }
  }
}
