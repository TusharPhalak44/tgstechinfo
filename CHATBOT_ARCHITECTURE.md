# Content Discovery Assistant - Architecture Summary

## Overview
The Content Discovery Assistant is a professional, non-conversational AI-powered content search and recommendation system for the TGS Publishing Platform. It enables users to discover articles, whitepapers, reports, and webinars through intelligent search, recommendations, and AI-powered summarization.

## Core Principles
1. **Database-First Approach**: AI only processes content from the website database
2. **No External Knowledge**: AI never uses internet knowledge when matching website content exists
3. **Content Prioritization**: Website content always takes precedence over external information
4. **Modular Architecture**: Provider abstraction allows switching between AI services without business logic changes

## Architecture Layers

### 1. Data Layer
- **MySQL Database**: Stores content, sessions, search logs, click logs, trending cache, feedback
- **Tables**:
  - `contents`: Main content repository
  - `categories`: Content categorization
  - `content_types`: Article, whitepaper, report, webinar types
  - `chatbot_sessions`: User session tracking
  - `chatbot_search_logs`: Search query logging
  - `chatbot_click_logs`: Content click tracking
  - `chatbot_trending_cache`: Trending content cache
  - `chatbot_feedback`: User feedback collection
  - `chatbot_messages`: Message logging for future conversational features

### 2. Service Layer

#### Search Services
- **`chatbotSearchService.js`**: Core search functionality
  - Multi-field search (title, slug, tags, category, description, content)
  - Ranking algorithm (exact title > slug > tags > category > description > content > popularity > latest)
  - Autocomplete for search input
  - Trending content retrieval
  - Category and recent content fetching
  - Search and click logging

- **`recommendationService.js`**: Recommendation engine
  - Priority scoring: Same Category (100) > Same Tags (80+) > Same Author (60) > Editor's Choice (50) > Most Viewed (40) > Recently Published (30)
  - Tag match counting for weighted scoring
  - No-result fallback suggestions
  - Deduplication logic

- **`summaryService.js`**: AI preparation service
  - Formats content for AI processing
  - Pre-built prompt templates
  - Content sanitization (HTML removal, entity decoding)
  - Word count and reading time calculation
  - Does NOT call AI providers directly

- **`chatbotAnalyticsService.js`**: Analytics aggregation
  - Search analytics (top searches, categories, no-result queries)
  - Click analytics (most clicked content, CTR)
  - Session analytics (session time, user types)
  - Trending analytics
  - Feedback analytics
  - Daily and monthly trend analysis

#### AI Services (Provider Abstraction)
- **`AIProvider.js`**: Base interface for all AI providers
  - Defines contract: `summarizeContent`, `generateRecommendations`, `generateQA`, `generateConversationalResponse`
  - Content source validation (ensures database-only processing)
  - Error formatting and response standardization

- **`OpenAIProvider.js`**: OpenAI GPT implementation
  - Supports GPT-3.5-turbo, GPT-4
  - Requires `OPENAI_API_KEY`
  - Mock responses for development without API key

- **`GeminiProvider.js`**: Google Gemini implementation
  - Supports Gemini Pro
  - Requires `GEMINI_API_KEY`
  - Mock responses for development without API key

- **`BedrockProvider.js`**: AWS Bedrock implementation
  - Supports Claude, Titan models
  - Requires AWS credentials
  - Mock responses for development without credentials

- **`AIServiceManager.js`**: Provider orchestration
  - Singleton pattern for provider management
  - Automatic provider detection based on environment variables
  - Default provider selection
  - Provider switching at runtime

### 3. Controller Layer

#### Chatbot Controller (`chatbotController.js`)
- **Search Endpoints**:
  - `POST /api/chatbot/search` - Multi-field search with ranking
  - `GET /api/chatbot/autocomplete` - Title autocomplete
  - `GET /api/chatbot/related/:contentId` - Related content
  - `GET /api/chatbot/suggestions` - No-result suggestions

- **Logging Endpoints**:
  - `POST /api/chatbot/click` - Log content clicks
  - `POST /api/chatbot/session` - Session management
  - `POST /api/chatbot/message` - Message logging
  - `POST /api/chatbot/feedback` - Feedback submission

- **AI Endpoints**:
  - `POST /api/chatbot/ai/summarize` - Summarize database content
  - `POST /api/chatbot/ai/recommendations` - AI recommendations from search results
  - `POST /api/chatbot/ai/qa` - Generate Q&A from content
  - `POST /api/chatbot/ai/converse` - Conversational response from search results
  - `GET /api/chatbot/ai/status` - AI provider status

- **Discovery Endpoints**:
  - `GET /api/chatbot/trending` - Trending content
  - `GET /api/chatbot/categories` - Available categories
  - `GET /api/chatbot/recent` - Recent content

