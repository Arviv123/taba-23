const express = require('express');
const cors = require('cors');
const path = require('path');
const SmartPlanningSearch = require('./tools/search_api.js');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'your-super-secret-api-key-123';

// Initialize search API
const search = new SmartPlanningSearch('./');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!providedKey || providedKey !== API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid API key required'
    });
  }
  
  next();
};

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Israeli Planning Repository API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      '/search': 'Quick search in planning database',
      '/search/structured': 'Advanced filtered search',
      '/plans/:planNumber': 'Get specific plan details',
      '/cities': 'List all cities',
      '/cities/:city/plans': 'Get plans for specific city',
      '/recommendations/:planNumber': 'Get plan recommendations',
      '/insights': 'Get repository insights',
      '/insights/:city': 'Get city-specific insights'
    },
    usage: {
      'API-Key': 'Include x-api-key header or ?api_key=KEY parameter',
      'Example': '/search?query=אור יהודה&api_key=your-key'
    }
  });
});

// Root endpoint - serve README
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'README.md'));
});

// API Routes (protected)

// Quick search
app.get('/search', validateApiKey, (req, res) => {
  try {
    const { query = '', city, status, planType, limit = 20 } = req.query;
    
    const results = search.quickSearch(query, {
      city,
      status, 
      planType,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      query: { query, city, status, planType, limit },
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// Structured search
app.post('/search/structured', validateApiKey, (req, res) => {
  try {
    const filters = req.body;
    const results = search.structuredSearch(filters);
    
    res.json({
      success: true,
      filters,
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({
      error: 'Structured search failed',
      message: error.message
    });
  }
});

// Get specific plan
app.get('/plans/:planNumber', validateApiKey, (req, res) => {
  try {
    const { planNumber } = req.params;
    const plan = search.masterIndex.quick_access?.[planNumber];
    
    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found',
        planNumber
      });
    }
    
    res.json({
      success: true,
      planNumber,
      plan,
      recommendations: search.getRecommendations(planNumber)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get plan',
      message: error.message
    });
  }
});

// List all cities
app.get('/cities', validateApiKey, (req, res) => {
  try {
    const cities = search.masterIndex.search_optimization?.by_city || {};
    
    res.json({
      success: true,
      count: Object.keys(cities).length,
      cities: Object.keys(cities).map(city => ({
        name: city,
        name_en: cities[city].city_en || city,
        total_plans: cities[city].count,
        characteristics: cities[city].characteristics || [],
        avg_building_height: cities[city].avg_building_height || 'לא ידוע'
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cities',
      message: error.message
    });
  }
});

// Get city plans
app.get('/cities/:city/plans', validateApiKey, (req, res) => {
  try {
    const { city } = req.params;
    const { limit = 50 } = req.query;
    
    const results = search.quickSearch('', {
      city,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      city,
      count: results.length,
      plans: results
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get city plans',
      message: error.message
    });
  }
});

// Get recommendations
app.get('/recommendations/:planNumber', validateApiKey, (req, res) => {
  try {
    const { planNumber } = req.params;
    const recommendations = search.getRecommendations(planNumber);
    
    res.json({
      success: true,
      planNumber,
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get recommendations', 
      message: error.message
    });
  }
});

// Get insights
app.get('/insights/:city?', validateApiKey, (req, res) => {
  try {
    const { city } = req.params;
    const insights = search.getInsights(city);
    
    res.json({
      success: true,
      city: city || 'all',
      insights
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get insights',
      message: error.message
    });
  }
});

// Export search results
app.post('/export', validateApiKey, (req, res) => {
  try {
    const { query, format = 'json', options = {} } = req.body;
    
    const results = search.quickSearch(query, options);
    const exported = search.exportResults(results, format);
    
    const contentType = format === 'csv' ? 'text/csv' : 
                       format === 'md' ? 'text/markdown' : 
                       'application/json';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="search-results.${format}"`);
    res.send(exported);
  } catch (error) {
    res.status(500).json({
      error: 'Export failed',
      message: error.message
    });
  }
});

// Statistics endpoint
app.get('/stats', validateApiKey, (req, res) => {
  try {
    const stats = {
      repository_info: search.masterIndex.repository_info,
      processing_status: search.masterIndex.repository_info?.processing_status,
      total_cities: Object.keys(search.masterIndex.search_optimization?.by_city || {}).length,
      plans_by_status: search.masterIndex.search_optimization?.by_status,
      plans_by_type: search.masterIndex.search_optimization?.by_type,
      recent_update: new Date().toISOString()
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} does not exist`,
    available_endpoints: [
      'GET /health',
      'GET /search',
      'POST /search/structured', 
      'GET /plans/:planNumber',
      'GET /cities',
      'GET /cities/:city/plans',
      'GET /recommendations/:planNumber',
      'GET /insights/:city?',
      'POST /export',
      'GET /stats'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Israeli Planning Repository API running on port ${PORT}`);
  console.log(`📊 Loaded ${search.masterIndex?.repository_info?.total_plans || 0} planning documents`);
  console.log(`🔑 API Key required for protected endpoints`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;