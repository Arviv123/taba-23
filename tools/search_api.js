/**
 * Smart Planning Search API
 * Advanced search functionality for Israeli Urban Planning Repository
 * Optimized for GitMCP and AI model integration
 */

const fs = require('fs');
const path = require('path');

class SmartPlanningSearch {
  constructor(repositoryPath) {
    this.repositoryPath = repositoryPath;
    this.masterIndex = null;
    this.searchKeywords = null;
    this.loadIndices();
  }

  /**
   * Load master index and search optimization data
   */
  loadIndices() {
    try {
      const masterIndexPath = path.join(this.repositoryPath, 'metadata', 'plans_master_index.json');
      this.masterIndex = JSON.parse(fs.readFileSync(masterIndexPath, 'utf8'));
      
      this.searchKeywords = this.masterIndex.search_keywords || {};
      console.log(`✅ Loaded ${this.masterIndex.repository_info.total_plans} plans from master index`);
    } catch (error) {
      console.error('❌ Error loading indices:', error.message);
      this.masterIndex = { quick_access: {}, search_optimization: {} };
    }
  }

  /**
   * Quick search in master index - optimized for speed
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Search results
   */
  quickSearch(query = "", options = {}) {
    const {
      city = null,
      status = null,
      landUse = null,
      planType = null,
      limit = 20
    } = options;

    let results = Object.values(this.masterIndex.quick_access || {});
    
    // Apply filters
    if (city) results = results.filter(plan => 
      plan.city === city || plan.city_en === city
    );
    
    if (status) results = results.filter(plan => 
      plan.status === status || plan.status_en === status
    );
    
    if (planType) results = results.filter(plan => 
      plan.type === planType || plan.type_en === planType
    );

    // Text search in keywords and basic info
    if (query && query.trim()) {
      const searchTerms = query.toLowerCase().split(/\s+/);
      results = results.filter(plan => 
        searchTerms.some(term => 
          (plan.keywords || []).some(keyword => 
            keyword.toLowerCase().includes(term)
          ) ||
          plan.city.toLowerCase().includes(term) ||
          (plan.city_en || '').toLowerCase().includes(term) ||
          plan.plan_number.includes(term) ||
          (plan.mahut || '').toLowerCase().includes(term)
        )
      );
    }

    // Sort by relevance and processing status
    results.sort((a, b) => {
      if (a.processing_complete && !b.processing_complete) return -1;
      if (!a.processing_complete && b.processing_complete) return 1;
      return new Date(b.last_updated || 0) - new Date(a.last_updated || 0);
    });

    return results.slice(0, limit).map(plan => ({
      planNumber: plan.plan_number || plan.planNumber,
      city: plan.city,
      cityEn: plan.city_en,
      status: plan.status,
      type: plan.type || plan.mahut,
      keywords: plan.keywords || [],
      summary: this.generateQuickSummary(plan),
      detailsPath: plan.path,
      lastUpdated: plan.last_updated,
      processingComplete: plan.processing_complete
    }));
  }

  /**
   * Search by structured parameters - for precise filtering
   * @param {Object} filters - Structured search filters
   * @returns {Array} Filtered results
   */
  structuredSearch(filters) {
    const {
      cityCode = null,
      statusList = null,
      dateFrom = null,
      dateTo = null,
      hasDocuments = null,
      documentTypes = null
    } = filters;

    let results = Object.values(this.masterIndex.quick_access || {});

    if (cityCode) {
      results = results.filter(plan => plan.city_code === cityCode);
    }

    if (statusList && Array.isArray(statusList)) {
      results = results.filter(plan => 
        statusList.includes(plan.status) || statusList.includes(plan.status_en)
      );
    }

    if (dateFrom || dateTo) {
      results = results.filter(plan => {
        const planDate = new Date(plan.status_date || plan.last_updated);
        if (dateFrom && planDate < new Date(dateFrom)) return false;
        if (dateTo && planDate > new Date(dateTo)) return false;
        return true;
      });
    }

    if (hasDocuments !== null) {
      results = results.filter(plan => {
        const hasRequiredDocs = plan.documents && 
          (plan.documents.takanon || plan.documents.tasritim || plan.documents.nispachim);
        return hasDocuments ? hasRequiredDocs : !hasRequiredDocs;
      });
    }

    return results;
  }

