# Ollama Local LLM Integration Setup

This guide explains how to set up and use the local Ollama integration for development, replacing Google Gemini API calls.

## Prerequisites

1. **Install Ollama** (if not already installed):
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai
   ```

2. **Start Ollama service**:
   ```bash
   ollama serve
   ```

## Recommended Model Setup

Based on your codebase analysis, the recommended model is **deepseek-coder-v2:latest** for its excellent reasoning capabilities and French language support.

```bash
# Pull the recommended model
ollama pull deepseek-coder-v2:latest

# Verify installation
ollama list
```

### Alternative Models (if deepseek-coder-v2 doesn't work well):

```bash
# Good alternatives from your available models:
ollama pull qwen3:latest        # 5.2 GB - Good multilingual support
ollama pull mixtral:latest      # 26 GB - Excellent reasoning (if you have resources)
ollama pull gemma3:latest       # 3.3 GB - Lightweight alternative
```

## Environment Configuration

Add these environment variables to your `.env.local`:

```env
# AI Mode - set to 'local' for development, 'gemini' for production
AI_MODE=local

# Ollama Configuration (optional - defaults provided)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=deepseek-coder-v2:latest

# Keep your Gemini key for production use
GEMINI_API_KEY=your_gemini_api_key_here
```

## Testing the Integration

1. **Health Check**:
   ```bash
   curl http://localhost:3000/api/ai/health
   ```

2. **Test AI Response**:
   ```bash
   curl -X POST http://localhost:3000/api/ai/health \
     -H "Content-Type: application/json" \
     -d '{"testPrompt": "Bonjour, comment optimiser mes déclarations fiscales en tant que micro-entrepreneur?"}'
   ```

3. **Test Fiscal Advice** (requires authentication):
   - Log into your app
   - Go to `/dashboard/assistant`
   - Ask a fiscal question

## Integration Points Updated

The following components now use Ollama in development mode:

- ✅ **Fiscal Agents** (`src/lib/fiscal-agents.ts`) - Multi-agent system
- ✅ **Proactive Insights** (`src/lib/proactive-insights.ts`) - Fiscal optimization insights  
- ✅ **Fiscal Suggestions** (`src/app/api/ai/fiscal-suggestions/route.ts`) - Basic suggestions
- ✅ **Health Check** (`src/app/api/ai/health/route.ts`) - Service monitoring

## Production Deployment

When ready for production, simply change the environment variable:

```env
AI_MODE=gemini
```

All Google Gemini code is commented but preserved for easy reactivation.

## Troubleshooting

### Common Issues:

1. **"Ollama service not available"**:
   ```bash
   # Check if Ollama is running
   ps aux | grep ollama
   
   # Start Ollama
   ollama serve
   ```

2. **"Model not found"**:
   ```bash
   # List available models
   ollama list
   
   # Pull missing model
   ollama pull deepseek-coder-v2:latest
   ```

3. **Slow responses**:
   - Try a smaller model like `qwen3:latest` or `gemma3:latest`
   - Ensure sufficient RAM (8GB+ recommended for deepseek-coder-v2)

4. **Memory issues**:
   ```bash
   # Check system resources
   htop
   
   # Use a lighter model
   ollama pull gemma3:1b  # Only 815 MB
   ```

### Performance Tips:

- **RAM**: deepseek-coder-v2 needs ~16GB RAM for optimal performance
- **Fallback**: The system will automatically fallback to available models if the preferred one fails  
- **Concurrent requests**: Ollama handles multiple requests but may be slower than Gemini API

## Model Comparison for Your Use Case:

| Model | Size | Best For | French Support | Reasoning |
|-------|------|----------|----------------|-----------|
| deepseek-coder-v2 | 8.9GB | Fiscal analysis, complex reasoning | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| qwen3 | 5.2GB | General purpose, good balance | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| mixtral | 26GB | Best reasoning (if resources allow) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| gemma3 | 3.3GB | Lightweight, fast responses | ⭐⭐⭐ | ⭐⭐⭐ |

## Next Steps

1. Start Ollama service
2. Pull the recommended model 
3. Set `AI_MODE=local` in your environment
4. Test the integration
5. Monitor performance and adjust model if needed

The integration is now ready for development use! 🚀