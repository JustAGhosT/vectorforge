import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ChatCircle,
  PaperPlaneTilt,
  Sparkle,
  User,
  Robot,
  CheckCircle,
  WarningCircle,
  ArrowClockwise,
  Lightbulb,
  Copy,
  Check,
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, parseLLMError } from '@/lib/utils'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  status?: 'pending' | 'success' | 'error'
  suggestedSvg?: string
}

interface AIChatPanelProps {
  currentSvg: string | null
  onApplySvgChange: (newSvg: string) => void
  onActivityLog?: (title: string, description: string, type: 'ai-chat') => void
  className?: string
}

const quickSuggestions = [
  'Add a red circle around the SVG',
  'Make the background transparent',
  'Scale the SVG to 50%',
  'Add a drop shadow effect',
  'Invert all colors',
  'Add a rounded border',
]

export function AIChatPanel({ 
  currentSvg, 
  onApplySvgChange,
  onActivityLog,
  className 
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const modifySvg = useCallback(async (instruction: string, svg: string): Promise<string> => {
    if (!window.spark?.llm) {
      throw new Error('AI service not available')
    }

    const prompt = `You are an SVG modification expert. Given an SVG and a user instruction, modify the SVG accordingly.

Current SVG:
\`\`\`xml
${svg}
\`\`\`

User instruction: "${instruction}"

Important rules:
1. Return ONLY the modified SVG code, no explanations or markdown
2. Preserve the original content while applying the requested modification
3. For wrapper modifications (circles, borders, backgrounds), wrap the existing content appropriately
4. Keep the SVG valid and well-formed
5. If the instruction cannot be applied, return the original SVG unchanged

Modified SVG:`

    let response: string
    try {
      response = await window.spark.llm(prompt, 'gpt-4o', false)
    } catch (error) {
      // Re-throw with a cleaner error message
      throw new Error(parseLLMError(error))
    }
    
    if (!response) {
      throw new Error('No response received from AI service')
    }
    
    // Check if response looks like an error page (HTML)
    if (response.includes('<!DOCTYPE') || response.includes('<html')) {
      throw new Error('LLM service returned an error. Please try again later.')
    }
    
    // Extract SVG from response (handle potential markdown wrapper)
    let svgContent = response.trim()
    
    // Remove markdown code blocks if present
    if (svgContent.startsWith('```')) {
      const lines = svgContent.split('\n')
      lines.shift() // Remove opening ```xml or ```svg
      while (lines.length > 0 && !lines[lines.length - 1].startsWith('</svg>')) {
        if (lines[lines.length - 1].trim() === '```') {
          lines.pop()
          break
        }
        lines.pop()
      }
      svgContent = lines.join('\n')
    }
    
    // Validate it looks like SVG
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      throw new Error('Invalid SVG response from AI')
    }
    
    return svgContent
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || !currentSvg || isProcessing) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    onActivityLog?.(`AI Chat: ${input.trim().substring(0, 50)}...`, 'Processing SVG modification request', 'ai-chat')

    // Add pending assistant message
    const assistantMessageId = `assistant-${Date.now()}`
    const pendingMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: 'Analyzing and modifying your SVG...',
      timestamp: Date.now(),
      status: 'pending',
    }
    setMessages(prev => [...prev, pendingMessage])

    try {
      const modifiedSvg = await modifySvg(userMessage.content, currentSvg)
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              content: "I've modified your SVG based on your request. Click 'Apply Changes' to see the result.",
              status: 'success',
              suggestedSvg: modifiedSvg,
            }
          : msg
      ))

      onActivityLog?.('SVG modification ready', 'AI has prepared the modified SVG', 'ai-chat')
      toast.success('SVG modification ready', {
        description: 'Click "Apply Changes" to see the result',
      })
    } catch (error) {
      const errorMessage = parseLLMError(error)
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              content: `Sorry, I couldn't process that request: ${errorMessage}`,
              status: 'error',
            }
          : msg
      ))

      toast.error('Failed to modify SVG', {
        description: errorMessage,
      })
    } finally {
      setIsProcessing(false)
    }
  }, [input, currentSvg, isProcessing, modifySvg, onActivityLog])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleApplySuggestion = useCallback((suggestion: string) => {
    setInput(suggestion)
    textareaRef.current?.focus()
  }, [])

  const handleApplyChange = useCallback((svg: string) => {
    onApplySvgChange(svg)
    onActivityLog?.('Applied SVG modification', 'The AI-modified SVG is now displayed', 'ai-chat')
    toast.success('SVG updated!', {
      description: 'The modification has been applied',
    })
  }, [onApplySvgChange, onActivityLog])

  const handleCopyCode = useCallback(async (svg: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(svg)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success('SVG code copied to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md">
            <ChatCircle className="w-4 h-4 text-primary" weight="fill" />
          </div>
          <div>
            <CardTitle className="text-base">AI SVG Editor</CardTitle>
            <CardDescription className="text-xs">
              Describe changes to make to your SVG
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-3 p-3 pt-0">
        {/* Quick suggestions */}
        {messages.length === 0 && currentSvg && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lightbulb className="w-3.5 h-3.5" weight="fill" />
              <span>Quick suggestions</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickSuggestions.slice(0, 4).map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] px-2"
                  onClick={() => handleApplySuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <ScrollArea className="flex-1 -mx-3 px-3" ref={scrollRef}>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex gap-2',
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    )}>
                      {message.role === 'user' 
                        ? <User className="w-3.5 h-3.5" weight="bold" />
                        : <Robot className="w-3.5 h-3.5" weight="fill" />
                      }
                    </div>
                    <div className={cn(
                      'flex-1 space-y-2',
                      message.role === 'user' ? 'text-right' : ''
                    )}>
                      <div className={cn(
                        'inline-block p-2.5 rounded-lg text-xs',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.status === 'pending' && (
                          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
                            <ArrowClockwise className="w-3 h-3 animate-spin" />
                            <span className="text-[10px]">Processing...</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons for successful modification */}
                      {message.suggestedSvg && message.status === 'success' && (
                        <div className="flex gap-1.5 justify-start">
                          <Button
                            size="sm"
                            className="h-7 text-[11px] gap-1.5"
                            onClick={() => handleApplyChange(message.suggestedSvg!)}
                          >
                            <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                            Apply Changes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1.5"
                            onClick={() => handleCopyCode(message.suggestedSvg!, message.id)}
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" weight="bold" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" weight="bold" />
                                Copy SVG
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}

        {/* Empty state when no SVG */}
        {!currentSvg && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <Sparkle className="w-8 h-8 text-muted-foreground/50 mb-2" weight="light" />
            <p className="text-sm text-muted-foreground">No SVG to edit</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Upload and convert an image first
            </p>
          </div>
        )}

        {/* Input area */}
        {currentSvg && (
          <div className="relative mt-auto">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the changes you want..."
              className="min-h-[80px] pr-12 text-sm resize-none"
              disabled={isProcessing}
            />
            <Button
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8"
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
            >
              <PaperPlaneTilt className="w-4 h-4" weight="fill" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