#### Analytics Controller (`chatbotAnalyticsController.js`)
- `GET /api/admin/chatbot/analytics/dashboard` - Comprehensive dashboard
- `GET /api/admin/chatbot/analytics/top-searches` - Top search queries
- `GET /api/admin/chatbot/analytics/top-categories` - Top categories
- `GET /api/admin/chatbot/analytics/most-clicked` - Most clicked content
- `GET /api/admin/chatbot/analytics/no-result-searches` - Failed searches
- `GET /api/admin/chatbot/analytics/sessions` - Session statistics
- `GET /api/admin/chatbot/analytics/average-session-time` - Session duration
- `GET /api/admin/chatbot/analytics/ctr` - Click-through rate
- `GET /api/admin/chatbot/analytics/daily` - Daily trends
- `GET /api/admin/chatbot/analytics/monthly` - Monthly trends
- `GET /api/admin/chatbot/analytics/feedback` - Feedback analytics

### 4. Frontend Layer

#### Context (`ChatContext.jsx`)
- State management for chat widget
- Session management with localStorage
- API integration for search, autocomplete, suggestions, related content
- Recent searches tracking

#### Components
- **`ChatWidget.jsx`**: Floating action button and widget toggle
- **`ChatWindow.jsx`**: Main chat window container
- **`SearchInput.jsx`**: Search input with suggestions
- **`Autocomplete.jsx`**: Real-time title suggestions
- **`SearchResults.jsx`**: Results display with no-result suggestions
- **`CategoryResults.jsx`**: Category browsing
- **`TrendingTopics.jsx`**: Trending content display
- **`RecentSearches.jsx`**: Recent search history
- **`RelatedContent.jsx`**: Related content recommendations
- **`TypingIndicator.jsx`**: Loading animation

#### Admin Dashboard (`ChatbotAnalytics.jsx`)
- Comprehensive analytics dashboard
- Date range filtering
- Metric selection (dashboard, top searches, categories, etc.)
- Data tables with sorting and pagination

## Data Flow

### Search Flow
1. User enters query in SearchInput
2. Frontend calls `/api/chatbot/search`
3. Backend performs multi-field database search
4. Results ranked by relevance algorithm
5. Search logged to `chatbot_search_logs`
6. Results returned to frontend
7. If no results, `/api/chatbot/suggestions` called automatically
8. Frontend displays results or suggestions

### AI Summarization Flow
1. User requests content summary
2. Frontend calls `/api/chatbot/ai/summarize` with contentId
3. Backend fetches content from database
4. Content formatted by `SummaryService`
5. Sent to configured AI provider (OpenAI/Gemini/Bedrock)
6. AI generates summary using ONLY database content
7. Summary returned to frontend

### Recommendation Flow
1. User views content
2. Frontend calls `/api/chatbot/related/:contentId`
3. Backend runs recommendation engine
4. Multi-factor scoring applied
5. Top recommendations returned
6. Optionally, AI can enhance recommendations via `/api/chatbot/ai/recommendations`

## Security Considerations

### AI Content Validation
- `validateContentSource()` ensures AI only processes database content
- All AI endpoints require database content as input
- AI prompts explicitly instruct to use only provided content
- No internet access allowed for AI when database content exists

### Authentication
- Analytics endpoints require admin authentication
- Session tracking for both guest and authenticated users
- IP and device tracking for analytics

### Rate Limiting
- Global rate limiting on `/api` routes
- Configurable limits per endpoint

## Environment Variables

### AI Providers
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_MODEL` - OpenAI model (default: gpt-3.5-turbo)
- `GEMINI_API_KEY` - Google Gemini API key
- `GEMINI_MODEL` - Gemini model (default: gemini-pro)
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: us-east-1)
- `BEDROCK_MODEL_ID` - Bedrock model ID
- `AI_DEFAULT_PROVIDER` - Default AI provider (openai/gemini/bedrock)

### Database
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### Application
- `FRONTEND_URL` - CORS origin
- `NODE_ENV` - Environment (development/production)

## Performance Optimization

### Database Indexing
- Indexes on `contents.title`, `contents.slug`, `contents.tags`
- Composite indexes on search logs for analytics queries
- Trending cache for fast trending content retrieval

### Caching
- Trending content cached in `chatbot_trending_cache`
- Session data stored in localStorage
- Recent searches cached locally

### Async Operations
- Parallel API calls where possible
- Background logging (non-blocking)
- Lazy loading of analytics data

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Session data in localStorage (client-side)
- Database connection pooling

### AI Provider Switching
- Provider abstraction allows easy switching
- Multiple providers can coexist
- Runtime provider selection

### Analytics
- Aggregated queries for dashboard
- Date range filtering to limit data volume
- Pagination for large datasets
