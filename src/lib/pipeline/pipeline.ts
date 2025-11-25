import type { PipelineContext, PipelineStage } from './types'

export class ConversionPipeline {
  private stages: PipelineStage[] = []

  constructor(stages: PipelineStage[] = []) {
    this.stages = stages
  }

  addStage(stage: PipelineStage): this {
    this.stages.push(stage)
    return this
  }

  removeStage(stageName: string): this {
    this.stages = this.stages.filter((stage) => stage.name !== stageName)
    return this
  }

  replaceStage(stageName: string, newStage: PipelineStage): this {
    const index = this.stages.findIndex((stage) => stage.name === stageName)
    if (index !== -1) {
      this.stages[index] = newStage
    }
    return this
  }

  insertStageBefore(beforeStageName: string, newStage: PipelineStage): this {
    const index = this.stages.findIndex(
      (stage) => stage.name === beforeStageName
    )
    if (index !== -1) {
      this.stages.splice(index, 0, newStage)
    } else {
      this.stages.push(newStage)
    }
    return this
  }

  insertStageAfter(afterStageName: string, newStage: PipelineStage): this {
    const index = this.stages.findIndex((stage) => stage.name === afterStageName)
    if (index !== -1) {
      this.stages.splice(index + 1, 0, newStage)
    } else {
      this.stages.push(newStage)
    }
    return this
  }

  async execute(
    context: PipelineContext,
    onProgress?: (stage: string, index: number, total: number) => void
  ): Promise<PipelineContext> {
    let currentContext = context
    const total = this.stages.length

    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i]
      
      onProgress?.(stage.name, i + 1, total)

      try {
        currentContext = await Promise.resolve(stage.execute(currentContext))
      } catch (error) {
        throw new Error(
          `Pipeline failed at stage "${stage.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      }
    }

    return currentContext
  }

  getStages(): readonly PipelineStage[] {
    return this.stages
  }

  clear(): this {
    this.stages = []
    return this
  }

  clone(): ConversionPipeline {
    return new ConversionPipeline([...this.stages])
  }
}