  /**
   * Get recommendations based on a specific plan
   * @param {string} planNumber - Base plan number
   * @returns {Array} Recommended similar plans
   */
  getRecommendations(planNumber) {
    const currentPlan = this.masterIndex.quick_access?.[planNumber];
    if (!currentPlan) return [];

    const allPlans = Object.values(this.masterIndex.quick_access || {});
    
    return allPlans
      .filter(plan => plan.plan_number !== planNumber)
      .filter(plan => 
        // Same city or similar type
        plan.city === currentPlan.city ||
        plan.type === currentPlan.type ||
        (plan.keywords || []).some(keyword => 
          (currentPlan.keywords || []).includes(keyword)
        )
      )
      .sort((a, b) => {
        // Prioritize same city, then same type
        let scoreA = 0, scoreB = 0;
        if (a.city === currentPlan.city) scoreA += 3;
        if (b.city === currentPlan.city) scoreB += 3;
        if (a.type === currentPlan.type) scoreA += 2;
        if (b.type === currentPlan.type) scoreB += 2;
        
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }

  /**
   * Get analytics and insights
   * @param {string} city - Optional city filter
   * @returns {Object} Analytics data
   */
  getInsights(city = null) {
    const plans = city ? 
      Object.values(this.masterIndex.quick_access || {}).filter(p => p.city === city) :
      Object.values(this.masterIndex.quick_access || {});

    const statusDistribution = {};
    const typeDistribution = {};
    const yearDistribution = {};

    plans.forEach(plan => {
      // Status distribution
      const status = plan.status || 'לא ידוע';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;

      // Type distribution
      const type = plan.type || plan.mahut || 'לא ידוע';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;

      // Year distribution
      try {
        const date = plan.status_date || plan.last_updated;
        const year = date ? new Date(date).getFullYear() : 'לא ידוע';
        yearDistribution[year] = (yearDistribution[year] || 0) + 1;
      } catch (e) {
        yearDistribution['לא ידוע'] = (yearDistribution['לא ידוע'] || 0) + 1;
      }
    });

    return {
      totalPlans: plans.length,
      processingRate: plans.filter(p => p.processing_complete).length / plans.length,
      statusDistribution,
      typeDistribution,
      yearDistribution,
      recentPlans: plans
        .sort((a, b) => new Date(b.last_updated || 0) - new Date(a.last_updated || 0))
        .slice(0, 10)
    };
  }

  /**
   * Search across city README files for contextual information
   * @param {string} query - Search query
   * @returns {Array} Contextual search results
   */
  async contextualSearch(query) {
    // This would search through README files, extracted content, etc.
    // For now, return enhanced results from quick search
    const baseResults = this.quickSearch(query);
    
    return baseResults.map(result => ({
      ...result,
      context: this.getContextualInfo(result.planNumber),
      relatedPlans: this.getRecommendations(result.planNumber).slice(0, 3)
    }));
  }

  /**
   * Generate a quick summary for a plan
   * @param {Object} plan - Plan object
   * @returns {string} Quick summary
   */
  generateQuickSummary(plan) {
    const city = plan.city || '';
    const type = plan.type || plan.mahut || 'תוכנית';
    const status = plan.status || 'בעיבוד';
    
    return `${type} ב${city} - ${status}`;
  }

  /**
   * Get contextual information for a plan
   * @param {string} planNumber - Plan number
   * @returns {Object} Contextual information
   */
  getContextualInfo(planNumber) {
    const plan = this.masterIndex.quick_access?.[planNumber];
    if (!plan) return {};

    // Get city-level context
    const cityPlans = Object.values(this.masterIndex.quick_access || {})
      .filter(p => p.city === plan.city);

    return {
      cityTotalPlans: cityPlans.length,
      cityApprovedPlans: cityPlans.filter(p => p.status === 'מאושר').length,
      similarTypePlans: cityPlans.filter(p => p.type === plan.type).length,
      cityDominantType: this.getCityDominantType(plan.city)
    };
  }

  /**
   * Get the dominant plan type for a city
   * @param {string} city - City name
   * @returns {string} Dominant plan type
   */
  getCityDominantType(city) {
    const cityPlans = Object.values(this.masterIndex.quick_access || {})
      .filter(p => p.city === city);
    
    const typeCount = {};
    cityPlans.forEach(plan => {
      const type = plan.type || plan.mahut || 'אחר';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.keys(typeCount).reduce((a, b) => 
      typeCount[a] > typeCount[b] ? a : b, 'אחר'
    );
  }

  /**
   * Export search results to different formats
   * @param {Array} results - Search results
   * @param {string} format - Export format (json, csv, md)
   * @returns {string} Exported data
   */
  exportResults(results, format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(results);
      case 'md':
      case 'markdown':
        return this.exportToMarkdown(results);
      case 'json':
      default:
        return JSON.stringify(results, null, 2);
    }
  }

  /**
   * Export results to CSV format
   */
  exportToCSV(results) {
    if (!results.length) return '';
    
    const headers = ['Plan Number', 'City', 'Type', 'Status', 'Last Updated'];
    const rows = results.map(r => [
      r.planNumber,
      r.city,
      r.type,
      r.status,
      r.lastUpdated
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Export results to Markdown format
   */
  exportToMarkdown(results) {
    let md = '# Search Results\n\n';
    
    results.forEach(result => {
      md += `## ${result.planNumber} - ${result.city}\n`;
      md += `- **Type:** ${result.type}\n`;
      md += `- **Status:** ${result.status}\n`;
      md += `- **Summary:** ${result.summary}\n`;
      if (result.keywords.length) {
        md += `- **Keywords:** ${result.keywords.join(', ')}\n`;
      }
      md += '\n';
    });

    return md;
  }
}

// Usage examples and API endpoints
if (require.main === module) {
  const search = new SmartPlanningSearch('../');
  
  // Example searches
  console.log('\n🔍 Quick Search Examples:');
  console.log(search.quickSearch("אור יהודה", { limit: 3 }));
  
  console.log('\n📊 City Insights:');
  console.log(search.getInsights("אור יהודה"));
  
  console.log('\n💡 Recommendations:');
  console.log(search.getRecommendations("552-0137539"));
}

module.exports = SmartPlanningSearch;