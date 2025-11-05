const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3'
const DATAFORSEO_API_KEY = process.env.DATAFORSEO_API_KEY

if (!DATAFORSEO_API_KEY) {
  console.warn('⚠️ DATAFORSEO_API_KEY is not set - keyword research will use mock data')
}

interface DataForSEOResponse {
  status_code: number
  status_message: string
  tasks: any[]
}

interface KeywordSuggestion {
  keyword: string
  search_volume: number
  competition: number
  competition_level: string
  cpc: number
}

interface KeywordDifficultyData {
  keyword: string
  difficulty: number
  search_volume: number
}

class DataForSEOClient {
  private apiKey: string | undefined
  private baseUrl: string

  constructor() {
    this.apiKey = DATAFORSEO_API_KEY
    this.baseUrl = DATAFORSEO_API_URL
  }

  private async makeRequest(endpoint: string, data: any, method: 'GET' | 'POST' = 'POST'): Promise<DataForSEOResponse> {
    if (!this.apiKey) {
      throw new Error('DataForSEO API key not configured')
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Basic ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
    }

    if (method === 'POST') {
      requestOptions.body = JSON.stringify(data)
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DataForSEO API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const responseData = await response.json()
    return responseData
  }

  async getKeywordSuggestions(
    seedKeywords: string[],
    location: number = 2840, // United States
    language: string = 'en'
  ): Promise<KeywordSuggestion[]> {
    try {
      const allSuggestions: KeywordSuggestion[] = []

      for (const seedKeyword of seedKeywords) {
        const requestData = [{
          keyword: seedKeyword,
          location_code: location,
          language_code: language,
          include_seed_keyword: false,
          include_serp_info: false,
          ignore_synonyms: false,
          filters: [
            ["keyword_info.competition_level","=","LOW"], "or", ["keyword_info.competition_level","=","MEDIUM"]
          ],
          include_clickstream_data: false,
          exact_match: false,
          limit: 100
        }]

        const response = await this.makeRequest('/dataforseo_labs/google/keyword_suggestions/live', requestData)

        if (response.status_code === 20000 && response.tasks?.[0]) {
          const task = response.tasks[0]

          if (task.status_code === 20000 && task.result && Array.isArray(task.result) && task.result[0]?.items) {
            const items = task.result[0].items

            const suggestions = items
              .filter((item: any) => {
                if (!item.keyword || typeof item.keyword !== 'string' || item.keyword.trim().length === 0) {
                  return false
                }
                const competition_level = item.keyword_info?.competition_level
                if (competition_level !== 'LOW' && competition_level !== 'MEDIUM') {
                  return false
                }
                const difficulty = item.keyword_info?.competition || 0
                const difficultyScore = difficulty * 100
                if (difficultyScore >= 60) {
                  return false
                }
                return true
              })
              .map((item: any) => ({
                keyword: item.keyword.trim(),
                search_volume: item.keyword_info?.search_volume || 0,
                competition: item.keyword_info?.competition || 0,
                competition_level: item.keyword_info?.competition_level || 'LOW',
                cpc: item.keyword_info?.cpc || 0
              }))

            allSuggestions.push(...suggestions)
          }
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }

      return allSuggestions

    } catch (error) {
      console.error('DataForSEO Error:', error)
      return this.getMockKeywordSuggestions(seedKeywords)
    }
  }

  async expandSeedKeywords(seedKeywords: string[], targetAudience: string): Promise<string[]> {
    try {
      const prompt = `You are an SEO keyword expert. Given these seed keywords that represent a user's app/business: "${seedKeywords.join(', ')}"

Target audience: ${targetAudience}

Generate 2-3 additional closely related seed keywords that would help discover more relevant long-tail keywords. Return only the new keywords as a comma-separated list, nothing else.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 100
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const newKeywords = data.choices[0].message.content
        .split(',')
        .map((kw: string) => kw.trim())
        .filter((kw: string) => kw.length > 0)

      return [...seedKeywords, ...newKeywords]

    } catch (error) {
      console.error('OpenAI Error:', error)
      return seedKeywords
    }
  }

  private getMockKeywordSuggestions(seedKeywords: string[]): KeywordSuggestion[] {
    const mockKeywords: KeywordSuggestion[] = []

    seedKeywords.forEach(seed => {
      const baseKeywords = [
        `${seed} tutorial`,
        `${seed} guide`,
        `${seed} examples`,
        `best ${seed}`,
        `${seed} tips`,
        `${seed} for beginners`,
        `${seed} vs`,
        `${seed} course`,
        `${seed} development`,
        `${seed} framework`,
        `${seed} library`,
        `${seed} documentation`,
        `${seed} features`,
        `${seed} performance`,
        `${seed} testing`
      ]

      baseKeywords.forEach(keyword => {
        mockKeywords.push({
          keyword,
          search_volume: Math.floor(Math.random() * 10000) + 500,
          competition: Math.random() * 0.8,
          competition_level: Math.random() > 0.5 ? 'MEDIUM' : 'LOW',
          cpc: Math.random() * 3 + 0.1
        })
      })
    })

    return mockKeywords
  }

  /**
   * Get real SEO difficulty scores using bulk API
   * Cost: 0.002 credits per keyword
   * Max: 1000 keywords per request
   */
  async getBulkKeywordDifficulty(
    keywords: string[],
    location: number = 2840, // United States
    language: string = 'en'
  ): Promise<KeywordDifficultyData[]> {
    if (keywords.length === 0) {
      console.log('⚠️  getBulkKeywordDifficulty: Empty keywords array, returning empty result')
      return []
    }

    console.log(`🔍 [DataForSEO] Bulk Keyword Difficulty API Call`)
    console.log(`   - Keywords count: ${keywords.length}`)
    console.log(`   - Location: ${location} (US)`)
    console.log(`   - Cost: ${(keywords.length * 0.002).toFixed(3)} credits (~$${(keywords.length * 0.002 * 1).toFixed(2)})`)
    console.log(`   - Sample keywords: ${keywords.slice(0, 3).join(', ')}...`)

    try {
      const requestData = [{
        keywords,
        location_code: location,
        language_code: language
      }]

      console.log(`📤 [DataForSEO] Sending request to bulk_keyword_difficulty...`)
      const startTime = Date.now()

      const response = await this.makeRequest(
        '/dataforseo_labs/google/bulk_keyword_difficulty/live',
        requestData
      )

      const duration = Date.now() - startTime
      console.log(`📥 [DataForSEO] Response received in ${duration}ms`)
      console.log(`   - Status code: ${response.status_code}`)
      console.log(`   - Status message: ${response.status_message}`)

      if (response.status_code === 20000 && response.tasks?.[0]) {
        const task = response.tasks[0]
        console.log(`   - Task status: ${task.status_code}`)

        if (task.status_code === 20000 && task.result && Array.isArray(task.result) && task.result[0]?.items) {
          const resultData = task.result[0]
          console.log(`   - Results count: ${resultData.total_count || 0}`)
          console.log(`   - Items count: ${resultData.items_count || 0}`)

          const results = resultData.items
            .filter((item: any) => {
              if (!item.keyword || typeof item.keyword !== 'string') {
                console.warn(`   ⚠️  Skipping invalid item: ${JSON.stringify(item)}`)
                return false
              }
              // Filter out items with null difficulty
              if (item.keyword_difficulty === null || item.keyword_difficulty === undefined) {
                console.warn(`   ⚠️  Skipping keyword with null difficulty: "${item.keyword}"`)
                return false
              }
              return true
            })
            .map((item: any) => ({
              keyword: item.keyword.trim(),
              difficulty: item.keyword_difficulty,
              search_volume: item.search_volume || 0
            }))

          console.log(`✅ [DataForSEO] Successfully got difficulty for ${results.length}/${keywords.length} keywords`)

          // Log some sample results
          if (results.length > 0) {
            console.log(`   Sample results:`)
            results.slice(0, 3).forEach((r: KeywordDifficultyData) => {
              console.log(`   - "${r.keyword}": difficulty=${r.difficulty}, volume=${r.search_volume}`)
            })
          }

          return results
        } else {
          console.error(`❌ [DataForSEO] Invalid task result structure`)
          console.error(`   Task: ${JSON.stringify(task, null, 2)}`)
        }
      } else {
        console.error(`❌ [DataForSEO] API error response`)
        console.error(`   Response: ${JSON.stringify(response, null, 2)}`)
      }

      console.warn('⚠️  Bulk difficulty API returned unexpected response, using fallback')
      return this.getMockKeywordDifficulty(keywords)

    } catch (error: any) {
      console.error('❌ [DataForSEO] Bulk Keyword Difficulty Error:')
      console.error(`   Message: ${error.message}`)
      console.error(`   Stack: ${error.stack}`)
      return this.getMockKeywordDifficulty(keywords)
    }
  }

  private getMockKeywordDifficulty(keywords: string[]): KeywordDifficultyData[] {
    return keywords.map(keyword => ({
      keyword,
      difficulty: Math.floor(Math.random() * 70) + 15,
      search_volume: Math.floor(Math.random() * 5000) + 500
    }))
  }

  /**
   * Research keywords with REAL SEO difficulty
   * Two-step process:
   * 1. Get suggestions with search volume
   * 2. Get bulk difficulty for all keywords
   * 3. Filter by difficulty < 35
   * 4. Score and return
   */
  async researchKeywords(
    seedKeywords: string[],
    targetAudience: string,
    maxSuggestions: number = 200  // Total suggestions to fetch
  ): Promise<Array<{
    keyword: string
    searchVolume: number
    adsCompetition: number
    seoDifficulty: number
    score: number
  }>> {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`🔬 [KEYWORD RESEARCH] Starting research process`)
    console.log(`${'='.repeat(80)}`)
    console.log(`Input:`)
    console.log(`  - Seed keywords: [${seedKeywords.join(', ')}]`)
    console.log(`  - Target audience: "${targetAudience}"`)
    console.log(`  - Max suggestions: ${maxSuggestions}`)

    try {
      // Validation
      if (seedKeywords.length < 3) {
        console.error(`❌ [VALIDATION] Need at least 3 seed keywords, got ${seedKeywords.length}`)
        throw new Error('Need at least 3 seed keywords for proper research')
      }
      console.log(`✅ [VALIDATION] Seed keywords count OK`)

      // Step 0: Expand seeds if needed
      let expandedSeeds = seedKeywords
      if (seedKeywords.length < 5) {
        console.log(`\n📝 [STEP 0] Expanding seeds (${seedKeywords.length} < 5)`)
        try {
          expandedSeeds = await this.expandSeedKeywords(seedKeywords, targetAudience)
          console.log(`✅ [STEP 0] Expanded to ${expandedSeeds.length} seeds: [${expandedSeeds.join(', ')}]`)
        } catch (error: any) {
          console.warn(`⚠️  [STEP 0] Failed to expand seeds: ${error.message}`)
          console.log(`   Continuing with original ${seedKeywords.length} seeds`)
        }
      } else {
        console.log(`✅ [STEP 0] Seeds count sufficient (${seedKeywords.length} >= 5), skipping expansion`)
      }

      // Calculate per-seed limit
      const perSeedLimit = Math.min(100, Math.ceil(maxSuggestions / expandedSeeds.length))
      console.log(`\n📊 [CALCULATION] Per-seed limit: ${perSeedLimit} (${expandedSeeds.length} seeds × ${perSeedLimit} ≈ ${maxSuggestions})`)

      // Step 1: Get suggestions with search volume
      console.log(`\n🔍 [STEP 1] Fetching keyword suggestions from DataForSEO`)
      const startSuggestions = Date.now()

      const suggestions = await this.getKeywordSuggestions(expandedSeeds, 2840, 'en')

      const durationSuggestions = Date.now() - startSuggestions
      console.log(`✅ [STEP 1] Received ${suggestions.length} total suggestions in ${durationSuggestions}ms`)

      // Deduplicate and validate
      console.log(`\n🔧 [PROCESSING] Deduplicating and validating...`)
      const validKeywords = suggestions
        .filter(kw => {
          if (!kw.keyword || typeof kw.keyword !== 'string' || kw.keyword.trim().length === 0) {
            console.warn(`   ⚠️  Invalid keyword: ${JSON.stringify(kw)}`)
            return false
          }
          return true
        })
        .filter((kw, index, arr) => {
          const firstIndex = arr.findIndex(k => k.keyword.toLowerCase() === kw.keyword.toLowerCase())
          return firstIndex === index // Keep only first occurrence
        })
        .sort((a, b) => b.search_volume - a.search_volume)
        .slice(0, maxSuggestions)

      console.log(`✅ [PROCESSING] After deduplication & limiting: ${validKeywords.length} unique keywords`)
      if (validKeywords.length > 0) {
        console.log(`   Top 3 by volume:`)
        validKeywords.slice(0, 3).forEach((kw, i) => {
          console.log(`   ${i + 1}. "${kw.keyword}" - volume: ${kw.search_volume}`)
        })
      }

      // Step 2: Get REAL SEO difficulty
      console.log(`\n🎯 [STEP 2] Getting SEO difficulty scores`)
      const keywordList = validKeywords.map(kw => kw.keyword)
      console.log(`   Requesting difficulty for ${keywordList.length} keywords`)
      console.log(`   Estimated cost: ${(keywordList.length * 0.002).toFixed(3)} credits (~$${(keywordList.length * 0.002).toFixed(2)})`)

      const startDifficulty = Date.now()
      const difficultyData = await this.getBulkKeywordDifficulty(keywordList)
      const durationDifficulty = Date.now() - startDifficulty

      console.log(`✅ [STEP 2] Received ${difficultyData.length} difficulty scores in ${durationDifficulty}ms`)

      // Step 3: Merge and score
      console.log(`\n🧮 [STEP 3] Merging data and calculating scores`)
      let matchedCount = 0
      let unmatchedCount = 0

      const processedKeywords = validKeywords.map(suggestion => {
        const diffData = difficultyData.find(d => d.keyword.toLowerCase() === suggestion.keyword.toLowerCase())

        if (!diffData) {
          unmatchedCount++
          if (unmatchedCount <= 3) {
            console.warn(`   ⚠️  No difficulty data for: "${suggestion.keyword}"`)
          }
        } else {
          matchedCount++
        }

        const seoDifficulty = diffData?.difficulty || 50

        // Score: (searchVolume / 50) + (100 - seoDifficulty)
        const volumeScore = Math.min(suggestion.search_volume / 50, 100)
        const difficultyScore = Math.max(100 - seoDifficulty, 0)
        const score = volumeScore + difficultyScore

        return {
          keyword: suggestion.keyword.trim(),
          searchVolume: suggestion.search_volume || 0,
          adsCompetition: suggestion.competition || 0,
          seoDifficulty: seoDifficulty,
          score: Math.round(score)
        }
      })

      console.log(`✅ [STEP 3] Merged data - matched: ${matchedCount}, unmatched: ${unmatchedCount}`)

      // Step 4: Filter by difficulty
      console.log(`\n🎯 [STEP 4] Filtering by difficulty < 35`)
      const beforeFilter = processedKeywords.length

      const finalKeywords = processedKeywords
        .filter(kw => kw.seoDifficulty < 35)
        .sort((a, b) => b.score - a.score)

      console.log(`✅ [STEP 4] After filtering: ${finalKeywords.length}/${beforeFilter} keywords (${((finalKeywords.length / beforeFilter) * 100).toFixed(1)}% pass rate)`)

      // Final summary
      console.log(`\n${'='.repeat(80)}`)
      console.log(`✅ [RESEARCH COMPLETE] Summary:`)
      console.log(`   - Total time: ${Date.now() - startSuggestions}ms`)
      console.log(`   - Keywords researched: ${validKeywords.length}`)
      console.log(`   - Keywords with difficulty < 35: ${finalKeywords.length}`)
      console.log(`   - Cost: ~$${(keywordList.length * 0.002).toFixed(2)}`)

      if (finalKeywords.length > 0) {
        console.log(`\n   Top 5 keywords:`)
        finalKeywords.slice(0, 5).forEach((kw, i) => {
          console.log(`   ${i + 1}. "${kw.keyword}"`)
          console.log(`      Volume: ${kw.searchVolume}, Difficulty: ${kw.seoDifficulty}, Score: ${kw.score}`)
        })
      } else {
        console.warn(`\n   ⚠️  WARNING: No keywords found with difficulty < 35!`)
        console.log(`   Try using different seed keywords or adjusting the difficulty threshold`)
      }

      console.log(`${'='.repeat(80)}\n`)

      return finalKeywords

    } catch (error: any) {
      console.error(`\n${'='.repeat(80)}`)
      console.error('❌ [FATAL ERROR] Keyword research failed')
      console.error(`   Message: ${error.message}`)
      console.error(`   Stack trace:`)
      console.error(error.stack)
      console.error(`${'='.repeat(80)}\n`)
      return []
    }
  }
}

export const dataForSEOClient = new DataForSEOClient()
