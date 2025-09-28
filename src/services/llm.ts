import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import type { ReviewComment, ReviewTemplate, LLMError, LLMServiceInterface } from '../types';

export interface LLMConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMService implements LLMServiceInterface {
  private client: AxiosInstance;
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      apiKey: '',
      model: 'gpt-4',
      baseURL: 'https://api.openai.com/v1',
      maxTokens: 4000,
      temperature: 0.1,
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });
  }

  configure(apiKey: string, model: string): void {
    this.config.apiKey = apiKey;
    this.config.model = model;
    
    // Update the authorization header
    this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;
  }

  async analyzeCode(diff: string, template: ReviewTemplate): Promise<ReviewComment[]> {
    if (!this.config.apiKey) {
      throw this.createLLMError('configuration_error', 'API key not configured');
    }

    try {
      const prompt = this.constructPrompt(diff, template);
      const response = await this.callLLMAPI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      // If it's already an LLMError, re-throw it
      if (error && typeof error === 'object' && 'type' in error && error.type === 'llm') {
        throw error;
      }
      throw this.handleAPIError(error);
    }
  }

  private constructPrompt(diff: string, template: ReviewTemplate): string {
    const systemPrompt = `You are an expert code reviewer. Analyze the provided git diff and provide structured feedback based on the review template criteria.

IMPORTANT: Your response must be valid JSON in the following format:
{
  "comments": [
    {
      "file": "path/to/file.js",
      "line": 42,
      "content": "Your review comment here",
      "severity": "info|warning|error",
      "category": "code_quality|security|performance|maintainability|testing"
    }
  ]
}

Review Criteria:
- Code Quality: ${template.prompts.codeQuality}
- Security: ${template.prompts.security}
- Performance: ${template.prompts.performance}
- Maintainability: ${template.prompts.maintainability}
- Testing: ${template.prompts.testing}

Rules:
- Max Complexity: ${template.rules.maxComplexity}
- Require Tests: ${template.rules.requireTests}
- Security Checks: ${template.rules.securityChecks.join(', ')}

Focus on:
${template.criteria.map(criterion => `- ${criterion}`).join('\n')}

Provide specific, actionable feedback. Only comment on lines that have actual issues or improvements.`;

    const userPrompt = `Please review the following git diff:

\`\`\`diff
${diff}
\`\`\`

Analyze the code changes and provide structured feedback as JSON.`;

    return JSON.stringify({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });
  }

  private async callLLMAPI(prompt: string): Promise<LLMResponse> {
    try {
      const response = await this.client.post('/chat/completions', JSON.parse(prompt));
      return response.data as LLMResponse;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  private parseResponse(response: LLMResponse): ReviewComment[] {
    try {
      if (!response.choices || response.choices.length === 0) {
        throw this.createLLMError('invalid_response', 'No choices in LLM response');
      }

      const content = response.choices[0].message.content;
      if (!content) {
        throw this.createLLMError('invalid_response', 'Empty content in LLM response');
      }

      // Try to extract JSON from the response
      let jsonContent = content.trim();
      
      // Handle cases where the response might be wrapped in markdown code blocks
      const jsonMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonContent);
      
      if (!parsed.comments || !Array.isArray(parsed.comments)) {
        throw this.createLLMError('invalid_response', 'Response does not contain valid comments array');
      }

      return parsed.comments.map((comment: any, index: number) => {
        if (!this.isValidComment(comment)) {
          throw this.createLLMError('invalid_response', `Invalid comment structure at index ${index}`);
        }

        return {
          id: this.generateCommentId(),
          file: comment.file,
          line: comment.line,
          content: comment.content,
          severity: comment.severity || 'info',
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          category: comment.category || 'code_quality',
        } as ReviewComment;
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw this.createLLMError('invalid_response', `Failed to parse LLM response as JSON: ${error.message}`);
      }
      throw error;
    }
  }

  private isValidComment(comment: any): boolean {
    return (
      comment !== null &&
      typeof comment === 'object' &&
      typeof comment.file === 'string' &&
      typeof comment.line === 'number' &&
      typeof comment.content === 'string' &&
      comment.file.length > 0 &&
      comment.line > 0 &&
      comment.content.length > 0
    );
  }

  private generateCommentId(): string {
    return `llm-comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleAPIError(error: unknown): LLMError {
    // Check if it's an axios error first
    if (error && typeof error === 'object' && 'isAxiosError' in error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return this.createLLMError('timeout', 'Request timed out');
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        switch (status) {
          case 401:
            return this.createLLMError('configuration_error', 'Invalid API key');
          case 429:
            return this.createLLMError('quota_exceeded', 'Rate limit exceeded');
          case 500:
          case 502:
          case 503:
          case 504:
            return this.createLLMError('api_failure', `Server error: ${status}`);
          default:
            return this.createLLMError('api_failure', data?.error?.message || `HTTP ${status}`);
        }
      }

      return this.createLLMError('api_failure', 'Network error');
    }

    if (error instanceof Error) {
      return this.createLLMError('api_failure', error.message);
    }

    return this.createLLMError('api_failure', 'Unknown error occurred');
  }

  private createLLMError(reason: LLMError['reason'], message: string): LLMError {
    return {
      type: 'llm',
      code: `LLM_${reason.toUpperCase()}`,
      message,
      reason,
      timestamp: new Date().toISOString(),
    };
  }

  // Utility method to validate configuration
  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.model);
  }

  // Utility method to get current configuration (without exposing API key)
  getConfig(): Omit<LLMConfig, 'apiKey'> {
    const { apiKey, ...config } = this.config;
    return config;
  }

  // Method to update configuration partially
  updateConfig(updates: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.apiKey) {
      this.client.defaults.headers['Authorization'] = `Bearer ${updates.apiKey}`;
    }
    
    if (updates.baseURL) {
      this.client.defaults.baseURL = updates.baseURL;
    }
    
    if (updates.timeout) {
      this.client.defaults.timeout = updates.timeout;
    }
  }
}

// Create and export a default instance
export const llmService = new LLMService();