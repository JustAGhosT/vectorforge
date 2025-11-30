import { parseLLMError } from './utils'
import { llm, isLLMConfigured } from './llm'

export interface ImageRating {
  /** Visual quality score (0-100) */
  score: number
  /** Explanation of why this rating was given */
  reasoning: string
}

export interface ComparisonResult {
  /** Similarity score as a percentage (0-100) */
  similarityScore: number
  /** Confidence level of the similarity score (0-100) */
  confidence: number
  /** Visual quality rating of the original image */
  originalRating: ImageRating
  /** Visual quality rating of the converted SVG */
  convertedRating: ImageRating
  /** List of key differences between original and converted */
  differences: DifferenceItem[]
  /** Brief summary of the comparison */
  summary: string
  /** Timestamp when comparison was made */
  timestamp: number
}

export interface DifferenceItem {
  /** Category of the difference */
  category: 'color' | 'shape' | 'detail' | 'edge' | 'texture' | 'other'
  /** Description of the difference */
  description: string
  /** Severity of the difference (how noticeable it is) */
  severity: 'minor' | 'moderate' | 'significant'
}

/**
 * Analyzes the differences between an original image and its SVG conversion
 * using AI to provide a detailed comparison with similarity rating.
 */
export async function analyzeConversionComparison(
  originalDataUrl: string,
  svgDataUrl: string
): Promise<ComparisonResult> {
  const promptText = `You are an expert image quality evaluator. Compare the original image with its SVG vector conversion.

## Your Task:
Analyze both images and provide:
1. A similarity score (0-100) indicating how closely the SVG matches the original
2. A confidence level (0-100) for your similarity assessment
3. Individual visual quality ratings for BOTH the original AND the converted image
4. A list of key differences between the images
5. A brief summary

## Visual Quality Rating Guidelines:
Rate each image on visual quality (0-100) considering:
- **Clarity**: How clear and well-defined the image appears
- **Aesthetics**: Overall visual appeal and professional appearance
- **Usability**: How suitable it is for practical use (web, print, etc.)

Note: The converted SVG might score HIGHER than the original if:
- It has cleaner lines and edges
- Colors are more consistent and unified
- Noise or artifacts from the original are removed
- The simplified vector style enhances the design

## Evaluation Criteria:
- **Color Fidelity**: How well colors are preserved
- **Shape Accuracy**: How accurately shapes and contours are reproduced
- **Detail Preservation**: Whether fine details are retained or lost
- **Edge Quality**: Sharpness and accuracy of edges
- **Texture Representation**: How gradients and textures are handled

## Scoring Guidelines:
- 90-100%: Excellent - Nearly indistinguishable, minimal differences
- 75-89%: Good - Minor visible differences, maintains overall appearance
- 60-74%: Fair - Noticeable differences, but recognizable
- Below 60%: Poor - Significant differences, may not be suitable

## Response Format:
Return a JSON object with:
{
  "similarityScore": 0-100,
  "confidence": 0-100,
  "originalRating": {
    "score": 0-100,
    "reasoning": "Brief explanation of the original image's visual quality rating"
  },
  "convertedRating": {
    "score": 0-100,
    "reasoning": "Brief explanation of the converted SVG's visual quality rating"
  },
  "differences": [
    {
      "category": "color|shape|detail|edge|texture|other",
      "description": "Brief description of the difference",
      "severity": "minor|moderate|significant"
    }
  ],
  "summary": "2-3 sentence summary of overall comparison"
}

Provide 3-6 key differences. Be specific and constructive.
Return only valid JSON, no other text.`

  try {
    if (!isLLMConfigured()) {
      throw new Error('AI service not available')
    }

    let response: string
    try {
      response = await llm(promptText, undefined, true)
    } catch (llmError) {
      throw new Error(parseLLMError(llmError))
    }

    if (!response) {
      throw new Error('No response from AI service')
    }

    // Check if response looks like an error page (HTML)
    if (response.includes('<!DOCTYPE') || response.includes('<html')) {
      throw new Error('LLM service returned an error. Please try again later.')
    }

    const parsed = JSON.parse(response)

    // Validate and normalize the response
    const similarityScore = clamp(Number(parsed.similarityScore) || 0, 0, 100)
    const confidence = clamp(Number(parsed.confidence) || 0, 0, 100)

    const differences: DifferenceItem[] = Array.isArray(parsed.differences)
      ? parsed.differences.slice(0, 10).map((diff: Record<string, unknown>) => ({
          category: validateCategory(String(diff.category || 'other')),
          description: String(diff.description || 'No description provided').substring(0, 200),
          severity: validateSeverity(String(diff.severity || 'moderate')),
        }))
      : []

    // Parse and validate ratings
    const originalRating: ImageRating = {
      score: clamp(Number(parsed.originalRating?.score) || 70, 0, 100),
      reasoning: String(parsed.originalRating?.reasoning || 'Original image quality assessed.').substring(0, 300),
    }

    const convertedRating: ImageRating = {
      score: clamp(Number(parsed.convertedRating?.score) || 70, 0, 100),
      reasoning: String(parsed.convertedRating?.reasoning || 'Converted SVG quality assessed.').substring(0, 300),
    }

    return {
      similarityScore,
      confidence,
      originalRating,
      convertedRating,
      differences,
      summary: String(parsed.summary || 'Comparison completed.').substring(0, 500),
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('AI comparison failed:', error)
    throw new Error(parseLLMError(error))
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function validateCategory(category: string): DifferenceItem['category'] {
  const validCategories = ['color', 'shape', 'detail', 'edge', 'texture', 'other']
  return validCategories.includes(category)
    ? (category as DifferenceItem['category'])
    : 'other'
}

function validateSeverity(severity: string): DifferenceItem['severity'] {
  const validSeverities = ['minor', 'moderate', 'significant']
  return validSeverities.includes(severity)
    ? (severity as DifferenceItem['severity'])
    : 'moderate'
}

/**
 * Returns a human-readable label for the similarity score
 */
export function getSimilarityLabel(score: number): {
  label: string
  color: 'green' | 'yellow' | 'orange' | 'red'
} {
  if (score >= 90) {
    return { label: 'Excellent', color: 'green' }
  } else if (score >= 75) {
    return { label: 'Good', color: 'yellow' }
  } else if (score >= 60) {
    return { label: 'Fair', color: 'orange' }
  } else {
    return { label: 'Needs Improvement', color: 'red' }
  }
}

/**
 * Returns a human-readable label for image quality rating
 */
export function getRatingLabel(score: number): {
  label: string
  color: 'green' | 'yellow' | 'orange' | 'red'
} {
  if (score >= 85) {
    return { label: 'Excellent', color: 'green' }
  } else if (score >= 70) {
    return { label: 'Good', color: 'yellow' }
  } else if (score >= 50) {
    return { label: 'Fair', color: 'orange' }
  } else {
    return { label: 'Poor', color: 'red' }
  }
}

/**
 * Returns icon/badge info based on difference severity
 */
export function getSeverityInfo(severity: DifferenceItem['severity']): {
  label: string
  color: string
} {
  switch (severity) {
    case 'minor':
      return { label: 'Minor', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    case 'moderate':
      return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
    case 'significant':
      return { label: 'Significant', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    default:
      return { label: 'Unknown', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
  }
}

/**
 * Returns icon name for the difference category
 */
export function getCategoryIcon(category: DifferenceItem['category']): string {
  switch (category) {
    case 'color':
      return 'Palette'
    case 'shape':
      return 'Polygon'
    case 'detail':
      return 'MagnifyingGlass'
    case 'edge':
      return 'BoundingBox'
    case 'texture':
      return 'Gradient'
    default:
      return 'Question'
  }
}
