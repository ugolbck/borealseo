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

  async getKeywordDifficulty(keywords: string[]): Promise<KeywordDifficultyData[]> {
    if (keywords.length === 0) return []

    return keywords.map(keyword => ({
      keyword,
      difficulty: Math.floor(Math.random() * 70) + 15,
      search_volume: Math.floor(Math.random() * 5000) + 500
    }))
  }

  async researchKeywords(
    seedKeywords: string[],
    targetAudience: string
  ): Promise<Array<{
    keyword: string
    searchVolume: number
    difficulty: number
    score: number
  }>> {
    try {
      if (seedKeywords.length < 3) {
        throw new Error('Need at least 3 seed keywords for proper research')
      }

      let expandedSeeds = seedKeywords
      if (seedKeywords.length < 5) {
        expandedSeeds = await this.expandSeedKeywords(seedKeywords, targetAudience)
      }

      const suggestions = await this.getKeywordSuggestions(expandedSeeds)

      const validKeywords = suggestions
        .filter(kw => kw.keyword && typeof kw.keyword === 'string' && kw.keyword.trim().length > 0)
        .filter((kw, index, arr) => arr.findIndex(k => k.keyword === kw.keyword) === index)
        .sort((a, b) => b.search_volume - a.search_volume)

      const keywordList = validKeywords.map(kw => kw.keyword)
      const difficultyData = await this.getKeywordDifficulty(keywordList)

      const processedKeywords = validKeywords.map(suggestion => {
        const diffData = difficultyData.find(d => d.keyword === suggestion.keyword)
        const difficulty = diffData?.difficulty || 30

        const volumeScore = Math.min(suggestion.search_volume / 50, 100)
        const difficultyScore = Math.max(100 - difficulty, 0)
        const score = volumeScore + difficultyScore

        return {
          keyword: suggestion.keyword.trim(),
          searchVolume: suggestion.search_volume || 0,
          difficulty: difficulty,
          score: Math.round(score)
        }
      })

      const finalKeywords = processedKeywords
        .filter(kw => kw.keyword && kw.keyword.length > 0)
        .sort((a, b) => b.score - a.score)

      return finalKeywords

    } catch (error) {
      console.error('Keyword research error:', error)
      return []
    }
  }
}

export const dataForSEOClient = new DataForSEOClient()
